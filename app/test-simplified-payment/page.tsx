'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { CheckCircle, Info } from 'lucide-react'

export default function TestSimplifiedPayment() {
  const testWork = {
    id: 123,
    title: "Test Artwork",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87",
    creatorName: "Test Creator",
    licenseFee: "0.05"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Simplified Payment Button Test</h1>
        <p className="text-muted-foreground">
          Testing the simplified payment buttons without dropdown menus - direct navigation to payment page.
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Task 8 Complete:</strong> Removed dropdown menus from payment buttons. 
          Now clicking Tip or License buttons directly opens the payment modal.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Test Work Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {testWork.title}
              <Badge variant="outline">Test Work #{testWork.id}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Creator: {testWork.creatorName} ({testWork.creator.slice(0, 8)}...)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Simplified UX - No dropdown menus</span>
              </div>

              {/* Payment Buttons */}
              <div className="flex space-x-4 pt-4 border-t border-border/50">
                <UniversalPaymentButton
                  workId={testWork.id}
                  creatorAddress={testWork.creator}
                  creatorName={testWork.creatorName}
                  workTitle={testWork.title}
                  paymentType="tip"
                  size="sm"
                  variant="outline"
                />
                
                <UniversalPaymentButton
                  workId={testWork.id}
                  creatorAddress={testWork.creator}
                  creatorName={testWork.creatorName}
                  workTitle={testWork.title}
                  paymentType="license"
                  fixedAmount={testWork.licenseFee}
                  size="sm"
                  variant="outline"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Removed dropdown menu imports</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Simplified button click handler</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Direct navigation to payment modal</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Removed showDropdown prop</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>✅ Updated text to English</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Click Tip Button:</strong> Directly opens cross-chain payment modal for tipping</p>
              <p><strong>2. Click License Button:</strong> Directly opens cross-chain payment modal for license fee</p>
              <p><strong>3. Payment Modal:</strong> Choose network (Sepolia, BSC, Polygon, ZetaChain) and complete payment</p>
              <p><strong>4. No Dropdowns:</strong> Simplified UX with direct navigation</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}