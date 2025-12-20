'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'
import { ZetaChainService, SUPPORTED_TARGET_CHAINS, type CrossChainTipParams } from '@/lib/web3/services/zetachain-service'

interface CrossChainTipModalProps {
  isOpen: boolean
  onClose: () => void
  recipientAddress: string
  recipientName?: string
  workId?: number
  workTitle?: string
}

export function CrossChainTipModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientName,
  workId,
  workTitle
}: CrossChainTipModalProps) {
  const [amount, setAmount] = useState('')
  const [targetChainId, setTargetChainId] = useState<number>(11155111) // 默认 Sepolia
  const [isLoading, setIsLoading] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')
  const [zetaBalance, setZetaBalance] = useState<string>('0')
  const [isConnectedToZeta, setIsConnectedToZeta] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [estimatedFees, setEstimatedFees] = useState<{
    totalCost: string
    networkFee: string
    crossChainFee: string
  } | null>(null)

  // 检查连接状态
  useEffect(() => {
    checkConnection()
  }, [isOpen])

  // 估算费用
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      estimateFees()
    } else {
      setEstimatedFees(null)
    }
  }, [amount])

  const checkConnection = async () => {
    if (!window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setUserAddress(accounts[0])
        
        const isOnZeta = await ZetaChainService.isConnectedToZetaChain()
        setIsConnectedToZeta(isOnZeta)
        
        if (isOnZeta) {
          const balance = await ZetaChainService.getZetaBalance(accounts[0])
          setZetaBalance(balance)
        }
      }
    } catch (error) {
      console.error('检查连接失败:', error)
    }
  }

  const estimateFees = async () => {
    try {
      const fees = await ZetaChainService.estimateCrossChainFee(amount)
      setEstimatedFees(fees)
    } catch (error) {
      console.error('估算费用失败:', error)
    }
  }

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast.error('请安装 MetaMask')
      return
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await checkConnection()
    } catch (error) {
      toast.error('连接钱包失败')
    }
  }

  const handleSwitchToZeta = async () => {
    setIsLoading(true)
    try {
      const success = await ZetaChainService.switchToZetaChain()
      if (success) {
        await checkConnection()
        toast.success('已切换到 ZetaChain 网络')
      }
    } catch (error) {
      toast.error('切换网络失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTip = async () => {
    if (!recipientAddress || recipientAddress === '0x0000000000000000000000000000000000000000') {
      toast.error('无效的接收地址')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效的打赏金额')
      return
    }

    if (!userAddress) {
      toast.error('请先连接钱包')
      return
    }

    setIsLoading(true)

    try {
      const params: CrossChainTipParams = {
        recipientAddress,
        amount,
        targetChainId,
        workId,
        creatorName: recipientName
      }

      const result = await ZetaChainService.sendCrossChainTip(params)

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash)
        toast.success(`跨链打赏成功！预计 ${result.estimatedArrivalTime} 后到账`)
      } else {
        toast.error(result.error || '跨链打赏失败')
      }
    } catch (error) {
      console.error('发送打赏失败:', error)
      toast.error('发送打赏失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewTransaction = () => {
    if (transactionHash) {
      ZetaChainService.openTransactionInExplorer(transactionHash)
    }
  }

  const targetChain = SUPPORTED_TARGET_CHAINS[targetChainId as keyof typeof SUPPORTED_TARGET_CHAINS]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-500" />
            跨链打赏
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 作品信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>作品:</span>
              <span className="font-medium">{workTitle || `作品 #${workId}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>创作者:</span>
              <span className="font-medium">{recipientName || '匿名创作者'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>接收地址:</span>
              <span className="font-mono text-xs">
                {recipientAddress ? `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* 钱包连接状态 */}
          {!userAddress ? (
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                请先连接钱包
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectWallet}
                  className="ml-2"
                >
                  连接钱包
                </Button>
              </AlertDescription>
            </Alert>
          ) : !isConnectedToZeta ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                需要切换到 ZetaChain 网络
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToZeta}
                  disabled={isLoading}
                  className="ml-2"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : '切换网络'}
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-700">ZETA 余额:</span>
                <span className="font-mono font-medium">{parseFloat(zetaBalance).toFixed(4)} ZETA</span>
              </div>
            </div>
          )}

          {/* 目标链选择 */}
          <div>
            <label className="text-sm font-medium">目标链</label>
            <Select 
              value={targetChainId.toString()} 
              onValueChange={(value) => setTargetChainId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_TARGET_CHAINS).map(([chainId, config]) => (
                  <SelectItem key={chainId} value={chainId}>
                    {config.name} ({config.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 打赏金额 */}
          <div>
            <label className="text-sm font-medium">打赏金额</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!isConnectedToZeta}
              />
              <Badge variant="secondary">ZETA</Badge>
            </div>
          </div>

          {/* 费用预估 */}
          {estimatedFees && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>打赏金额:</span>
                <span>{amount} ZETA</span>
              </div>
              <div className="flex justify-between">
                <span>网络费用:</span>
                <span>{parseFloat(estimatedFees.networkFee).toFixed(4)} ZETA</span>
              </div>
              <div className="flex justify-between">
                <span>跨链费用:</span>
                <span>{parseFloat(estimatedFees.crossChainFee).toFixed(4)} ZETA</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>总计:</span>
                <span>{parseFloat(estimatedFees.totalCost).toFixed(4)} ZETA</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                预计到账: {amount} {targetChain?.symbol} (目标链)
              </div>
            </div>
          )}

          {/* 交易成功显示 */}
          {transactionHash && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>跨链打赏已发起成功！</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {transactionHash.slice(0, 10)}...{transactionHash.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleViewTransaction}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    预计 1-3 分钟后在 {targetChain?.name} 上收到 {amount} {targetChain?.symbol}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {transactionHash ? '完成' : '取消'}
            </Button>
            
            {!transactionHash && (
              <Button 
                onClick={handleSendTip}
                disabled={
                  isLoading || 
                  !isConnectedToZeta || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  parseFloat(zetaBalance) < parseFloat(estimatedFees?.totalCost || '0')
                }
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    发起跨链打赏
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 说明文字 */}
          <div className="text-xs text-gray-500 text-center">
            <p>跨链打赏通过 ZetaChain 实现，支持从任意链向任意链支付</p>
            <p>交易确认后通常需要 1-3 分钟到账</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}