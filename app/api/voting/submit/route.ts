import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { votingId, optionId, voterAddress } = await request.json()

    // 验证必填字段
    if (!votingId || !optionId || !voterAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: votingId, optionId, voterAddress' },
        { status: 400 }
      )
    }

    console.log('📊 Submitting vote:', { votingId, optionId, voterAddress })

    // 调用数据库函数提交投票
    try {
      const { data, error } = await supabaseAdmin
        .rpc('submit_vote', {
          p_voting_id: votingId,
          p_option_id: optionId,
          p_voter_address: voterAddress,
          p_vote_weight: 1.0
        })

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      console.log('✅ Vote submitted successfully')

      // 获取更新后的投票统计
      const { data: votingStats, error: statsError } = await supabaseAdmin
        .from('work_votings')
        .select(`
          *,
          voting_options (
            id,
            title,
            description,
            vote_count,
            percentage,
            sort_order
          )
        `)
        .eq('id', votingId)
        .single()

      if (statsError) {
        console.error('Failed to fetch updated stats:', statsError)
      }

      return NextResponse.json({
        success: true,
        message: 'Vote submitted successfully',
        updatedVoting: votingStats
      })

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      
      // 如果数据库函数不存在，使用简化版本
      if (dbError instanceof Error && dbError.message.includes('function')) {
        console.log('⚠️ Using fallback voting method')
        
        // 简化的投票逻辑
        const { data: existingVote } = await supabaseAdmin
          .from('user_votes')
          .select('id')
          .eq('voting_id', votingId)
          .eq('voter_address', voterAddress.toLowerCase())
          .single()

        if (existingVote) {
          return NextResponse.json(
            { error: 'User has already voted' },
            { status: 400 }
          )
        }

        // 插入投票记录
        const { error: insertError } = await supabaseAdmin
          .from('user_votes')
          .insert({
            voting_id: votingId,
            option_id: optionId,
            voter_address: voterAddress.toLowerCase()
          })

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({
          success: true,
          message: 'Vote submitted successfully (fallback mode)'
        })
      }
      
      throw dbError
    }

  } catch (error) {
    console.error('Vote submission error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit vote',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: 获取投票信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const votingId = searchParams.get('votingId')

    if (!workId && !votingId) {
      return NextResponse.json(
        { error: 'workId or votingId is required' },
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
          sort_order
        )
      `)
      .order('created_at', { ascending: false })

    if (votingId) {
      query = query.eq('id', votingId)
    } else if (workId) {
      query = query.eq('work_id', workId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch voting data:', error)
      
      // 如果表不存在，返回空数据
      if (error.code === '42P01') {
        return NextResponse.json({ votings: [] })
      }
      
      throw error
    }

    return NextResponse.json({ votings: data })

  } catch (error) {
    console.error('Get voting error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voting data' },
      { status: 500 }
    )
  }
}