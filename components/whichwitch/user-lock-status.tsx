"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Lock, 
  Ban, 
  Clock, 
  DollarSign, 
  ExternalLink,
  Shield,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LockStatus {
  isLocked: boolean
  isWithdrawalDisabled: boolean
  lockInfo?: {
    lockedAt: number
    reason: string
    disputeId: number
    lockedAmount: string
    similarityScore?: number
    txHash?: string
  }
  withdrawalInfo?: {
    disabledAt: number
    reason: string
    disputeId: number
    severity: 'high' | 'critical'
    txHash?: string
  }
}

export function UserLockStatus() {
  const { address } = useAccount()
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (address) {
      checkLockStatus()
    }
  }, [address])

  const checkLockStatus = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/user/lock-status?address=${address}`)
      const data = await response.json()
      
      if (data.success) {
        setLockStatus(data.status)
      }
    } catch (error) {
      console.error('检查锁定状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amountWei: string) => {
    const eth = parseFloat(amountWei) / 1e18
    return `${eth.toFixed(4)} ETH`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getSeverityColor = (severity: 'high' | 'critical') => {
    return severity === 'critical' ? 'text-red-600' : 'text-orange-600'
  }

  const getSeverityBadge = (severity: 'high' | 'critical') => {
    return severity === 'critical' ? 'destructive' : 'secondary'
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-48 mb-2" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
    )
  }

  if (!lockStatus || (!lockStatus.isLocked && !lockStatus.isWithdrawalDisabled)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        {/* 提款禁用警告 - 最严重 */}
        {lockStatus.isWithdrawalDisabled && lockStatus.withdrawalInfo && (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <Ban className="h-4 w-4 text-red-600" />
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-800 dark:text-red-200">
                    🚫 提款功能已被禁用
                  </span>
                  <Badge variant={getSeverityBadge(lockStatus.withdrawalInfo.severity)}>
                    {lockStatus.withdrawalInfo.severity === 'critical' ? '极高风险' : '高风险'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  争议 #{lockStatus.withdrawalInfo.disputeId}
                </Badge>
              </div>
              
              <div className="text-sm space-y-2">
                <p className="text-red-700 dark:text-red-300">
                  <strong>原因:</strong> {lockStatus.withdrawalInfo.reason}
                </p>
                <p className="text-muted-foreground">
                  <strong>禁用时间:</strong> {formatDate(lockStatus.withdrawalInfo.disabledAt)}
                </p>
                {lockStatus.withdrawalInfo.txHash && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">交易哈希:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-mono"
                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${lockStatus.withdrawalInfo?.txHash}`, '_blank')}
                    >
                      {lockStatus.withdrawalInfo.txHash.slice(0, 10)}...
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                      重要提醒
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      由于检测到极高相似度的版权侵权行为，您的提款功能已被暂时禁用。
                      如有异议，请联系管理员处理。
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 资金锁定警告 */}
        {lockStatus.isLocked && lockStatus.lockInfo && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-800 dark:text-orange-200">
                    🔒 部分资金已被锁定
                  </span>
                  {lockStatus.lockInfo.similarityScore && (
                    <Badge variant="secondary">
                      {lockStatus.lockInfo.similarityScore}% 相似度
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  争议 #{lockStatus.lockInfo.disputeId}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">锁定金额:</span>
                    <span className="font-mono text-orange-700 dark:text-orange-300">
                      {formatAmount(lockStatus.lockInfo.lockedAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">锁定时间:</span>
                    <span className="text-muted-foreground">
                      {formatDate(lockStatus.lockInfo.lockedAt)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-orange-700 dark:text-orange-300">
                    <strong>原因:</strong> {lockStatus.lockInfo.reason}
                  </p>
                  {lockStatus.lockInfo.txHash && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">交易哈希:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-mono"
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${lockStatus.lockInfo?.txHash}`, '_blank')}
                      >
                        {lockStatus.lockInfo.txHash.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                      版权争议处理中
                    </p>
                    <p className="text-orange-700 dark:text-orange-300">
                      由于版权争议，相关资金已被临时锁定。争议解决后将自动释放。
                      其他资金不受影响，您仍可正常使用平台功能。
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkLockStatus}
            disabled={loading}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            刷新状态
          </Button>
          
          {(lockStatus.lockInfo?.disputeId || lockStatus.withdrawalInfo?.disputeId) && (
            <Button
              variant="link"
              size="sm"
              className="gap-2"
              onClick={() => {
                const disputeId = lockStatus.lockInfo?.disputeId || lockStatus.withdrawalInfo?.disputeId
                window.open(`/disputes/${disputeId}`, '_blank')
              }}
            >
              <ExternalLink className="w-4 h-4" />
              查看争议详情
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}