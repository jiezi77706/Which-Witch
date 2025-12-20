'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain, useBalance } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Coins, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Wallet,
  ArrowUpDown
} from 'lucide-react'
import { toast } from 'sonner'
import { ethers } from 'ethers'

import { TestnetCrossChainService, TESTNET_CHAINS } from '@/lib/web3/services/testnet-crosschain.service'

// 支持的支付链配置 (测试网)
const SUPPORTED_PAYMENT_CHAINS = TESTNET_CHAINS

// ZetaChain 配置
const ZETA_CHAIN_CONFIG = {
  chainId: 7001,
  name: 'ZetaChain Athens',
  symbol: 'ZETA',
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://zetachain-athens-3.blockscout.com'
}

interface MultiChainPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  recipientAddress: string
  recipientName?: string
  workId?: number
  workTitle?: string
  paymentType: 'tip' | 'license' | 'nft'
  amount?: string // 如果是授权费，可能有固定金额
}

export function MultiChainPaymentModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientName,
  workId,
  workTitle,
  paymentType,
  amount: fixedAmount
}: MultiChainPaymentModalProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [selectedChain, setSelectedChain] = useState<number>(11155111) // 默认 Sepolia
  const [amount, setAmount] = useState(fixedAmount || '')
  const [isLoading, setIsLoading] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select')

  // 获取当前链的余额
  const { data: balance } = useBalance({
    address: address
  })

  // 检查是否在正确的链上
  const isOnCorrectChain = chainId === selectedChain
  const selectedChainConfig = SUPPORTED_PAYMENT_CHAINS[selectedChain as keyof typeof SUPPORTED_PAYMENT_CHAINS]

  // 估算费用
  const [estimatedFees, setEstimatedFees] = useState<{
    amount: string
    crossChainFee: string
    networkFee: string
    total: string
    finalAmount: string // 创作者最终收到的金额 (ETH)
  } | null>(null)

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFees()
    } else {
      setEstimatedFees(null)
    }
  }, [amount, selectedChain])

  const calculateFees = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return

    try {
      // 使用测试网跨链服务计算费用
      const fees = await TestnetCrossChainService.estimateCrossChainFee(amount, selectedChain)
      
      setEstimatedFees({
        amount: fees.requiredSourceAmount,
        crossChainFee: fees.crossChainFee,
        networkFee: fees.networkFee,
        total: fees.totalRequired,
        finalAmount: fees.finalETHAmount
      })
    } catch (error) {
      console.error('Failed to calculate fees:', error)
      setEstimatedFees(null)
    }
  }

  const handleChainSwitch = async () => {
    if (!switchChain) return

    setIsLoading(true)
    try {
      await switchChain({ chainId: selectedChain as any })
      toast.success(`已切换到 ${selectedChainConfig.name}`)
    } catch (error) {
      toast.error(`切换到 ${selectedChainConfig.name} 失败`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效的支付金额')
      return
    }

    if (!isOnCorrectChain) {
      toast.error(`请先切换到 ${selectedChainConfig.name} 网络`)
      return
    }

    setPaymentStep('processing')
    setIsLoading(true)

    try {
      // 使用测试网跨链服务处理支付
      const result = await TestnetCrossChainService.simulateCrossChainPayment({
        sourceChainId: selectedChain,
        targetChainId: 11155111, // Sepolia
        amount,
        recipientAddress,
        paymentType,
        workId
      })

      if (result.success) {
        setTransactionHash(result.transactionHash || '')
        setPaymentStep('success')
        
        if (selectedChain === 11155111) {
          toast.success('支付成功！')
        } else {
          toast.success(`跨链支付已发起！预计 ${result.estimatedTime} 后到账`)
        }
      } else {
        throw new Error(result.error || '支付失败')
      }
    } catch (error: any) {
      console.error('支付失败:', error)
      toast.error(error.message || '支付失败，请重试')
      setPaymentStep('select')
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentTypeText = () => {
    switch (paymentType) {
      case 'tip': return 'Tip'
      case 'license': return 'License Fee'
      case 'nft': return 'NFT Purchase'
      default: return 'Payment'
    }
  }

  const openBlockExplorer = () => {
    if (transactionHash && selectedChainConfig) {
      window.open(`${selectedChainConfig.blockExplorer}/tx/${transactionHash}`, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Coins className="h-5 w-5 mr-2 text-primary" />
            Multi-Chain Payment - {getPaymentTypeText()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Work:</span>
                  <span className="font-medium">{workTitle || `Work #${workId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator:</span>
                  <span className="font-medium">{recipientName || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{getPaymentTypeText()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {paymentStep === 'select' && (
            <>
              {/* Wallet Status */}
              {!isConnected ? (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to proceed with payment
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">Wallet Connected:</span>
                    <span className="font-mono text-primary">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                </div>
              )}

              {/* Payment Chain Selection */}
              <div>
                <label className="text-sm font-medium">Payment Chain</label>
                <Select 
                  value={selectedChain.toString()} 
                  onValueChange={(value) => setSelectedChain(parseInt(value))}
                >
                  <SelectTrigger className="bg-background border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      {Object.entries(SUPPORTED_PAYMENT_CHAINS).map(([chainId, config]) => (
                        <SelectItem key={chainId} value={chainId}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              chainId === '11155111' ? 'bg-primary' :
                              chainId === '97' ? 'bg-yellow-500' :
                              chainId === '80001' ? 'bg-purple-500' :
                              'bg-blue-500'
                            }`} />
                            <span>{config.name} ({config.symbol})</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Network Status */}
              {isConnected && !isOnCorrectChain && (
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    Please switch to {selectedChainConfig.name} network
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChainSwitch}
                      disabled={isLoading}
                      className="ml-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Switch Network'}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Balance Display */}
              {isConnected && isOnCorrectChain && balance && (
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">Current Balance:</span>
                    <span className="font-mono font-medium text-primary">
                      {parseFloat(ethers.formatEther(balance.value)).toFixed(4)} {selectedChainConfig.symbol}
                    </span>
                  </div>
                  {/* Faucet Link */}
                  {selectedChainConfig.faucet && parseFloat(ethers.formatEther(balance.value)) < 0.01 && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Low balance, </span>
                      <a 
                        href={selectedChainConfig.faucet} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-1"
                      >
                        get testnet tokens →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="text-sm font-medium">
                  Payment Amount {fixedAmount && <span className="text-muted-foreground">(Fixed)</span>}
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!!fixedAmount || !isOnCorrectChain}
                    className="bg-background border-border/50"
                  />
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">{selectedChainConfig.symbol}</Badge>
                </div>
              </div>

              {/* Fee Estimation */}
              {estimatedFees && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Required Amount:</span>
                        <span className="text-primary font-medium">{estimatedFees.amount} {selectedChainConfig.symbol}</span>
                      </div>
                      
                      {selectedChain !== 11155111 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cross-Chain Fee:</span>
                          <span className="text-muted-foreground">{estimatedFees.crossChainFee} {selectedChainConfig.symbol}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network Fee:</span>
                        <span className="text-muted-foreground">{estimatedFees.networkFee} {selectedChainConfig.symbol}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">You Pay:</span>
                        <span className="text-primary">{estimatedFees.total} {selectedChainConfig.symbol}</span>
                      </div>
                      
                      <div className="flex justify-between text-primary">
                        <span>Creator Receives:</span>
                        <span className="font-medium">{estimatedFees.finalAmount} ETH</span>
                      </div>
                      
                      {selectedChain !== 11155111 && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-2">
                          <ArrowUpDown className="h-3 w-3" />
                          <span>Auto-converted to Sepolia ETH via cross-chain protocol</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="font-medium">Processing Payment...</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedChain === 11155111 ? 'Processing Sepolia payment' : 'Initiating cross-chain payment'}
              </p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedChain === 11155111 
                  ? 'Payment completed, creator has received the funds' 
                  : 'Cross-chain payment initiated, estimated arrival in 1-3 minutes'
                }
              </p>
              {transactionHash && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBlockExplorer}
                  className="mt-4 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Transaction
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 border-border/50"
            >
              {paymentStep === 'success' ? 'Done' : 'Cancel'}
            </Button>
            
            {paymentStep === 'select' && (
              <Button 
                onClick={handlePayment}
                disabled={
                  isLoading || 
                  !isConnected || 
                  !isOnCorrectChain || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  (balance && parseFloat(ethers.formatEther(balance.value)) < parseFloat(estimatedFees?.total || '0'))
                }
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>
              {selectedChain === 11155111 
                ? 'Direct payment on Sepolia network, no cross-chain fees'
                : `Cross-chain payment via protocol, estimated ${TestnetCrossChainService.getEstimatedTime(selectedChain)} arrival`
              }
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}