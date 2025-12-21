"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Ban,
  Shield,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface LockedUser {
  address: string
  lockedAt: number
  reason: string
  disputeId: number
  lockedAmount: string
  withdrawalDisabled?: boolean
  withdrawalDisableReason?: string
  withdrawalDisabledAt?: number
  similarityScore?: number
  severity?: 'high' | 'critical'
}

export function LockedUsersDashboard() {
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    loadLockedUsers()
  }, [])

  const loadLockedUsers = async () => {
    try {
      const response = await fetch('/api/admin/locked-users')
      const data = await response.json()
      
      if (data.success) {
        setLockedUsers(data.lockedUsers)
      }
    } catch (error) {
      console.error('加载锁定用户失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockUser = async (userAddress: string, disputeId: number) => {
    const key = `unlock-${userAddress}`
    setActionLoading(prev => ({ ...prev, [key]: true }))

    try {
      const response = await fetch('/api/admin/locked-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock',
          userAddress,
          disputeId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // 刷新列表
        await loadLockedUsers()
        alert(`用户 ${userAddress} 的资金已解锁\n交易哈希: ${data.txHash}`)
      } else {
        alert(`解锁失败: ${data.error}`)
      }
    } catch (error) {
      console.error('解锁用户失败:', error)
      alert('解锁操作失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleEnableWithdrawal = async (userAddress: string, disputeId: number) => {
    const key = `enable-${userAddress}`
    setActionLoading(prev => ({ ...prev, [key]: true }))

    try {
      const response = await fetch('/api/admin/locked-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable_withdrawal',
          userAddress,
          disputeId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // 刷新列表
        await loadLockedUsers()
        alert(`用户 ${userAddress} 的提款功能已恢复\n交易哈希: ${data.txHash}`)
      } else {
        alert(`恢复提款失败: ${data.error}`)
      }
    } catch (error) {
      console.error('恢复提款失败:', error)
      alert('恢复提款操作失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }))
    }
  }
    const reporterAddress = prompt('请输入举报者地址:')
    if (!reporterAddress) return

    const key = `transfer-${userAddress}`
    setActionLoading(prev => ({ ...prev, [key]: true }))

    try {
      const response = await fetch('/api/admin/locked-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          userAddress,
          disputeId,
          reporterAddress
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // 刷新列表
        await loadLockedUsers()
        alert(`资金已转移给举报者\n交易哈希: ${data.txHash}`)
      } else {
        alert(`转移失败: ${data.error}`)
      }
    } catch (error) {
      console.error('转移资金失败:', error)
      alert('转移操作失败')
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const formatAmount = (amountWei: string) => {
    const eth = parseFloat(amountWei) / 1e18
    return `${eth.toFixed(4)} ETH`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">锁定用户管理</h2>
          <p className="text-muted-foreground">管理因版权争议被自动锁定的用户资金</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">锁定用户数</p>
                <p className="text-2xl font-bold">{lockedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">锁定总金额</p>
                <p className="text-2xl font-bold">
                  {formatAmount(
                    lockedUsers.reduce((sum, user) => sum + parseFloat(user.lockedAmount), 0).toString()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">提款禁用用户</p>
                <p className="text-2xl font-bold">
                  {lockedUsers.filter(user => user.withdrawalDisabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 锁定用户列表 */}
      {lockedUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无锁定用户</h3>
            <p className="text-muted-foreground">当前没有因版权争议被锁定的用户</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lockedUsers.map((user, index) => (
            <motion.div
              key={user.address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={user.withdrawalDisabled ? "border-red-500 bg-red-50/50" : "border-orange-200 bg-orange-50/50"}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.withdrawalDisabled ? (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="w-3 h-3" />
                            提款禁用
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="w-3 h-3" />
                            资金锁定
                          </Badge>
                        )}
                        <Badge variant="outline">争议 #{user.disputeId}</Badge>
                        {user.similarityScore && (
                          <Badge variant={user.similarityScore >= 90 ? "destructive" : "secondary"}>
                            {user.similarityScore}% 相似度
                          </Badge>
                        )}
                        {user.severity && (
                          <Badge variant={user.severity === 'critical' ? "destructive" : "secondary"}>
                            {user.severity === 'critical' ? '极高风险' : '高风险'}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-mono">
                        {user.address}
                      </CardTitle>
                      <CardDescription>
                        锁定时间: {formatDate(user.lockedAt)}
                        {user.withdrawalDisabled && user.withdrawalDisabledAt && (
                          <><br />禁用时间: {formatDate(user.withdrawalDisabledAt)}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">锁定金额</p>
                      <p className={`text-xl font-bold ${user.withdrawalDisabled ? 'text-red-600' : 'text-orange-600'}`}>
                        {formatAmount(user.lockedAmount)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">锁定原因:</p>
                      <p className="text-sm text-muted-foreground bg-background p-2 rounded border">
                        {user.reason}
                      </p>
                    </div>

                    {user.withdrawalDisabled && user.withdrawalDisableReason && (
                      <div>
                        <p className="text-sm font-medium mb-1 text-red-600">提款禁用原因:</p>
                        <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                          {user.withdrawalDisableReason}
                        </p>
                      </div>
                    )}

                    {user.withdrawalDisabled && (
                      <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                              严重违规
                            </p>
                            <p className="text-red-700 dark:text-red-300">
                              该用户因极高相似度的版权侵权行为被禁用提款功能。
                              需要管理员手动审核后才能恢复。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlockUser(user.address, user.disputeId)}
                        disabled={actionLoading[`unlock-${user.address}`]}
                        className="gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        {actionLoading[`unlock-${user.address}`] ? '解锁中...' : '解锁资金'}
                      </Button>

                      {user.withdrawalDisabled && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEnableWithdrawal(user.address, user.disputeId)}
                          disabled={actionLoading[`enable-${user.address}`]}
                          className="gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          {actionLoading[`enable-${user.address}`] ? '恢复中...' : '恢复提款'}
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleTransferFunds(user.address, user.disputeId)}
                        disabled={actionLoading[`transfer-${user.address}`]}
                        className="gap-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {actionLoading[`transfer-${user.address}`] ? '转移中...' : '转移给举报者'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}