'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Address } from 'viem'
import { ZetaChainService, SUPPORTED_TARGET_CHAINS } from '../services/zetachain-service'

// 类型定义
export interface PaymentStatus {
  paymentId: bigint
  sender: Address
  recipient: Address
  amount: bigint
  paymentType: number
  workId: bigint
  sourceChainId: bigint
  targetChainId: bigint
  sourceCurrency: string
  completed: boolean
  timestamp: bigint
}

export interface UseCrossChainPaymentOptions {
  onSuccess?: (paymentId: bigint) => void
  onError?: (error: Error) => void
  onStatusChange?: (status: PaymentStatus) => void
}

export function useCrossChainPayment(options: UseCrossChainPaymentOptions = {}) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const [isLoading, setIsLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<bigint | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // 发起跨链支付
  const initiateCrossChainPayment = useCallback(async (params: {
    recipientAddress: Address
    workId: bigint
    targetChainId: number
    amount: string
    paymentType: 'tip' | 'license' | 'nft'
    useZeta?: boolean
  }) => {
    if (!address) {
      throw new Error('钱包未连接')
    }

    setIsLoading(true)
    setError(null)

    try {
      const resultPaymentId = await ZetaChainService.sendCrossChainTip({
        recipientAddress: params.recipientAddress,
        amount: params.amount,
        targetChainId: params.targetChainId,
        workId: Number(params.workId),
        creatorName: undefined // 可以从参数中传入
      })

      if (resultPaymentId.success && resultPaymentId.transactionHash) {
        // 模拟 paymentId (实际应该从交易中提取)
        const mockPaymentId = BigInt(Date.now())
        setPaymentId(mockPaymentId)
        options.onSuccess?.(mockPaymentId)
        return mockPaymentId
      } else {
        throw new Error(resultPaymentId.error || '支付失败')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('支付失败')
      setError(error)
      options.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [address, options])

  // 查询支付状态
  const checkPaymentStatus = useCallback(async (id: bigint) => {
    try {
      const status = await ZetaChainService.getTransactionStatus(id.toString())
      // 转换为 PaymentStatus 格式
      const paymentStatus: PaymentStatus = {
        paymentId: id,
        sender: address as Address,
        recipient: address as Address, // 简化处理
        amount: BigInt(0),
        paymentType: 0,
        workId: BigInt(0),
        sourceChainId: BigInt(7001),
        targetChainId: BigInt(11155111),
        sourceCurrency: 'ZETA',
        completed: status.status === 'success',
        timestamp: BigInt(Date.now())
      }
      setPaymentStatus(paymentStatus)
      options.onStatusChange?.(paymentStatus)
      return paymentStatus
    } catch (err) {
      console.error('Failed to check payment status:', err)
      return null
    }
  }, [options, address])

  // 获取 ZRC-20 余额
  const getZRC20Balance = useCallback(async (chainId: number) => {
    if (!address) return '0'
    
    try {
      return await ZetaChainService.getZetaBalance(address)
    } catch (err) {
      console.error('Failed to get ZRC-20 balance:', err)
      return '0'
    }
  }, [address])

  // 估算费用
  const estimateFees = useCallback(async (targetChainId: number, amount: string) => {
    try {
      return await ZetaChainService.estimateCrossChainFee(amount)
    } catch (err) {
      console.error('Failed to estimate fees:', err)
      return null
    }
  }, [])

  // 自动检查支付状态
  useEffect(() => {
    if (!paymentId) return

    const checkStatus = async () => {
      await checkPaymentStatus(paymentId)
    }

    // 立即检查一次
    checkStatus()

    // 每5秒检查一次，直到支付完成
    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(paymentId)
      if (status?.completed) {
        clearInterval(interval)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [paymentId, checkPaymentStatus])

  // 重置状态
  const reset = useCallback(() => {
    setPaymentId(null)
    setPaymentStatus(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    // 状态
    isLoading,
    paymentId,
    paymentStatus,
    error,
    
    // 方法
    initiateCrossChainPayment,
    checkPaymentStatus,
    getZRC20Balance,
    estimateFees,
    reset,
    
    // 计算属性
    isCompleted: paymentStatus?.completed || false,
    isPending: paymentId !== null && !paymentStatus?.completed,
    canRetry: error !== null && !isLoading,
  }
}

// 支持的链和代币信息 Hook
export function useSupportedChains() {
  const supportedChains = Object.entries(SUPPORTED_TARGET_CHAINS).map(([chainId, config]) => ({
    id: parseInt(chainId),
    name: config.name,
    symbol: config.symbol,
    color: `bg-blue-500`, // 简化处理
    zrc20: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' // 简化处理
  }))

  const getChainById = useCallback((chainId: number) => {
    return supportedChains.find(chain => chain.id === chainId)
  }, [])

  const getChainBySymbol = useCallback((symbol: string) => {
    return supportedChains.find(chain => chain.symbol === symbol)
  }, [])

  return {
    supportedChains,
    getChainById,
    getChainBySymbol
  }
}

// ZetaChain 网络状态 Hook
export function useZetaChainStatus() {
  const chainId = useChainId()
  const ZETA_CHAIN_ID = 7001
  
  const isOnZetaChain = chainId === ZETA_CHAIN_ID
  const needsNetworkSwitch = !isOnZetaChain

  return {
    isOnZetaChain,
    needsNetworkSwitch,
    zetaChainId: ZETA_CHAIN_ID,
    currentChainId: chainId
  }
}