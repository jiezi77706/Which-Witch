import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { workId, tokenId, isMinted, ownerAddress, tokenURI, mintTxHash } = await request.json()

    if (!workId) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      )
    }

    // 更新作品的NFT状态
    const { data, error } = await supabase
      .from('works')
      .update({
        nft_token_id: tokenId,
        nft_minted: isMinted,
        nft_owner_address: ownerAddress,
        nft_token_uri: tokenURI,
        nft_mint_tx_hash: mintTxHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', workId)
      .select()

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: 'Failed to update NFT status in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'NFT status updated successfully',
      data: data?.[0]
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}