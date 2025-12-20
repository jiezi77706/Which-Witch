'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { CheckCircle, Info } from 'lucide-react'

export default function TestChainSelector() {
  const testWork = {
    id: 123,
    title: "Test Artwork",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
    creatorName: "Test Creator",
    licenseFee: "0.05"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Chain Selector Badge Removal Test</h1>
          <p className="text-muted-foreground">
            Testing that "Direct" and "Cross-Chain" badges are removed from chain dropdown
          </p>
        </div>

        {/* Fix Summary */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Fixes Applied:</strong>
            <br />• Removed "Direct" and "Cross-Chain" badge labels from chain selection dropdown
            <br />• Removed testnet warning: "⚠️ This is testnet environment using test tokens with no real value"
          </AlertDescription>
        </Alert>

        {/* Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test Payment Buttons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click the buttons below to open the payment modal and verify the chain dropdown
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <UniversalPaymentButton
                workId={testWork.id}
                creatorAddress={testWork.creator}
                creatorName={testWork.creatorName}
                workTitle={testWork.title}
                paymentType="tip"
                size="default"
                className="flex-1"
              />
              
              <UniversalPaymentButton
                workId={testWork.id}
                creatorAddress={testWork.creator}
                creatorName={testWork.creatorName}
                workTitle={testWork.title}
                paymentType="license"
                fixedAmount={testWork.licenseFee}
                size="default"
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">How to Test:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click either the "Tip" or "License" button above</li>
                <li>In the payment modal, click on the "Payment Chain" dropdown</li>
                <li>Verify that the chain options show ONLY:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Colored dot indicator</li>
                    <li>Chain name and symbol (e.g., "Sepolia Testnet (ETH)")</li>
                  </ul>
                </li>
                <li>Confirm that NO "Direct" or "Cross-Chain" badges appear</li>
                <li>Verify that the testnet warning message is removed from the bottom</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Expected Behavior:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>✅ Sepolia Testnet (ETH) - No "Direct" badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>✅ BSC Testnet (BNB) - No "Cross-Chain" badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>✅ Polygon Mumbai (MATIC) - No "Cross-Chain" badge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>✅ No testnet warning message at bottom</span>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> The chain dropdown now shows a cleaner interface with just the colored dot indicator and chain name/symbol. Users can still easily identify different chains by their colors and names.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Visual Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Before (with badges):</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>🔵 Sepolia Testnet (ETH) <span className="text-xs bg-secondary px-2 py-0.5 rounded">Direct</span></div>
                  <div>🟡 BSC Testnet (BNB) <span className="text-xs border border-primary/30 text-primary px-2 py-0.5 rounded">Cross-Chain</span></div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium mb-2 text-green-800">After (clean):</p>
                <div className="space-y-2 text-sm text-green-700">
                  <div>🔵 Sepolia Testnet (ETH)</div>
                  <div>🟡 BSC Testnet (BNB)</div>
                  <div>🟣 Polygon Mumbai (MATIC)</div>
                  <div>🔵 ZetaChain Athens (ZETA)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}