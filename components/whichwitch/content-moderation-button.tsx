"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Loader2 } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"

interface ContentModerationButtonProps {
  workId: number
  imageUrl: string
  creatorAddress: string
  onModerationComplete?: (result: any) => void
  size?: "sm" | "default" | "lg"
}

export function ContentModerationButton({
  workId,
  imageUrl,
  creatorAddress,
  onModerationComplete,
  size = "default"
}: ContentModerationButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  const handleModeration = async () => {
    setIsAnalyzing(true)

    try {
      // In production, this would require actual token staking
      const stakeAmount = "0.01" // Example stake amount
      const stakeTxHash = "0x" + Math.random().toString(16).substring(2) // Mock tx hash

      const response = await fetch('/api/ai/content-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId,
          imageUrl,
          creatorAddress,
          stakeAmount,
          stakeTxHash
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Moderation failed')
      }

      toast({
        title: data.status === 'approved' ? "✅ Content Approved" : 
               data.status === 'rejected' ? "❌ Content Rejected" : 
               "⚠️ Under Review",
        description: data.message,
        variant: data.status === 'rejected' ? 'destructive' : 'default'
      })

      if (onModerationComplete) {
        onModerationComplete(data)
      }

    } catch (error) {
      console.error('Moderation error:', error)
      toast({
        title: "Moderation Failed",
        description: error instanceof Error ? error.message : "Failed to analyze content",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Button
      onClick={handleModeration}
      disabled={isAnalyzing}
      size={size}
      variant="outline"
      className="gap-2"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Shield className="w-4 h-4" />
          AI Content Check
        </>
      )}
    </Button>
  )
}
