'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, ArrowUpRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CrossChainTipModal } from './cross-chain-tip-modal'

interface CrossChainTipButtonProps {
  workId: number
  creatorAddress: string
  creatorName?: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export function CrossChainTipButton({
  workId,
  creatorAddress,
  creatorName,
  className,
  size = 'sm',
  variant = 'outline'
}: CrossChainTipButtonProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // ZetaChain 配置
  const ZETA_CHAIN_ID = 7001
  const isOnZetaChain = chainId === ZETA_CHAIN_ID

  const handleTipClick = async () => {
    if (!isConnected) {
      toast.error('请先连接钱包')
      return
    }

    // 如果不在 ZetaChain 上，提示用户切换
    if (!isOnZetaChain) {
      try {
        setIsLoading(true)
        await switchChain({ chainId: ZETA_CHAIN_ID })
        toast.success('已切换到 ZetaChain 网络')
      } catch (error) {
        toast.error('请手动切换到 ZetaChain 网络')
        return
      } finally {
        setIsLoading(false)
      }
    }

    setShowPaymentModal(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleTipClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Zap className="h-4 w-4 mr-1" />
            跨链打赏
            {!isOnZetaChain && (
              <Badge variant="secondary" className="ml-2 text-xs">
                需切换网络
              </Badge>
            )}
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>

      {showPaymentModal && (
        <CrossChainTipModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          recipientAddress={creatorAddress}
          recipientName={creatorName}
          workId={workId}
          workTitle={`给 ${creatorName || '创作者'} 跨链打赏`}
        />
      )}
    </>
  )
}

// 简化版的跨链支付状态指示器
export function CrossChainPaymentStatus({ 
  paymentId, 
  className 
}: { 
  paymentId: bigint | null
  className?: string 
}) {
  if (!paymentId) return null

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-gray-600">
        跨链支付处理中... ID: {paymentId.toString().slice(-6)}
      </span>
    </div>
  )
}

// 支持的链显示组件
export function SupportedChainsIndicator({ className }: { className?: string }) {
  const supportedChains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
    { id: 56, name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500' },
    { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 11155111, name: 'Sepolia', symbol: 'ETH', color: 'bg-gray-500' }
  ]

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-xs text-gray-500 mr-2">支持的链:</span>
      {supportedChains.map((chain) => (
        <div
          key={chain.id}
          className={`w-3 h-3 rounded-full ${chain.color}`}
          title={`${chain.name} (${chain.symbol})`}
        />
      ))}
    </div>
  )
}