import { NextRequest, NextResponse } from 'next/server'
import { getAllLockedUsers, unlockUserFunds, transferLockedFunds } from '@/lib/web3/services/copyright-protection.service'

// GET: 获取所有被锁定的用户
export async function GET(request: NextRequest) {
  try {
    const lockedUsers = await getAllLockedUsers()
    
    return NextResponse.json({
      success: true,
      lockedUsers,
      count: lockedUsers.length
    })
  } catch (error) {
    console.error('获取锁定用户失败:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locked users' },
      { status: 500 }
    )
  }
}

// POST: 解锁用户或转移资金
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userAddress, disputeId, reporterAddress } = body

    if (!action || !userAddress || !disputeId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userAddress, disputeId' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'unlock':
        result = await unlockUserFunds(userAddress, disputeId)
        break
        
      case 'transfer':
        if (!reporterAddress) {
          return NextResponse.json(
            { error: 'Reporter address required for transfer action' },
            { status: 400 }
          )
        }
        result = await transferLockedFunds(userAddress, reporterAddress, disputeId)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "unlock" or "transfer"' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        action,
        txHash: result.txHash,
        message: `User funds ${action === 'unlock' ? 'unlocked' : 'transferred'} successfully`
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('管理锁定用户失败:', error)
    return NextResponse.json(
      { error: 'Failed to manage locked user' },
      { status: 500 }
    )
  }
}