import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 动态导入版权保护服务
async function getUserLockStatus(userAddress: string) {
  try {
    const { isUserFundsLocked, isUserWithdrawalDisabled } = await import('@/lib/web3/services/copyright-protection.service')
    
    const [fundLockStatus, withdrawalStatus] = await Promise.all([
      isUserFundsLocked(userAddress),
      isUserWithdrawalDisabled(userAddress)
    ])
    
    return {
      isLocked: fundLockStatus.isLocked,
      lockInfo: fundLockStatus.lockInfo,
      isWithdrawalDisabled: withdrawalStatus.isDisabled,
      withdrawalInfo: withdrawalStatus.disableInfo
    }
  } catch (error) {
    console.error('获取用户锁定状态失败:', error)
    return {
      isLocked: false,
      isWithdrawalDisabled: false
    }
  }
}

// 从数据库获取争议详情
async function getDisputeDetails(userAddress: string) {
  try {
    const { data: disputes, error } = await supabase
      .from('copyright_disputes')
      .select(`
        id,
        status,
        similarity_score,
        accused_address,
        works_locked,
        withdrawal_disabled,
        auto_lock_tx_hash,
        withdrawal_disable_tx_hash,
        auto_lock_reason,
        withdrawal_disable_reason,
        lock_timestamp,
        withdrawal_disable_timestamp,
        created_at
      `)
      .eq('accused_address', userAddress.toLowerCase())
      .in('status', ['auto_locked', 'withdrawal_disabled', 'high_risk', 'critical_risk'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('查询争议记录失败:', error)
      return []
    }

    return disputes || []
  } catch (error) {
    console.error('获取争议详情失败:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      )
    }

    console.log(`🔍 检查用户锁定状态: ${address}`)

    // 1. 从智能合约服务获取锁定状态
    const contractStatus = await getUserLockStatus(address)
    
    // 2. 从数据库获取争议详情
    const disputes = await getDisputeDetails(address)
    
    // 3. 合并信息
    let lockInfo = null
    let withdrawalInfo = null
    
    if (disputes.length > 0) {
      const latestDispute = disputes[0]
      
      // 资金锁定信息
      if (latestDispute.works_locked || contractStatus.isLocked) {
        lockInfo = {
          lockedAt: latestDispute.lock_timestamp 
            ? new Date(latestDispute.lock_timestamp).getTime()
            : contractStatus.lockInfo?.lockedAt || Date.now(),
          reason: latestDispute.auto_lock_reason || contractStatus.lockInfo?.reason || '版权争议自动锁定',
          disputeId: latestDispute.id,
          lockedAmount: contractStatus.lockInfo?.lockedAmount || '1000000000000000000', // 1 ETH 默认
          similarityScore: latestDispute.similarity_score,
          txHash: latestDispute.auto_lock_tx_hash
        }
      }
      
      // 提款禁用信息
      if (latestDispute.withdrawal_disabled || contractStatus.isWithdrawalDisabled) {
        withdrawalInfo = {
          disabledAt: latestDispute.withdrawal_disable_timestamp
            ? new Date(latestDispute.withdrawal_disable_timestamp).getTime()
            : contractStatus.withdrawalInfo?.disabledAt || Date.now(),
          reason: latestDispute.withdrawal_disable_reason || contractStatus.withdrawalInfo?.reason || '极高相似度自动禁用提款',
          disputeId: latestDispute.id,
          severity: (latestDispute.similarity_score >= 90 ? 'critical' : 'high') as 'high' | 'critical',
          txHash: latestDispute.withdrawal_disable_tx_hash
        }
      }
    } else {
      // 如果数据库中没有记录，使用合约状态
      lockInfo = contractStatus.lockInfo || null
      withdrawalInfo = contractStatus.withdrawalInfo || null
    }

    const status = {
      isLocked: contractStatus.isLocked || (disputes.some(d => d.works_locked)),
      isWithdrawalDisabled: contractStatus.isWithdrawalDisabled || (disputes.some(d => d.withdrawal_disabled)),
      lockInfo,
      withdrawalInfo
    }

    console.log(`📊 用户锁定状态结果:`, {
      address,
      isLocked: status.isLocked,
      isWithdrawalDisabled: status.isWithdrawalDisabled,
      disputesCount: disputes.length
    })

    return NextResponse.json({
      success: true,
      status,
      disputesCount: disputes.length
    })

  } catch (error) {
    console.error('检查用户锁定状态错误:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check user lock status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}