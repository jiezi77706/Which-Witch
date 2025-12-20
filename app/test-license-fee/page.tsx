'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { Scale, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestLicenseFee() {
  const [customLicenseFee, setCustomLicenseFee] = useState('0.08')

  // 模拟不同的作品数据，每个都有不同的 license_fee
  const testWorks = [
    {
      id: 1,
      title: 'Digital Art #1',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creatorName: 'Artist A',
      license_fee: '0.01', // 低费用
      description: 'Low license fee work'
    },
    {
      id: 2,
      title: 'Premium Artwork #2',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creatorName: 'Artist B',
      license_fee: '0.05', // 中等费用
      description: 'Medium license fee work'
    },
    {
      id: 3,
      title: 'Exclusive Collection #3',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creatorName: 'Artist C',
      license_fee: '0.15', // 高费用
      description: 'High license fee work'
    },
    {
      id: 4,
      title: 'Custom Fee Work',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creatorName: 'Artist D',
      license_fee: customLicenseFee, // 用户自定义费用
      description: 'Work with custom license fee'
    }
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">License Fee Testing</h1>
          <p className="text-muted-foreground">
            Test different license fees set by creators
          </p>
        </div>

        {/* 说明 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Each work has a different license fee set by the creator during upload. 
            The payment system should use the exact amount specified by the creator, not a fixed amount.
          </AlertDescription>
        </Alert>

        {/* 自定义费用控制 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>Custom License Fee Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Set Custom Fee:</label>
              <Input
                type="number"
                step="0.001"
                value={customLicenseFee}
                onChange={(e) => setCustomLicenseFee(e.target.value)}
                className="w-32"
              />
              <Badge variant="secondary">ETH</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 测试作品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testWorks.map((work) => (
            <Card key={work.id} className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{work.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{work.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 作品信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="font-medium">{work.creatorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Work ID:</span>
                    <span className="font-mono">#{work.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Fee:</span>
                    <span className="font-bold text-primary">{work.license_fee} ETH</span>
                  </div>
                </div>

                {/* 支付按钮 */}
                <div className="pt-4 border-t border-border/50">
                  <UniversalPaymentButton
                    workId={work.id}
                    creatorAddress={work.creator}
                    creatorName={work.creatorName}
                    workTitle={work.title}
                    paymentType="license"
                    fixedAmount={work.license_fee} // 使用作品设定的费用
                    size="default"
                    className="w-full"
                  />
                </div>

                {/* 验证信息 */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Expected behavior:</strong> Payment should use exactly {work.license_fee} ETH 
                    as set by the creator, not a fixed amount.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 测试说明 */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">How to Test:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click on any "License" button above</li>
                <li>Choose "Cross-Chain Payment" from the dropdown</li>
                <li>Select a payment chain (e.g., ZetaChain)</li>
                <li>Verify that the payment amount matches the work's license_fee</li>
                <li>Check that the "Creator Receives" amount equals the license_fee</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Expected Results:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Work #1:</span>
                    <span className="font-mono">Creator receives 0.01 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work #2:</span>
                    <span className="font-mono">Creator receives 0.05 ETH</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Work #3:</span>
                    <span className="font-mono">Creator receives 0.15 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work #4:</span>
                    <span className="font-mono">Creator receives {customLicenseFee} ETH</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="bg-primary/5 border-primary/20">
              <Scale className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>Key Point:</strong> The cross-chain payment system automatically calculates 
                the required source token amount to ensure the creator receives exactly the 
                license_fee they specified, regardless of exchange rates and cross-chain fees.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}