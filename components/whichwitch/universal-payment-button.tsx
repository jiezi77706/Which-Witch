'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  Scale, 
  ShoppingCart, 
  ArrowUpRight, 
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { MultiChainPaymentModal } from './multi-chain-payment-modal'

interface UniversalPaymentButtonProps {
  // 基本信息
  workId: number
  creatorAddress: string
  creatorName?: string
  workTitle?: string
  
  // 支付类型和金额
  paymentType: 'tip' | 'license' | 'nft'
  fixedAmount?: string // 如果是授权费，可能有固定金额
  
  // UI 配置
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export function UniversalPaymentButton({
  workId,
  creatorAddress,
  creatorName,
  workTitle,
  paymentType,
  fixedAmount,
  className,
  size = 'sm',
  variant = 'outline'
}: UniversalPaymentButtonProps) {
  const { isConnected } = useAccount()
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 支付类型配置
  const paymentConfig = {
    tip: {
      icon: Zap,
      text: 'Tip',
      description: 'Tip the creator',
      color: 'text-yellow-500'
    },
    license: {
      icon: Scale,
      text: 'License',
      description: 'Pay license fee for usage rights',
      color: 'text-blue-500'
    },
    nft: {
      icon: ShoppingCart,
      text: 'Buy NFT',
      description: 'Purchase NFT of this work',
      color: 'text-purple-500'
    }
  }

  const config = paymentConfig[paymentType]
  const IconComponent = config.icon

  // 处理支付按钮点击
  const handlePaymentClick = (e?: React.MouseEvent) => {
    e?.stopPropagation() // 阻止事件冒泡
    
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }
    
    // 直接打开支付模态框
    setShowPaymentModal(true)
  }

  // 简化的单一按钮 - 直接导航到支付页面
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePaymentClick}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <IconComponent className={`h-4 w-4 mr-1 ${config.color}`} />
            {config.text}
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>

      {showPaymentModal && (
        <MultiChainPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          recipientAddress={creatorAddress}
          recipientName={creatorName}
          workId={workId}
          workTitle={workTitle || `${config.description} - Work #${workId}`}
          paymentType={paymentType}
          amount={fixedAmount}
        />
      )}
    </>
  )
}

// 简化版本 - 只有跨链支付
export function CrossChainOnlyButton({
  workId,
  creatorAddress,
  creatorName,
  workTitle,
  paymentType,
  fixedAmount,
  className,
  size = 'sm',
  variant = 'outline'
}: Omit<UniversalPaymentButtonProps, never>) {
  return (
    <UniversalPaymentButton
      workId={workId}
      creatorAddress={creatorAddress}
      creatorName={creatorName}
      workTitle={workTitle}
      paymentType={paymentType}
      fixedAmount={fixedAmount}
      className={className}
      size={size}
      variant={variant}
    />
  )
}

// 支付状态指示器
export function PaymentStatusIndicator({ 
  paymentId, 
  paymentType,
  className 
}: { 
  paymentId: bigint | null
  paymentType: 'tip' | 'license' | 'nft'
  className?: string 
}) {
  if (!paymentId) return null

  const statusText = {
    tip: 'Tip processing',
    license: 'License request processing',
    nft: 'NFT purchase processing'
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-gray-600">
        {statusText[paymentType]}... ID: {paymentId.toString().slice(-6)}
      </span>
    </div>
  )
}