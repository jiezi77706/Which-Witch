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
      transactionHash,
      fromAddress,
      toAddress,
      amount,
      targetChainId,
      workId,
      creatorName,
      timestamp,
      status = 'pending'
    } = body

    // 验证必需字段
    if (!transactionHash || !fromAddress || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 插入跨链打赏记录
    const { data, error } = await supabase
      .from('cross_chain_tips')
      .insert({
        transaction_hash: transactionHash,
        from_address: fromAddress.toLowerCase(),
        to_address: toAddress.toLowerCase(),
        amount: amount,
        target_chain_id: targetChainId,
        work_id: workId,
        creator_name: creatorName,
        status: status,
        created_at: timestamp || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const workId = searchParams.get('workId')

    let query = supabase
      .from('cross_chain_tips')
      .select('*')
      .order('created_at', { ascending: false })

    if (address) {
      query = query.or(`from_address.eq.${address.toLowerCase()},to_address.eq.${address.toLowerCase()}`)
    }

    if (workId) {
      query = query.eq('work_id', workId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}