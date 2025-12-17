"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2, Plus, X } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"

interface CopyrightDisputeModalProps {
  isOpen: boolean
  onClose: () => void
  originalWorkId: number
  originalWorkTitle: string
  originalWorkImage: string
  accusedWorkId: number
  accusedWorkTitle: string
  accusedWorkImage: string
  accusedAddress: string
  reporterAddress: string
}

export function CopyrightDisputeModal({
  isOpen,
  onClose,
  originalWorkId,
  originalWorkTitle,
  originalWorkImage,
  accusedWorkId,
  accusedWorkTitle,
  accusedWorkImage,
  accusedAddress,
  reporterAddress
}: CopyrightDisputeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [evidenceDescription, setEvidenceDescription] = useState("")
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [currentUrl, setCurrentUrl] = useState("")
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!disputeReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the dispute",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ai/copyright-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterAddress,
          accusedAddress,
          originalWorkId,
          accusedWorkId,
          disputeReason,
          evidenceDescription,
          evidenceUrls
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create dispute')
      }

      toast({
        title: "✅ Dispute Submitted",
        description: "AI is analyzing the copyright similarity. Both works are now locked.",
      })

      // Reset form
      setDisputeReason("")
      setEvidenceDescription("")
      setEvidenceUrls([])
      onClose()

    } catch (error) {
      console.error('Dispute submission error:', error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit dispute",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addEvidenceUrl = () => {
    if (currentUrl.trim() && !evidenceUrls.includes(currentUrl.trim())) {
      setEvidenceUrls([...evidenceUrls, currentUrl.trim()])
      setCurrentUrl("")
    }
  }

  const removeEvidenceUrl = (url: string) => {
    setEvidenceUrls(evidenceUrls.filter(u => u !== url))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report Copyright Infringement
          </DialogTitle>
          <DialogDescription>
            Submit a copyright dispute. AI will analyze both works and generate an arbitration report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Works Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-green-600">Original Work (Yours)</Label>
              <div className="border-2 border-green-500/30 rounded-lg overflow-hidden">
                <img src={originalWorkImage} alt={originalWorkTitle} className="w-full aspect-square object-cover" />
                <div className="p-3 bg-green-500/10">
                  <p className="font-medium text-sm truncate">{originalWorkTitle}</p>
                  <p className="text-xs text-muted-foreground">Work ID: {originalWorkId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-red-600">Accused Work</Label>
              <div className="border-2 border-red-500/30 rounded-lg overflow-hidden">
                <img src={accusedWorkImage} alt={accusedWorkTitle} className="w-full aspect-square object-cover" />
                <div className="p-3 bg-red-500/10">
                  <p className="font-medium text-sm truncate">{accusedWorkTitle}</p>
                  <p className="text-xs text-muted-foreground">Work ID: {accusedWorkId}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Creator: {accusedAddress.slice(0, 6)}...{accusedAddress.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Dispute Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Describe why you believe this work infringes on your copyright. Be specific about similarities in composition, style, characters, or other elements..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Evidence Description */}
          <div className="space-y-2">
            <Label htmlFor="evidence">Additional Evidence Description</Label>
            <Textarea
              id="evidence"
              placeholder="Provide additional context or evidence supporting your claim..."
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Evidence URLs */}
          <div className="space-y-2">
            <Label>Evidence Links (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/evidence.jpg"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEvidenceUrl())}
              />
              <Button type="button" onClick={addEvidenceUrl} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-1 mt-2">
                {evidenceUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <span className="flex-1 truncate">{url}</span>
                    <Button
                      type="button"
                      onClick={() => removeEvidenceUrl(url)}
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="font-semibold text-sm text-blue-600 mb-2">🤖 AI Arbitration Process</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Similarity Analysis:</strong> Overall, composition, color, character, and style comparison</li>
              <li>• <strong>Region Detection:</strong> Identifies specific disputed areas</li>
              <li>• <strong>Timeline Analysis:</strong> Compares upload dates</li>
              <li>• <strong>AI Recommendation:</strong> Dismiss, warning, takedown, or compensation</li>
              <li>• <strong>Work Locking:</strong> Both works will be locked during dispute resolution</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-xs text-orange-600">
              ⚠️ <strong>Warning:</strong> False copyright claims may result in penalties. 
              Both works will be locked until the dispute is resolved.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || !disputeReason.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
