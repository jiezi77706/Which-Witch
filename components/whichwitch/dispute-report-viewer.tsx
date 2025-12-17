"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"

interface DisputeData {
  id: number
  status: string
  similarity_score: number
  composition_similarity: number
  color_similarity: number
  character_similarity: number
  style_similarity: number
  disputed_regions: any[]
  timeline_analysis: string
  ai_conclusion: string
  ai_recommendation: string
  confidence_level: number
  original_work: any
  accused_work: any
  created_at: string
  analyzed_at: string
}

interface DisputeReportViewerProps {
  isOpen: boolean
  onClose: () => void
  dispute: DisputeData | null
}

export function DisputeReportViewer({ isOpen, onClose, dispute }: DisputeReportViewerProps) {
  if (!dispute) return null

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'dismiss': return 'text-green-600 bg-green-500/10'
      case 'warning': return 'text-yellow-600 bg-yellow-500/10'
      case 'takedown': return 'text-red-600 bg-red-500/10'
      case 'compensation': return 'text-orange-600 bg-orange-500/10'
      default: return 'text-gray-600 bg-gray-500/10'
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'dismiss': return <CheckCircle className="w-5 h-5" />
      case 'warning': return <AlertTriangle className="w-5 h-5" />
      case 'takedown': return <XCircle className="w-5 h-5" />
      case 'compensation': return <Clock className="w-5 h-5" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">AI Arbitration Report</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Overall Similarity Score */}
            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Overall Similarity Score</h3>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {dispute.similarity_score.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={dispute.similarity_score} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {dispute.similarity_score > 80 ? "Very High Similarity" :
                 dispute.similarity_score > 60 ? "High Similarity" :
                 dispute.similarity_score > 40 ? "Moderate Similarity" :
                 "Low Similarity"}
              </p>
            </div>

            {/* Detailed Similarity Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Similarity Analysis Breakdown</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <SimilarityCard
                  title="Composition"
                  score={dispute.composition_similarity}
                  description="Layout and structure"
                />
                <SimilarityCard
                  title="Color Scheme"
                  score={dispute.color_similarity}
                  description="Palette and colors"
                />
                <SimilarityCard
                  title="Character Features"
                  score={dispute.character_similarity}
                  description="Character design"
                />
                <SimilarityCard
                  title="Artistic Style"
                  score={dispute.style_similarity}
                  description="Technique and style"
                />
              </div>
            </div>

            {/* Disputed Regions */}
            {dispute.disputed_regions && dispute.disputed_regions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Disputed Regions</h3>
                <div className="space-y-2">
                  {dispute.disputed_regions.map((region: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg border">
                      <p className="font-medium text-sm">{region.name || `Region ${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground mt-1">{region.description}</p>
                      {region.similarity && (
                        <Badge variant="outline" className="mt-2">
                          {region.similarity}% similar
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Analysis */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Timeline Analysis</h3>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{dispute.timeline_analysis}</p>
              </div>
            </div>

            {/* AI Conclusion */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">AI Conclusion</h3>
              <div className="p-4 bg-muted rounded-lg border">
                <p className="text-sm whitespace-pre-wrap">{dispute.ai_conclusion}</p>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">AI Recommendation</h3>
              <div className={`p-4 rounded-lg border flex items-start gap-3 ${getRecommendationColor(dispute.ai_recommendation)}`}>
                {getRecommendationIcon(dispute.ai_recommendation)}
                <div className="flex-1">
                  <p className="font-semibold text-sm uppercase mb-1">{dispute.ai_recommendation}</p>
                  <p className="text-xs opacity-80">
                    {dispute.ai_recommendation === 'dismiss' && "No significant copyright infringement detected. Dispute should be dismissed."}
                    {dispute.ai_recommendation === 'warning' && "Some similarities detected. Issue a warning to the accused party."}
                    {dispute.ai_recommendation === 'takedown' && "Significant copyright infringement detected. Recommend content takedown."}
                    {dispute.ai_recommendation === 'compensation' && "Copyright infringement confirmed. Recommend compensation to original creator."}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">AI Confidence Level</h3>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Analysis Confidence</span>
                  <Badge variant="outline">{dispute.confidence_level.toFixed(1)}%</Badge>
                </div>
                <Progress value={dispute.confidence_level} className="h-2" />
              </div>
            </div>

            {/* Works Comparison */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Works Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-600">ORIGINAL WORK</p>
                  <div className="border-2 border-green-500/30 rounded-lg overflow-hidden">
                    <img 
                      src={dispute.original_work?.image_url} 
                      alt={dispute.original_work?.title}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-3 bg-green-500/10">
                      <p className="font-medium text-sm">{dispute.original_work?.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {dispute.original_work?.work_id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-600">ACCUSED WORK</p>
                  <div className="border-2 border-red-500/30 rounded-lg overflow-hidden">
                    <img 
                      src={dispute.accused_work?.image_url} 
                      alt={dispute.accused_work?.title}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-3 bg-red-500/10">
                      <p className="font-medium text-sm">{dispute.accused_work?.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {dispute.accused_work?.work_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
              <p>Dispute ID: {dispute.id}</p>
              <p>Created: {new Date(dispute.created_at).toLocaleString()}</p>
              <p>Analyzed: {new Date(dispute.analyzed_at).toLocaleString()}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function SimilarityCard({ title, score, description }: { title: string; score: number; description: string }) {
  return (
    <div className="p-4 bg-muted rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="ml-2">{score.toFixed(0)}%</Badge>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  )
}
