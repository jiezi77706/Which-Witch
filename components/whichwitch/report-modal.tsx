"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Flag, AlertTriangle, Copy, CheckCircle2, XCircle, Clock, Shield, Scale } from "lucide-react"

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  work: any
  onReportComplete?: (result: any) => void
}

type ReportType = 'copyright_infringement' | 'inappropriate_content' | 'spam' | 'harassment' | 'other'

interface ReportFormData {
  type: ReportType | ''
  reason: string
  copiedWorkId: string
}

type ReportStatus = 'form' | 'submitting' | 'processing' | 'completed' | 'error'

interface ReportResult {
  reportId: number
  status: string
  aiAnalysis?: any
  arbitrationReport?: any
}

export function ReportModal({ open, onOpenChange, work, onReportComplete }: ReportModalProps) {
  const [status, setStatus] = useState<ReportStatus>('form')
  const [formData, setFormData] = useState<ReportFormData>({
    type: '',
    reason: '',
    copiedWorkId: ''
  })
  const [result, setResult] = useState<ReportResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const reportTypes = [
    {
      value: 'copyright_infringement' as ReportType,
      label: 'Copyright Infringement / Plagiarism',
      description: 'This work copies or plagiarizes another work',
      icon: Copy,
      requiresWorkId: true
    },
    {
      value: 'inappropriate_content' as ReportType,
      label: 'Inappropriate Content',
      description: 'Contains violence, NSFW, or harmful content',
      icon: Shield,
      requiresWorkId: false
    },
    {
      value: 'spam' as ReportType,
      label: 'Spam',
      description: 'Low quality or repetitive content',
      icon: AlertTriangle,
      requiresWorkId: false
    },
    {
      value: 'harassment' as ReportType,
      label: 'Harassment',
      description: 'Targets or harasses individuals',
      icon: Flag,
      requiresWorkId: false
    },
    {
      value: 'other' as ReportType,
      label: 'Other',
      description: 'Other policy violations',
      icon: Flag,
      requiresWorkId: false
    }
  ]

  const selectedReportType = reportTypes.find(type => type.value === formData.type)

  const handleSubmit = async () => {
    if (!formData.type || !formData.reason.trim()) {
      setErrorMessage('Please select a report type and provide a reason')
      return
    }

    if (selectedReportType?.requiresWorkId && !formData.copiedWorkId.trim()) {
      setErrorMessage('Please provide the ID of the original work')
      return
    }

    if (formData.reason.length > 300) {
      setErrorMessage('Reason cannot exceed 300 characters')
      return
    }

    setStatus('submitting')
    setErrorMessage('')
    setProgress(10)

    try {
      // 提交举报 - 先尝试测试API
      const apiEndpoint = process.env.NODE_ENV === 'development' ? '/api/reports/test' : '/api/reports/submit'
      const reportResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedWorkId: work.work_id || work.id,
          reportType: formData.type,
          reason: formData.reason,
          allegedCopiedWorkId: formData.copiedWorkId || null,
        }),
      })

      const reportData = await reportResponse.json()

      if (!reportResponse.ok) {
        throw new Error(reportData.error || 'Failed to submit report')
      }
      setProgress(30)

      // 根据举报类型进行不同处理
      if (formData.type === 'inappropriate_content') {
        // 违规内容 - 使用现有的AI内容审核
        setStatus('processing')
        setProgress(50)

        const moderationResponse = await fetch('/api/ai/content-moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workId: work.work_id || work.id,
            imageUrl: work.image_url || work.image,
            reportId: reportData.reportId,
          }),
        })

        const moderationData = await moderationResponse.json()
        setProgress(100)

        setResult({
          reportId: reportData.reportId,
          status: moderationData.result?.status || 'completed',
          aiAnalysis: moderationData.result
        })

      } else if (formData.type === 'copyright_infringement') {
        // 抄袭举报 - 使用AI版权仲裁
        setStatus('processing')
        setProgress(50)

        const arbitrationResponse = await fetch('/api/ai/copyright-arbitration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportId: reportData.reportId,
            reportedWorkId: work.work_id || work.id,
            originalWorkId: formData.copiedWorkId,
          }),
        })

        const arbitrationData = await arbitrationResponse.json()
        setProgress(100)

        setResult({
          reportId: reportData.reportId,
          status: 'completed',
          arbitrationReport: arbitrationData.report
        })

      } else {
        // 其他类型举报 - 直接完成
        setProgress(100)
        setResult({
          reportId: reportData.reportId,
          status: 'submitted'
        })
      }

      setStatus('completed')

      if (onReportComplete) {
        onReportComplete(result)
      }

    } catch (error) {
      console.error('Report submission failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit report'
      setErrorMessage(`${errorMsg}. Please try again or contact support.`)
      setStatus('error')
    }
  }

  const resetForm = () => {
    setStatus('form')
    setFormData({ type: '', reason: '', copiedWorkId: '' })
    setResult(null)
    setProgress(0)
    setErrorMessage('')
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'submitting':
      case 'processing':
        return <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Flag className="w-6 h-6 text-blue-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Report Work
          </DialogTitle>
          <DialogDescription>
            Report inappropriate content or copyright violations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 作品信息 */}
          <div className="flex gap-3 p-3 bg-muted/30 rounded-lg border">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={work?.image_url || work?.image || "/placeholder.svg"} 
                alt={work?.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{work?.title}</h4>
              <p className="text-sm text-muted-foreground">
                ID: {work?.work_id || work?.id}
              </p>
              <p className="text-sm text-muted-foreground">
                by {work?.creator_address?.slice(0, 6)}...{work?.creator_address?.slice(-4)}
              </p>
            </div>
          </div>

          {status === 'form' && (
            <div className="space-y-4">
              {/* 举报类型选择 */}
              <div className="space-y-3">
                <Label className="text-base">Report Type</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ReportType }))}
                >
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <div key={type.value} className="flex items-start space-x-3">
                        <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={type.value} className="flex items-center gap-2 cursor-pointer">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{type.label}</span>
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {/* 抄袭作品ID输入 */}
              {selectedReportType?.requiresWorkId && (
                <div className="space-y-2">
                  <Label>Original Work ID</Label>
                  <Input
                    placeholder="Enter the ID of the original work"
                    value={formData.copiedWorkId}
                    onChange={(e) => setFormData(prev => ({ ...prev, copiedWorkId: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide the ID of the work that was allegedly copied
                  </p>
                </div>
              )}

              {/* 举报理由 */}
              <div className="space-y-2">
                <Label>Reason for Report</Label>
                <Textarea
                  placeholder="Please provide detailed information about why you are reporting this work..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="min-h-[100px]"
                  maxLength={300}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Be specific and provide evidence if possible</span>
                  <span>{formData.reason.length}/300</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {(status === 'submitting' || status === 'processing') && (
            <div className="text-center py-6">
              <div className="mb-4">
                <div className="text-blue-600 font-medium">
                  {status === 'submitting' ? 'Submitting report...' : 'Processing with AI...'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {status === 'submitting' 
                    ? 'Validating and saving your report'
                    : formData.type === 'copyright_infringement'
                    ? 'AI is analyzing for copyright similarities'
                    : 'AI is reviewing content for policy violations'
                  }
                </p>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          )}

          {status === 'completed' && result && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg text-green-600">Report Submitted</h3>
                <p className="text-sm text-muted-foreground">
                  Report ID: {result.reportId}
                </p>
              </div>

              {/* AI分析结果 */}
              {result.aiAnalysis && (
                <div className={`p-4 border rounded-lg ${
                  result.aiAnalysis.status === 'safe' && (result.aiAnalysis.confidence || 0) > 0.8
                    ? 'bg-green-50 border-green-200'
                    : result.aiAnalysis.status === 'safe'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    result.aiAnalysis.status === 'safe' && (result.aiAnalysis.confidence || 0) > 0.8
                      ? 'text-green-700'
                      : result.aiAnalysis.status === 'safe'
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }`}>
                    AI Analysis Result
                  </h4>
                  <div className="text-sm space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{result.aiAnalysis.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium">{Math.round((result.aiAnalysis.confidence || 0) * 100)}%</span>
                    </div>
                    
                    {/* 根据confidence显示不同结果 */}
                    {result.aiAnalysis.status === 'safe' && (result.aiAnalysis.confidence || 0) > 0.8 ? (
                      <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
                        <p className="text-green-800 font-medium text-sm">
                          ✅ AI检测没有发现问题
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          该内容通过了AI安全检测，置信度很高。举报可能是误报。
                        </p>
                      </div>
                    ) : result.aiAnalysis.issues?.length > 0 ? (
                      <div className="mt-3">
                        <p className="font-medium text-gray-800 mb-2">Issues found:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          {result.aiAnalysis.issues.map((issue: any, index: number) => (
                            <li key={index} className="text-xs text-gray-700">
                              <span className="font-medium">{issue.type}:</span> {issue.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <p className="text-yellow-800 text-sm">
                          需要进一步人工审核
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 版权仲裁结果 */}
              {result.arbitrationReport && (
                <div className={`p-4 border rounded-lg ${
                  result.arbitrationReport.similarityScore < 20
                    ? 'bg-green-50 border-green-200'
                    : result.arbitrationReport.similarityScore < 50
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                    result.arbitrationReport.similarityScore < 20
                      ? 'text-green-700'
                      : result.arbitrationReport.similarityScore < 50
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    <Scale className="w-4 h-4" />
                    AI Copyright Arbitration
                  </h4>
                  <div className="text-sm space-y-2 text-gray-700">
                    <div className="flex justify-between">
                      <span>Similarity Score:</span>
                      <span className="font-bold text-lg">{result.arbitrationReport.similarityScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Recommendation:</span>
                      <span className="font-medium">{result.arbitrationReport.recommendation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span>{Math.round(result.arbitrationReport.confidence)}%</span>
                    </div>
                    
                    {/* 根据相似度显示不同结果 */}
                    {result.arbitrationReport.similarityScore < 20 ? (
                      <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
                        <p className="text-green-800 font-medium text-sm">
                          ✅ 未发现明显抄袭
                        </p>
                        <p className="text-green-700 text-xs mt-1">
                          相似度很低，可能是原创作品或仅有微小相似之处。
                        </p>
                      </div>
                    ) : result.arbitrationReport.similarityScore < 50 ? (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                        <p className="text-yellow-800 font-medium text-sm">
                          ⚠️ 存在一定相似性
                        </p>
                        <p className="text-yellow-700 text-xs mt-1">
                          需要人工进一步审核判断是否构成抄袭。
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                        <p className="text-red-800 font-medium text-sm">
                          🚨 高度相似，疑似抄袭
                        </p>
                        <p className="text-red-700 text-xs mt-1">
                          相似度很高，建议进行详细调查。
                        </p>
                      </div>
                    )}
                    
                    {result.arbitrationReport.disputedAreas?.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-800 mb-2">Disputed Areas:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          {result.arbitrationReport.disputedAreas.map((area: string, index: number) => (
                            <li key={index} className="text-xs text-gray-700">{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 根据AI审核结果显示不同的提示信息 */}
              {result?.arbitrationReport ? (
                <div className="space-y-3">
                  {result.arbitrationReport.similarityScore < 20 ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-600" />
                      <span className="text-green-800 font-medium">
                        ✅ Content Review Complete
                      </span>
                      <p className="text-green-700 text-xs mt-2">
                        AI analysis shows this work appears to be original with no significant copyright concerns. 
                        The work has been approved for display on the platform.
                      </p>
                    </div>
                  ) : result.arbitrationReport.similarityScore < 50 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                      <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">
                        ⚠️ Under Review
                      </span>
                      <p className="text-yellow-700 text-xs mt-2">
                        AI detected some similarities that require human review. 
                        Our moderation team will examine this work and notify you of the decision.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                      <XCircle className="w-4 h-4 inline mr-2 text-red-600" />
                      <span className="text-red-800 font-medium">
                        🚨 Copyright Concern Detected
                      </span>
                      <p className="text-red-700 text-xs mt-2">
                        AI analysis detected significant similarities with existing content. 
                        This report has been escalated to our moderation team for detailed review.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <Clock className="w-4 h-4 inline mr-2 text-green-600" />
                  <span className="text-green-800">
                    Your report has been submitted and will be reviewed by our moderation team. 
                    You will be notified of any actions taken.
                  </span>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-medium text-red-600 mb-2">Report Failed</h3>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* 按钮区域 */}
        <div className="flex gap-2 pt-4">
          {status === 'form' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!formData.type || !formData.reason.trim()}
              >
                Submit Report
              </Button>
            </>
          )}

          {(status === 'submitting' || status === 'processing') && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}

          {(status === 'completed' || status === 'error') && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Close
              </Button>
              {status === 'error' && (
                <Button onClick={resetForm} className="flex-1">
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}