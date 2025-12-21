"use client"

import { WithdrawalPage } from '@/components/whichwitch/withdrawal-page'
import { useAccount, useBalance } from 'wagmi'
import { useEffect, useState } from 'react'

export default function WithdrawalPageRoute() {
  const { address } = useAccount()
  const { data: balance } = useBalance({
    address: address,
  })
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleWithdraw = async (amount: string) => {
    // 这里实现实际的提款逻辑
    console.log(`提取 ${amount} ETH 到 ${address}`)
    
    // 模拟提款过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`成功提取 ${amount} ETH`)
  }

  // 防止 SSR 不匹配
  if (!mounted) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <WithdrawalPage 
        userBalance={balance?.value.toString() || "0"}
        onWithdraw={handleWithdraw}
      />
    </div>
  )
}