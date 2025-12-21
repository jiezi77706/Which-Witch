import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { votingId, optionId } = body

    // 这里应该从认证中获取用户地址，暂时使用模拟地址
    const voterAddress = '0x1234567890123456789012345678901234567890' // TODO: 从认证获取

    if (!votingId || !optionId || !voterAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // 检查投票是否存在且活跃
    const { data: voting, error: votingError } = await supabase
      .from('work_votings')
      .select('id, status, end_date')
      .eq('id', votingId)
      .single()

    if (votingError || !voting) {
      return NextResponse.json({ error: 'Voting not found' }, { status: 404 })
    }

    if (voting.status !== 'active') {
      return NextResponse.json({ error: 'Voting is not active' }, { status: 400 })
    }

    // 检查投票是否已过期
    if (new Date(voting.end_date) < new Date()) {
      // 更新投票状态为已结束
      await supabase
        .from('work_votings')
        .update({ status: 'ended' })
        .eq('id', votingId)
      
      return NextResponse.json({ error: 'Voting has ended' }, { status: 400 })
    }

    // 检查用户是否已经投过票
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('id')
      .eq('voting_id', votingId)
      .eq('voter_address', voterAddress)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 })
    }

    // 检查选项是否存在
    const { data: option, error: optionError } = await supabase
      .from('voting_options')
      .select('id, vote_count')
      .eq('id', optionId)
      .eq('voting_id', votingId)
      .single()

    if (optionError || !option) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
    }

    // 开始事务：记录投票并更新计数
    const { error: voteError } = await supabase
      .from('user_votes')
      .insert({
        voting_id: votingId,
        option_id: optionId,
        voter_address: voterAddress
      })

    if (voteError) {
      console.error('Error recording vote:', voteError)
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
    }

    // 更新选项投票数
    const { error: updateOptionError } = await supabase
      .from('voting_options')
      .update({ vote_count: option.vote_count + 1 })
      .eq('id', optionId)

    if (updateOptionError) {
      console.error('Error updating option count:', updateOptionError)
    }

    // 更新投票总数和参与者数
    const { data: totalVotes } = await supabase
      .from('user_votes')
      .select('id', { count: 'exact' })
      .eq('voting_id', votingId)

    const { data: totalParticipants } = await supabase
      .from('user_votes')
      .select('voter_address', { count: 'exact' })
      .eq('voting_id', votingId)

    await supabase
      .from('work_votings')
      .update({ 
        total_votes: totalVotes?.length || 0,
        total_participants: totalParticipants?.length || 0
      })
      .eq('id', votingId)

    // 重新计算所有选项的百分比
    const { data: allOptions } = await supabase
      .from('voting_options')
      .select('id, vote_count')
      .eq('voting_id', votingId)

    if (allOptions && totalVotes) {
      const totalVoteCount = totalVotes.length
      for (const opt of allOptions) {
        const percentage = totalVoteCount > 0 ? (opt.vote_count / totalVoteCount) * 100 : 0
        await supabase
          .from('voting_options')
          .update({ percentage: Math.round(percentage * 100) / 100 })
          .eq('id', opt.id)
      }
    }

    return NextResponse.json({ success: true, message: 'Vote recorded successfully' })

  } catch (error) {
    console.error('Error processing vote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}