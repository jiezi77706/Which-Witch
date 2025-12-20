'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { Info, CheckCircle, XCircle } from 'lucide-react'

export default function TestDropdownClick() {
  const [clickEvents, setClickEvents] = useState<string[]>([])
  const [testResults, setTestResults] = useState<{
    cardClicked: number
    directPaymentClicked: number
    crossChainClicked: number
  }>({
    cardClicked: 0,
    directPaymentClicked: 0,
    crossChainClicked: 0
  })

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setClickEvents(prev => [`${timestamp}: ${event}`, ...prev.slice(0, 9)])
  }

  const handleCardClick = () => {
    setTestResults(prev => ({ ...prev, cardClicked: prev.cardClicked + 1 }))
    addEvent('Card clicked - Details modal should open')
  }

  // 模拟作品数据
  const testWork = {
    id: 999,
    title: 'Click Test Work',
    creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
    creatorName: 'Test Creator',
    license_fee: '0.05',
    description: 'Work for testing dropdown click events'
  }

  const resetTest = () => {
    setClickEvents([])
    setTestResults({
      cardClicked: 0,
      directPaymentClicked: 0,
      crossChainClicked: 0
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Dropdown Click Event Test</h1>
          <p className="text-muted-foreground">
            Test that dropdown menu clicks don't trigger card click events
          </p>
        </div>

        {/* 测试说明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Test Instructions:</strong>
            <br />1. Click on the card background → Should open details modal
            <br />2. Click on payment button dropdown → Should show payment options
            <br />3. Click on dropdown options → Should NOT open details modal
          </AlertDescription>
        </Alert>

        {/* 测试结果 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Card Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testResults.cardClicked}</div>
              <p className="text-xs text-muted-foreground">Details modal opens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Direct Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testResults.directPaymentClicked}</div>
              <p className="text-xs text-muted-foreground">Should not open modal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cross-Chain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testResults.crossChainClicked}</div>
              <p className="text-xs text-muted-foreground">Should not open modal</p>
            </CardContent>
          </Card>
        </div>

        {/* 测试卡片 */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-primary/30"
          onClick={handleCardClick}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{testWork.title}</span>
              <Badge variant="outline">Test Work</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{testWork.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 作品信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Creator:</span>
                <div className="font-medium">{testWork.creatorName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">License Fee:</span>
                <div className="font-medium">{testWork.license_fee} ETH</div>
              </div>
            </div>

            {/* 支付按钮 */}
            <div className="flex space-x-4 pt-4 border-t border-border/50">
              <UniversalPaymentButton
                workId={testWork.id}
                creatorAddress={testWork.creator}
                creatorName={testWork.creatorName}
                workTitle={testWork.title}
                paymentType="tip"
                size="sm"
                className="flex-1"
              />
              
              <UniversalPaymentButton
                workId={testWork.id}
                creatorAddress={testWork.creator}
                creatorName={testWork.creatorName}
                workTitle={testWork.title}
                paymentType="license"
                fixedAmount={testWork.license_fee}
                size="sm"
                className="flex-1"
              />
            </div>

            {/* 点击区域提示 */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Click Areas:</strong>
                <br />• Card background (this area) → Opens details modal
                <br />• Payment buttons → Shows dropdown menu
                <br />• Dropdown options → Should NOT open details modal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 事件日志 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Event Log</CardTitle>
            <button
              onClick={resetTest}
              className="text-sm text-primary hover:underline"
            >
              Reset Test
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {clickEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No events yet. Start clicking to test!</p>
              ) : (
                clickEvents.map((event, index) => (
                  <div key={index} className="text-sm font-mono bg-muted/30 p-2 rounded">
                    {event}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 测试验证 */}
        <Card>
          <CardHeader>
            <CardTitle>Test Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {testResults.cardClicked > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Card click works (opens details modal)</span>
              </div>

              <div className="flex items-center space-x-2">
                {testResults.directPaymentClicked === 0 && testResults.crossChainClicked === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Dropdown clicks don't trigger card click</span>
              </div>
            </div>

            <Alert className={
              testResults.cardClicked > 0 && 
              testResults.directPaymentClicked === 0 && 
              testResults.crossChainClicked === 0
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {testResults.cardClicked > 0 && 
                 testResults.directPaymentClicked === 0 && 
                 testResults.crossChainClicked === 0
                  ? "✅ Test passed! Dropdown clicks are properly isolated from card clicks."
                  : "⚠️ Test in progress. Try clicking the dropdown options to verify they don't open the details modal."
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}