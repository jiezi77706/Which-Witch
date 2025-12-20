'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Scale, 
  ShoppingCart, 
  Info,
  Coins,
  ArrowRight
} from 'lucide-react'
import { UniversalPaymentButton, CrossChainOnlyButton, PaymentStatusIndicator } from '@/components/whichwitch/universal-payment-button'

export default function PaymentIntegrationDemo() {
  const [paymentId, setPaymentId] = useState<bigint | null>(null)

  // 模拟作品数据
  const demoWork = {
    id: 123,
    title: '数字艺术作品 - 星空幻想',
    creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
    creatorName: '艺术家小明',
    licenseFee: '0.05', // 5% ETH 授权费
    tipAmount: '0.01' // 建议打赏金额
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">跨链支付集成演示</h1>
          <p className="text-gray-600">
            展示如何在现有的支付按钮中整合跨链支付选项
          </p>
        </div>

        {/* 测试币说明 */}
        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription>
            <strong>测试币支持:</strong> 本演示使用测试网络，支持 Sepolia ETH、BSC Testnet BNB、Polygon Mumbai MATIC 等测试币。
            你可以从各个测试网的水龙头获取测试币进行体验。
          </AlertDescription>
        </Alert>

        {/* 作品信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">艺</span>
              </div>
              <div>
                <h3 className="text-lg">{demoWork.title}</h3>
                <p className="text-sm text-gray-600">创作者: {demoWork.creatorName}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">作品信息</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>作品 ID:</span>
                    <span>#{demoWork.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>授权费:</span>
                    <span>{demoWork.licenseFee} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>建议打赏:</span>
                    <span>{demoWork.tipAmount} ETH</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">支持的支付方式</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Sepolia ETH</Badge>
                  <Badge variant="outline">BSC Testnet</Badge>
                  <Badge variant="outline">Polygon Mumbai</Badge>
                  <Badge variant="secondary">跨链自动转换</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 支付按钮演示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. 打赏按钮 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span>打赏功能</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                支持直接在 Sepolia 网络打赏，或使用其他链的代币跨链打赏
              </p>
              
              {/* 通用支付按钮 - 带下拉菜单 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">通用支付按钮 (推荐)</p>
                <UniversalPaymentButton
                  workId={demoWork.id}
                  creatorAddress={demoWork.creator}
                  creatorName={demoWork.creatorName}
                  workTitle={demoWork.title}
                  paymentType="tip"
                  fixedAmount={demoWork.tipAmount}
                  size="default"
                  className="w-full"
                />
              </div>

              <Separator />

              {/* 只有跨链支付的按钮 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">仅跨链支付</p>
                <CrossChainOnlyButton
                  workId={demoWork.id}
                  creatorAddress={demoWork.creator}
                  creatorName={demoWork.creatorName}
                  workTitle={demoWork.title}
                  paymentType="tip"
                  size="default"
                  className="w-full"
                />
              </div>

              <Separator />

              {/* 原有的跨链打赏按钮 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">原有组件已整合</p>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">
                    ✅ 原有的 CrossChainTipButton 功能已整合到 UniversalPaymentButton 中，
                    现在一个按钮就能同时支持直接支付和跨链支付！
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. 授权申请按钮 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Scale className="h-5 w-5 text-blue-500" />
                <span>授权申请</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                支付授权费获得作品的商业使用权，支持跨链支付
              </p>
              
              {/* 授权费支付按钮 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">授权费支付 (固定金额)</p>
                <UniversalPaymentButton
                  workId={demoWork.id}
                  creatorAddress={demoWork.creator}
                  creatorName={demoWork.creatorName}
                  workTitle={demoWork.title}
                  paymentType="license"
                  fixedAmount={demoWork.licenseFee}
                  size="default"
                  className="w-full"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  授权费由创作者设定，支付后将获得相应的使用权限
                </AlertDescription>
              </Alert>

              {/* 支付状态指示器 */}
              {paymentId && (
                <PaymentStatusIndicator
                  paymentId={paymentId}
                  paymentType="license"
                />
              )}
            </CardContent>
          </Card>

          {/* 3. NFT 购买按钮 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-purple-500" />
                <span>NFT 购买</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                购买作品的 NFT 版本，支持跨链支付和自动铸造
              </p>
              
              {/* NFT 购买按钮 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">NFT 购买 (开发中)</p>
                <UniversalPaymentButton
                  workId={demoWork.id}
                  creatorAddress={demoWork.creator}
                  creatorName={demoWork.creatorName}
                  workTitle={demoWork.title}
                  paymentType="nft"
                  fixedAmount="0.1"
                  size="default"
                  className="w-full"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  NFT 购买功能正在开发中，支付后将自动铸造 NFT 到你的钱包
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* 跨链支付流程说明 */}
        <Card>
          <CardHeader>
            <CardTitle>跨链支付流程说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium">选择支付链</h4>
                <p className="text-sm text-gray-600">
                  选择你想使用的区块链网络和代币类型
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium">ZetaChain 处理</h4>
                <p className="text-sm text-gray-600">
                  通过 ZetaChain 自动转换为目标链的代币
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <h4 className="font-medium">创作者收款</h4>
                <p className="text-sm text-gray-600">
                  创作者在 Sepolia 网络收到 ETH 代币
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <h4 className="font-medium">支持的测试网络:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Sepolia (ETH)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>BSC Testnet (BNB)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Polygon Mumbai (MATIC)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>ZetaChain Athens (ZETA)</span>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>获取测试币:</strong> 你可以从各个测试网的水龙头获取免费的测试币来体验跨链支付功能。
                ZetaChain 测试币可以从 <a href="https://labs.zetachain.com/get-zeta" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">官方水龙头</a> 获取。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 集成指南 */}
        <Card>
          <CardHeader>
            <CardTitle>如何集成到现有项目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. 替换现有的支付按钮</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                  {`// 原有的打赏按钮
<Button onClick={handleTip}>打赏</Button>

// 替换为通用支付按钮
<UniversalPaymentButton
  workId={work.id}
  creatorAddress={work.creator}
  paymentType="tip"
  fixedAmount="0.01"
/>`}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. 授权申请按钮</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                  {`// 授权申请按钮
<UniversalPaymentButton
  workId={work.id}
  creatorAddress={work.creator}
  paymentType="license"
  fixedAmount={work.licenseFee}
/>`}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. 只使用跨链支付</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                  {`// 仅跨链支付按钮
<CrossChainOnlyButton
  workId={work.id}
  creatorAddress={work.creator}
  paymentType="tip"
/>`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}