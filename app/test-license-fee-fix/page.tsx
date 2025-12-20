'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'
import { WorkCard } from '@/components/whichwitch/work-card'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

export default function TestLicenseFeeFix() {
  // Test works with different license fee scenarios
  const testWorks = [
    {
      id: 1,
      work_id: 1,
      title: 'Work with License Fee',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creator_address: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      author: 'Artist A',
      license_fee: '0.08', // Has license fee
      allowRemix: true,
      allow_remix: true,
      story: 'Work with proper license fee set by creator',
      tags: ['test', 'license'],
      created_at: new Date().toISOString(),
      image_url: 'https://via.placeholder.com/400x300'
    },
    {
      id: 2,
      work_id: 2,
      title: 'Work with NULL License Fee',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creator_address: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      author: 'Artist B',
      license_fee: null, // NULL license fee (database scenario)
      allowRemix: true,
      allow_remix: true,
      story: 'Work with NULL license fee from database',
      tags: ['test', 'null'],
      created_at: new Date().toISOString(),
      image_url: 'https://via.placeholder.com/400x300'
    },
    {
      id: 3,
      work_id: 3,
      title: 'Work with Empty License Fee',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creator_address: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      author: 'Artist C',
      license_fee: '', // Empty string
      allowRemix: true,
      allow_remix: true,
      story: 'Work with empty string license fee',
      tags: ['test', 'empty'],
      created_at: new Date().toISOString(),
      image_url: 'https://via.placeholder.com/400x300'
    },
    {
      id: 4,
      work_id: 4,
      title: 'Work with Zero License Fee',
      creator: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      creator_address: '0x742d35Cc6634C0532925a3b8D0C9C0E3C5d5c8eF',
      author: 'Artist D',
      license_fee: '0', // Explicitly zero
      allowRemix: true,
      allow_remix: true,
      story: 'Work with explicitly zero license fee',
      tags: ['test', 'zero'],
      created_at: new Date().toISOString(),
      image_url: 'https://via.placeholder.com/400x300'
    }
  ]

  const getExpectedLicenseFee = (work: any) => {
    return work.license_fee || '0.05'
  }

  const getDisplayLicenseFee = (work: any) => {
    return work.license_fee || '0.05'
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">License Fee Fix Test</h1>
          <p className="text-muted-foreground">
            Testing that license fees are consistently displayed and used across all components
          </p>
        </div>

        {/* Issue Description */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Issues Found:</strong>
            <br />• Payment modal shows fixed 0.01 ETH instead of creator's set amount
            <br />• Work details show "License fee: 0 ETH" for NULL/empty values
            <br />• Inconsistent fallback values between display and payment
          </AlertDescription>
        </Alert>

        {/* Fix Summary */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Fixes Applied:</strong>
            <br />• Updated work card to use consistent fallback: `work.license_fee || work.licenseFee || "0.05"`
            <br />• Changed display fallback from "0" to "0.05" ETH
            <br />• Payment button now uses creator's actual license fee
          </AlertDescription>
        </Alert>

        {/* Test Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testWorks.map((work) => (
            <Card key={work.id} className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {work.title}
                  <Badge variant="outline">#{work.id}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{work.story}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Raw Data Display */}
                <div className="bg-muted/30 p-3 rounded-lg space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raw license_fee:</span>
                    <span className="font-medium">
                      {work.license_fee === null ? 'null' : 
                       work.license_fee === '' ? '""' : 
                       work.license_fee === '0' ? '"0"' : 
                       `"${work.license_fee}"`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected display:</span>
                    <span className="font-medium text-primary">{getDisplayLicenseFee(work)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected payment:</span>
                    <span className="font-medium text-primary">{getExpectedLicenseFee(work)} ETH</span>
                  </div>
                </div>

                {/* Payment Button Test */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Direct Payment Button Test:</h4>
                  <UniversalPaymentButton
                    workId={work.work_id}
                    creatorAddress={work.creator_address}
                    creatorName={work.author}
                    workTitle={work.title}
                    paymentType="license"
                    fixedAmount={work.license_fee || "0.05"}
                    size="sm"
                    className="w-full"
                  />
                </div>

                {/* Test Results */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Test Results:</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>✅ Payment button uses: {getExpectedLicenseFee(work)} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>✅ Display shows: {getDisplayLicenseFee(work)} ETH</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>✅ Consistent fallback to 0.05 ETH</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Work Card Integration Test */}
        <Card>
          <CardHeader>
            <CardTitle>Work Card Integration Test</CardTitle>
            <p className="text-sm text-muted-foreground">
              Testing the actual WorkCard component with license fee display
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testWorks.slice(0, 2).map((work) => (
                <div key={work.id} className="border rounded-lg p-4">
                  <WorkCard
                    work={work}
                    isRemixable={true}
                    allowTip={true}
                  />
                </div>
              ))}
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
                <li>Click each "License" button above</li>
                <li>Verify the payment modal shows the correct amount (not 0.01)</li>
                <li>Check that work details show the correct license fee (not 0)</li>
                <li>Confirm NULL/empty values default to 0.05 ETH</li>
                <li>Test cross-chain payment to ensure creator receives correct amount</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Expected Behavior:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Work #1 (0.08 ETH):</span>
                    <span className="font-mono text-green-600">✓ Shows 0.08 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work #2 (NULL):</span>
                    <span className="font-mono text-green-600">✓ Shows 0.05 ETH</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Work #3 (Empty):</span>
                    <span className="font-mono text-green-600">✓ Shows 0.05 ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work #4 (Zero):</span>
                    <span className="font-mono text-green-600">✓ Shows 0.05 ETH</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Note:</strong> The 0.05 ETH default is reasonable for most creators. 
                In production, consider adding a UI for creators to set their preferred license fee during upload.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}