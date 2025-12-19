import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { tempWorkId, blockchainWorkId, txHash } = await request.json()

    if (!tempWorkId || !blockchainWorkId || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: tempWorkId, blockchainWorkId, txHash' },
        { status: 400 }
      )
    }

    console.log('Updating blockchain info:', { tempWorkId, blockchainWorkId, txHash })

    // 更新作品的区块链信息
    const { data, error } = await supabase
      .from('works')
      .update({
        id: blockchainWorkId, // 更新为区块链上的真实ID
        tx_hash: txHash,
        is_on_chain: true,
        upload_status: 'minted',
        updated_at: new Date().toISOString()
      })
      .eq('id', tempWorkId) // 根据临时ID查找
      .select()

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: 'Failed to update work in database', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('No work found with tempWorkId:', tempWorkId)
      return NextResponse.json(
        { error: 'Work not found' },
        { status: 404 }
      )
    }

    console.log('✅ Blockchain info updated successfully:', data[0])

    return NextResponse.json({
      success: true,
      message: 'Blockchain info updated successfully',
      data: data[0]
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}