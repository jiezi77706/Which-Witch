'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Coins, 
  ExternalLink, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { TestnetCrossChainService, TESTNET_CHAINS } from '@/lib/web3/services/testnet-crosschain.service'
import { useAccount, useChainId } from 'wagmi'
import { toast } from 'sonner'

export default function TestCrossChainPayment() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [paymentStatus, setPaymentStatus] = useState<any>(null)

  // 测试作品数据
  const testWork = {
    id: 999,
    title: '测试作品 - 跨链支付演示',
    creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
    creatorName: '测试创作者',
    licenseFee: '0.01',
    tipAmount: '0.005'
  }

  const supportedChains = TestnetCrossChainService.getSupportedChains()
  const currentChain = supportedChains.find(chain => chain.id === chainId)

  const handleAddNetwork = async (chain: any) => {
    const success = await TestnetCrossChainService.addTestnetToWallet(chain.id)
    if (success) {
      toast.success(`${chain.name} 网络已添加到钱包`)
    } else {
      toast.error(`添加 ${chain.name} 网络失败`)
    }
  }

  const handleGetFaucet = (chain: any) => {
    if (chain.faucet) {
      window.open(chain.faucet, '_blank')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">跨链支付测试</h1>
          <p className="text-gray-600">
            使用测试币体验跨链支付功能
          </p>
        </div>

        {/* 钱包状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5" />
              <span>钱包状态</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  请先连接钱包才能进行测试
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">钱包地址:</span>
                  <span className="font-mono text-sm">{address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">当前网络:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{currentChain?.name || '未知网络'}</span>
                    {currentChain && currentChain.id === 11155111 && (
                      <Badge variant="default">目标链</Badge>
                    )}
                    {currentChain && currentChain.id !== 11155111 && (
                      <Badge variant="secondary">支付链</Badge>
                    )}
                  </div>
                </div>
                {!TestnetCrossChainService.isTestnet(chainId) && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      当前网络不是支持的测试网，请切换到支持的测试网络
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 支持的测试网络 */}
        <Card>
          <CardHeader>
            <CardTitle>支持的测试网络</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {supportedChains.map((chain) => (
                <div key={chain.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{chain.name}</h4>
                    {chain.id === 11155111 && (
                      <Badge variant="default" className="text-xs">目标链</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>代币: {chain.symbol}</div>
                    <div>链 ID: {chain.id}</div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddNetwork(chain)}
                      className="w-full text-xs"
                    >
                      添加到钱包
                    </Button>
                    
                    {chain.faucet && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGetFaucet(chain)}
                        className="w-full text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        获取测试币
                      </Button>
                    )}
                  </div>

                  {chainId === chain.id && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>当前网络</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 测试作品 */}
        <Card>
          <CardHeader>
            <CardTitle>测试作品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">测</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{testWork.title}</h3>
                  <p className="text-sm text-gray-600">创作者: {testWork.creatorName}</p>
                  <p className="text-xs text-gray-500">作品 ID: #{testWork.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">支付信息</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>打赏金额:</span>
                      <span>{testWork.tipAmount} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>授权费:</span>
                      <span>{testWork.licenseFee} ETH</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">支付选项</h4>
                  <div className="space-y-2">
                    <UniversalPaymentButton
                      workId={testWork.id}
                      creatorAddress={testWork.creator}
                      creatorName={testWork.creatorName}
                      workTitle={testWork.title}
                      paymentType="tip"
                      fixedAmount={testWork.tipAmount}
                      size="sm"
                      className="w-full"
                    />
                    
                    <UniversalPaymentButton
                      workId={testWork.id}
                      creatorAddress={testWork.creator}
                      creatorName={testWork.creatorName}
                      workTitle={testWork.title}
                      paymentType="license"
                      fixedAmount={testWork.licenseFee}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>测试步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <h4 className="font-medium">获取测试币</h4>
                  <p className="text-sm text-gray-600">
                    从水龙头获取各个测试网的代币
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <h4 className="font-medium">选择支付方式</h4>
                  <p className="text-sm text-gray-600">
                    点击支付按钮，选择直接支付或跨链支付
                  </p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <h4 className="font-medium">完成支付</h4>
                  <p className="text-sm text-gray-600">
                    确认交易，等待跨链转换完成
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>注意:</strong> 这是测试环境，所有代币都是测试币，没有实际价值。
                  跨链支付可能需要 1-5 分钟完成，具体时间取决于网络状况。
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* 水龙头链接 */}
        <Card>
          <CardHeader>
            <CardTitle>测试币水龙头</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {supportedChains.filter(chain => chain.faucet).map((chain) => (
                <Button
                  key={chain.id}
                  variant="outline"
                  onClick={() => window.open(chain.faucet, '_blank')}
                  className="justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {chain.name} 水龙头
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}