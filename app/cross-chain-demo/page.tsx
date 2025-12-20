'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  ArrowRight, 
  Wallet, 
  Globe, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { useCrossChainPayment, useSupportedChains, useZetaChainStatus } from '@/lib/web3/hooks/useCrossChainPayment'
import { toast } from 'sonner'

export default function CrossChainDemoPage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { supportedChains } = useSupportedChains()
  const { isOnZetaChain, needsNetworkSwitch } = useZetaChainStatus()

  // 演示数据
  const demoWork = {
    id: 999,
    title: "跨链支付演示作品",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // 示例地址
    creatorName: "演示创作者"
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">ZetaChain 跨链支付演示</h1>
        <p className="text-gray-600 mb-4">
          体验从任意链向任意链的无缝支付功能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：钱包连接和网络状态 */}
        <div className="space-y-6">
          {/* 钱包连接卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                钱包连接
              </CardTitle>
              <CardDescription>
                连接钱包以体验跨链支付功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">钱包地址:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">网络状态:</span>
                    <Badge variant={isOnZetaChain ? "default" : "secondary"}>
                      {isOnZetaChain ? "ZetaChain ✓" : "需要切换网络"}
                    </Badge>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => disconnect()}
                    className="w-full"
                  >
                    断开连接
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      variant="outline"
                      onClick={() => connect({ connector })}
                      className="w-full"
                    >
                      连接 {connector.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 支持的链 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                支持的区块链
              </CardTitle>
              <CardDescription>
                可以从这些链发起跨链支付
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportedChains.map((chain) => (
                  <div key={chain.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${chain.color}`} />
                      <span className="font-medium">{chain.name}</span>
                    </div>
                    <Badge variant="outline">{chain.symbol}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：演示功能 */}
        <div className="space-y-6">
          {/* 演示作品卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{demoWork.title}</CardTitle>
              <CardDescription>
                创作者: {demoWork.creatorName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-sm text-gray-600">
                    这是一个演示作品，用于测试跨链支付功能
                  </p>
                </div>

                <div className="border-t border-border/50 my-4"></div>

                <div className="space-y-3">
                  <h4 className="font-medium">支付选项</h4>
                  
                  {/* 通用支付按钮 - 支持直接支付和跨链支付 */}
                  <UniversalPaymentButton
                    workId={demoWork.id}
                    creatorAddress={demoWork.creator}
                    creatorName={demoWork.creatorName}
                    workTitle={demoWork.title}
                    paymentType="tip"
                    size="default"
                    className="w-full"
                  />

                  {/* 其他支付类型的演示按钮 */}
                  <Button variant="outline" className="w-full" disabled>
                    <Zap className="h-4 w-4 mr-2" />
                    跨链授权费支付
                    <Badge variant="secondary" className="ml-2">即将推出</Badge>
                  </Button>

                  <Button variant="outline" className="w-full" disabled>
                    <Zap className="h-4 w-4 mr-2" />
                    跨链 NFT 购买
                    <Badge variant="secondary" className="ml-2">即将推出</Badge>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                使用说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">连接钱包</p>
                    <p className="text-gray-600">使用 MetaMask 或其他支持的钱包</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">切换到 ZetaChain</p>
                    <p className="text-gray-600">系统会自动提示切换网络</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">发起跨链支付</p>
                    <p className="text-gray-600">选择目标链和支付金额</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">等待处理完成</p>
                    <p className="text-gray-600">通常需要 1-3 分钟</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 获取测试代币 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="h-5 w-5 mr-2" />
                获取测试代币
              </CardTitle>
              <CardDescription>
                需要测试代币来体验功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => window.open('https://labs.zetachain.com/get-zeta', '_blank')}
                >
                  ZetaChain ZETA 水龙头
                  <ExternalLink className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => window.open('https://sepoliafaucet.com/', '_blank')}
                >
                  Sepolia ETH 水龙头
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          这是一个演示页面，展示 ZetaChain 跨链支付功能。
          <br />
          查看 <a href="/docs/ZETACHAIN_INTEGRATION_GUIDE.md" className="text-blue-600 hover:underline">完整集成指南</a> 了解更多详情。
        </p>
      </div>
    </div>
  )
}