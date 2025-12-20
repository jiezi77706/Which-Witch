import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      workId, 
      title, 
      description, 
      options, 
      endDate, 
      reward, 
      creatorAddress 
    } = body

    // 验证必需字段
    if (!workId || !title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ 
        error: 'Missing required fields or insufficient options' 
      }, { status: 400 })
    }

    // 检查该作品是否已有投票
    const { data: existingVoting } = await supabase
      .from('work_votings')
      .select('id')
      .eq('work_id', workId)
      .single()

    if (existingVoting) {
      return NextResponse.json({ 
        error: 'This work already has a voting' 
      }, { status: 400 })
    }

    // 创建投票
    const { data: voting, error: votingError } = await supabase
      .from('work_votings')
      .insert({
        work_id: workId,
        title,
        description,
        voting_type: 'other', // 可以根据需要调整
        status: 'active',
        end_date: endDate,
        creator_address: creatorAddress,
        total_votes: 0,
        total_participants: 0
      })
      .select()
      .single()

    if (votingError) {
      console.error('Error creating voting:', votingError)
      return NextResponse.json({ error: 'Failed to create voting' }, { status: 500 })
    }

    // 创建投票选项
    const votingOptions = options.map((option: any, index: number) => ({
      voting_id: voting.id,
      title: option.title,
      description: option.description,
      vote_count: 0,
      percentage: 0,
      sort_order: index
    }))

    const { error: optionsError } = await supabase
      .from('voting_options')
      .insert(votingOptions)

    if (optionsError) {
      console.error('Error creating voting options:', optionsError)
      // 如果选项创建失败，删除已创建的投票
      await supabase.from('work_votings').delete().eq('id', voting.id)
      return NextResponse.json({ error: 'Failed to create voting options' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voting: {
        id: voting.id,
        title: voting.title,
        status: voting.status
      }
    })

  } catch (error) {
    console.error('Error creating voting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}