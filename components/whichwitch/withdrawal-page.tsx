"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, 
  Ban, 
  Lock, 
  AlertTriangle, 
  DollarSign,
  ArrowDownLeft,
  Shield,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import { UserLockStatus } from './user-lock-status'

interface WithdrawalPageProps {
  userBalance?: string
  onWithdraw?: (amount: string) => Promise<void>
}

export function WithdrawalPage({ userBalance = "0", onWithdraw }: WithdrawalPageProps) {
  const { address } = useAccount()
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [lockStatus, setLockStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const handleWithdraw = async () => {
    if (!withdrawAmount || !onWithdraw) return
    
    setIsWithdrawing(true)
    try {
      await onWithdraw(withdrawAmount)
      setWithdrawAmount("")
    } catch (error) {
      console.error('提款失败:', error)
    } finally {
      setIsWithdrawing(false)
    }
  }

  const formatBalance = (balance: string) => {
    const eth = parseFloat(balance) / 1e18
    return eth.toFixed(4)
  }

  const isWithdrawalBlocked = lockStatus?.isWithdrawalDisabled
  const hasLockedFunds = lockStatus?.isLocked

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">资金提取</h1>
          <p className="text-muted-foreground">管理您的平台资金</p>
        </div>
      </div>

      {/* 用户锁定状态提示 */}
      <UserLockStatus />

      {/* 余额显示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            账户余额
          </CardTitle>
          <CardDescription>
            您在平台上的可用资金
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatBalance(userBalance)} ETH
          </div>
          {hasLockedFunds && lockStatus?.lockInfo && (
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="text-orange-600">
                锁定资金: {formatBalance(lockStatus.lockInfo.lockedAmount)} ETH
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提款表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5" />
            提取资金
          </CardTitle>
          <CardDescription>
            将资金提取到您的钱包地址
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 提款被禁用的警告 */}
          {isWithdrawalBlocked && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
              <Ban className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-800 dark:text-red-200">
                      提款功能已被禁用
                    </span>
                    <Badge variant="destructive">
                      {lockStatus?.withdrawalInfo?.severity === 'critical' ? '极高风险' : '高风险'}
                    </Badge>
                  </div>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    由于检测到严重的版权侵权行为，您的提款功能已被暂时禁用。
                    如有异议，请联系管理员处理。
                  </p>
                  {lockStatus?.withdrawalInfo?.disputeId && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-red-600"
                      onClick={() => window.open(`/disputes/${lockStatus.withdrawalInfo.disputeId}`, '_blank')}
                    >
                      查看争议详情 #{lockStatus.withdrawalInfo.disputeId}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 部分资金锁定的提示 */}
          {hasLockedFunds && !isWithdrawalBlocked && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <Lock className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <span className="font-semibold text-orange-800 dark:text-orange-200">
                    部分资金已被锁定
                  </span>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    由于版权争议，部分资金已被临时锁定。您仍可提取其他可用资金。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 提款输入表单 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">提取金额 (ETH)</Label>
              <div className="relative">
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.0001"
                  min="0"
                  max={formatBalance(userBalance)}
                  placeholder="输入提取金额"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isWithdrawalBlocked}
                  className={isWithdrawalBlocked ? "opacity-50" : ""}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
                  onClick={() => setWithdrawAmount(formatBalance(userBalance))}
                  disabled={isWithdrawalBlocked}
                >
                  最大
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>可用余额: {formatBalance(userBalance)} ETH</span>
              {parseFloat(withdrawAmount) > 0 && (
                <span>
                  手续费: ~0.001 ETH
                </span>
              )}
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={
                isWithdrawalBlocked || 
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                parseFloat(withdrawAmount) > parseFloat(formatBalance(userBalance)) ||
                isWithdrawing
              }
              className="w-full"
              size="lg"
            >
              {isWithdrawing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  处理中...
                </>
              ) : isWithdrawalBlocked ? (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  提款已禁用
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  提取 {withdrawAmount || "0"} ETH
                </>
              )}
            </Button>
          </div>

          {/* 安全提示 */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">安全提示</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 提款将发送到您当前连接的钱包地址</li>
                  <li>• 请确保钱包地址正确，交易无法撤销</li>
                  <li>• 大额提款可能需要额外的安全验证</li>
                  {hasLockedFunds && (
                    <li className="text-orange-600">• 争议解决后，锁定资金将自动释放</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}