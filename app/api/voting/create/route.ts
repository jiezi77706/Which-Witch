import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface CreateVotingRequest {
  workId: number
  title: string
  description: string
  votingType: string
  creatorAddress: string
  endDate: string
  options: Array<{
    title: string
    description: string
    imageUrl?: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateVotingRequest = await request.json()
    const { workId, title, description, votingType, creatorAddress, endDate, options } = body

    // 验证必填字段
    if (!workId || !title || !creatorAddress || !endDate || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields or insufficient options (minimum 2)' },
        { status: 400 }
      )
    }

    // 验证选项
    for (const option of options) {
      if (!option.title) {
        return NextResponse.json(
          { error: 'All options must have a title' },
          { status: 400 }
        )
      }
    }

    console.log('📊 Creating voting:', { workId, title, optionsCount: options.length })

    // 验证作品存在
    const { data: work, error: workError } = await supabaseAdmin
      .from('works')
      .select('work_id, creator_address')
      .eq('work_id', workId)
      .single()

    if (workError || !work) {
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    // 验证创建者权限（只有作品创建者可以创建投票）
    if (work.creator_address.toLowerCase() !== creatorAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only work creator can create voting' },
        { status: 403 }
      )
    }

    try {
      // 使用数据库函数创建投票
      const { data: votingId, error } = await supabaseAdmin
        .rpc('create_work_voting', {
          p_work_id: workId,
          p_title: title,
          p_description: description,
          p_voting_type: votingType,
          p_creator_address: creatorAddress,
          p_end_date: endDate,
          p_options: JSON.stringify(options)
        })

      if (error) {
        console.error('Database function error:', error)
        throw error
      }

      console.log('✅ Voting created successfully:', votingId)

      // 获取创建的投票详情
      const { data: createdVoting, error: fetchError } = await supabaseAdmin
        .from('work_votings')
        .select(`
          *,
          voting_options (
            id,
            title,
            description,
            vote_count,
            percentage,
            sort_order,
            image_url
          )
        `)
        .eq('id', votingId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch created voting:', fetchError)
      }

      return NextResponse.json({
        success: true,
        votingId: votingId,
        voting: createdVoting,
        message: 'Voting created successfully'
      })

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      
      // 如果数据库函数不存在，使用简化版本
      if (dbError instanceof Error && dbError.message.includes('function')) {
        console.log('⚠️ Using fallback voting creation method')
        
        // 简化的创建逻辑
        const { data: voting, error: insertError } = await supabaseAdmin
          .from('work_votings')
          .insert({
            work_id: workId,
            title: title,
            description: description,
            voting_type: votingType,
            creator_address: creatorAddress.toLowerCase(),
            end_date: endDate,
            status: 'active'
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        // 创建选项
        const optionsToInsert = options.map((option, index) => ({
          voting_id: voting.id,
          title: option.title,
          description: option.description,
          image_url: option.imageUrl,
          sort_order: index
        }))

        const { error: optionsError } = await supabaseAdmin
          .from('voting_options')
          .insert(optionsToInsert)

        if (optionsError) {
          // 如果选项插入失败，删除已创建的投票
          await supabaseAdmin
            .from('work_votings')
            .delete()
            .eq('id', voting.id)
          
          throw optionsError
        }

        return NextResponse.json({
          success: true,
          votingId: voting.id,
          message: 'Voting created successfully (fallback mode)'
        })
      }
      
      throw dbError
    }

  } catch (error) {
    console.error('Create voting error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create voting',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: 获取用户创建的投票
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creatorAddress')
    const workId = searchParams.get('workId')

    if (!creatorAddress && !workId) {
      return NextResponse.json(
        { error: 'creatorAddress or workId is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('work_votings')
      .select(`
        *,
        voting_options (
          id,
          title,
          description,
          vote_count,
          percentage,
          sort_order,
          image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (creatorAddress) {
      query = query.eq('creator_address', creatorAddress.toLowerCase())
    }
    
    if (workId) {
      query = query.eq('work_id', workId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ votings: data })

  } catch (error) {
    console.error('Get user votings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch votings' },
      { status: 500 }
    )
  }
}