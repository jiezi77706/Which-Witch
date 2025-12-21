import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')

    if (!workId) {
      return NextResponse.json({ error: 'Work ID is required' }, { status: 400 })
    }

    // 查询该作品是否已有投票
    const { data: voting, error } = await supabase
      .from('work_votings')
      .select('id, title, status, end_date')
      .eq('work_id', workId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!voting) {
      return NextResponse.json({ hasVoting: false })
    }

    // 检查投票状态
    const now = new Date()
    const endDate = new Date(voting.end_date)
    let votingStatus = voting.status

    // 如果投票已过期但状态还是active，更新为ended
    if (votingStatus === 'active' && now > endDate) {
      await supabase
        .from('work_votings')
        .update({ status: 'ended' })
        .eq('id', voting.id)
      
      votingStatus = 'ended'
    }

    return NextResponse.json({
      hasVoting: true,
      votingStatus,
      votingTitle: voting.title,
      votingId: voting.id
    })

  } catch (error) {
    console.error('Error checking work voting status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}