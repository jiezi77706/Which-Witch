"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestVotingPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCreateVoting = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/votings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId: 1,
          title: 'Test Voting: Character Design',
          description: 'Choose the design style for our main character',
          options: [
            { title: 'Realistic Style', description: 'Detailed, lifelike character design' },
            { title: 'Anime Style', description: 'Japanese animation inspired design' },
            { title: 'Minimalist Style', description: 'Simple, clean geometric design' }
          ],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          reward: '0.001',
          creatorAddress: '0x1234567890123456789012345678901234567890'
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCheckVoting = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/votings/check-work-voting?workId=1')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testActiveVotings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/votings/active')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Voting System Test</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Button onClick={testCreateVoting} disabled={loading}>
          Test Create Voting
        </Button>
        <Button onClick={testCheckVoting} disabled={loading}>
          Test Check Voting
        </Button>
        <Button onClick={testActiveVotings} disabled={loading}>
          Test Active Votings
        </Button>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}