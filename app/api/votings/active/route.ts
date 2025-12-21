import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 获取活跃的投票，包含作品信息和选项
    const { data: votings, error } = await supabase
      .from('work_votings')
      .select(`
        *,
        work:works!work_votings_work_id_fkey(
          work_id,
          title,
          image_url,
          creator_address
        ),
        options:voting_options(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 检查并更新过期的投票
    const now = new Date()
    const expiredVotings = votings?.filter(voting => 
      new Date(voting.end_date) < now
    ) || []

    if (expiredVotings.length > 0) {
      const expiredIds = expiredVotings.map(v => v.id)
      await supabase
        .from('work_votings')
        .update({ status: 'ended' })
        .in('id', expiredIds)

      // 重新获取活跃投票
      const { data: activeVotings } = await supabase
        .from('work_votings')
        .select(`
          *,
          work:works!work_votings_work_id_fkey(
            work_id,
            title,
            image_url,
            creator_address
          ),
          options:voting_options(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      return NextResponse.json({ votings: activeVotings || [] })
    }

    return NextResponse.json({ votings: votings || [] })

  } catch (error) {
    console.error('Error fetching active votings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}