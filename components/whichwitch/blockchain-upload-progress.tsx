"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft, RefreshCw, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAccount } from "wagmi"

interface UploadData {
  files: File[]
  workData: {
    title: string
    description?: string
    story?: string
    material?: string[]
    tags?: string[]
    allowRemix: boolean
    licenseFee: string
    isRemix: boolean
    parentWorkId?: number
    licenseSelection?: any
  }
  creatorAddress: string
  mode: "original" | "remix"
}

interface BlockchainUploadProgressProps {
  uploadData: UploadData
  onComplete: (result: any) => void
  onCancel: () => void
}

type UploadStatus = 'preparing' | 'ipfs' | 'metadata' | 'ai-review' | 'blockchain' | 'database' | 'success' | 'error'

export function BlockchainUploadProgress({ uploadData, onComplete, onCancel }: BlockchainUploadProgressProps) {
  const { address } = useAccount()
  const [status, setStatus] = useState<UploadStatus>('preparing')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [txHash, setTxHash] = useState('')
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [aiReviewResult, setAiReviewResult] = useState<any>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 开始上传流程
  useEffect(() => {
    if (uploadData && !isCompleted) {
      startUpload()
    }
  }, [uploadData, isCompleted])

  const startUpload = async () => {
    if (isCompleted) return
    
    try {
      setStatus('preparing')
      setProgress(0)
      setCurrentStep('准备上传...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 1: 上传图片到IPFS
      setStatus('ipfs')
      setCurrentStep('上传图片到IPFS...')
      setProgress(10)

      const { uploadFileToPinata, createAndUploadMetadata } = await import('@/lib/ipfs/pinata.service')
      
      const imageHashes: string[] = []
      for (let i = 0; i < uploadData.files.length; i++) {
        const file = uploadData.files[i]
        setCurrentFile(file.name)
        setCurrentStep(`上传图片 ${i + 1}/${uploadData.files.length}`)
        setProgress(10 + (i / uploadData.files.length) * 15)
        
        const hash = await uploadFileToPinata(file)
        imageHashes.push(hash)
        
        // 小延迟让用户看到进度
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      const imageUrls = imageHashes.map(hash => `https://gateway.pinata.cloud/ipfs/${hash}`)
      const primaryImageUrl = imageUrls[0]
      
      console.log('✅ 图片上传完成:', imageHashes)

      // Step 2: 创建metadata
      setStatus('metadata')
      setCurrentStep('创建作品metadata...')
      setCurrentFile('')
      setProgress(30)
      
      const workMetadataHash = await createAndUploadMetadata({
        title: uploadData.workData.title,
        description: uploadData.workData.description,
        story: uploadData.workData.story,
        imageHash: imageHashes[0],
        images: imageUrls,
        material: uploadData.workData.material,
        tags: uploadData.workData.tags,
        creator: uploadData.creatorAddress,
        parentWorkId: uploadData.workData.parentWorkId,
      })
      const workMetadataUri = `ipfs://${workMetadataHash}`
      
      console.log('✅ Metadata创建完成:', workMetadataUri)
      setProgress(40)

      // Step 3: AI内容审核
      setStatus('ai-review')
      setCurrentStep('AI内容审核中...')
      setProgress(50)
      
      try {
        const moderationResponse = await fetch('/api/ai/content-moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workId: Date.now(), // 临时ID
            imageUrl: primaryImageUrl,
            title: uploadData.workData.title,
            description: uploadData.workData.description,
            creatorAddress: uploadData.creatorAddress,
            stakeAmount: "0.01",
            stakeTxHash: "0x" + Math.random().toString(16).substring(2)
          })
        })

        const moderationData = await moderationResponse.json()
        setAiReviewResult(moderationData)
        
        // 检查实际的审核状态（在result对象中）
        const actualStatus = moderationData.result?.status || moderationData.status
        
        if (actualStatus === 'rejected' || actualStatus === 'unsafe') {
          throw new Error(`内容审核未通过: ${moderationData.message || '内容可能包含不当信息'}`)
        }

        console.log('✅ AI内容审核通过:', moderationData)
        setProgress(60)
      } catch (moderationError) {
        console.error('⚠️ AI审核失败:', moderationError)
        throw moderationError
      }

      // Step 4: 区块链操作
      setStatus('blockchain')
      setCurrentStep('连接钱包并上链...')
      setProgress(70)
      
      const { registerOriginalWork, registerDerivativeWork } = await import('@/lib/web3/services/contract.service')
      
      let contractResult
      if (uploadData.workData.isRemix && uploadData.workData.parentWorkId) {
        setCurrentStep('注册衍生作品到区块链...')
        contractResult = await registerDerivativeWork(
          BigInt(uploadData.workData.parentWorkId),
          uploadData.workData.licenseFee,
          uploadData.workData.allowRemix,
          workMetadataUri
        )
      } else {
        setCurrentStep('注册原创作品到区块链...')
        contractResult = await registerOriginalWork(
          uploadData.workData.licenseFee,
          uploadData.workData.allowRemix,
          workMetadataUri
        )
      }
      
      const blockchainWorkId = Number(contractResult.workId)
      setTxHash(contractResult.hash)
      
      console.log('✅ 区块链注册完成:', {
        blockchainWorkId,
        txHash: contractResult.hash
      })
      setProgress(85)

      // Step 5: 保存到数据库
      setStatus('database')
      setCurrentStep('保存到数据库...')
      setProgress(95)
      
      const dbWorkData = {
        workId: blockchainWorkId,
        creatorAddress: uploadData.creatorAddress,
        title: uploadData.workData.title,
        description: uploadData.workData.description,
        story: uploadData.workData.story,
        imageUrl: primaryImageUrl,
        images: imageUrls,
        metadataUri: workMetadataUri,
        material: uploadData.workData.material,
        tags: uploadData.workData.tags,
        allowRemix: uploadData.workData.allowRemix,
        licenseFee: uploadData.workData.licenseFee,
        isRemix: uploadData.workData.isRemix,
        parentWorkId: uploadData.workData.parentWorkId,
        licenseSelection: uploadData.workData.licenseSelection,
        txHash: contractResult.hash,
      }
      
      const { createWork } = await import('@/lib/supabase/services/work.service')
      await createWork(dbWorkData)
      
      console.log('✅ 数据库保存完成')
      setProgress(100)

      // 完成
      setStatus('success')
      setCurrentStep('上传完成！')
      setIsCompleted(true)
      
      // 移除自动跳转，让用户手动关闭

    } catch (error) {
      console.error('❌ 上传失败:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setIsCompleted(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
      case 'ipfs':
      case 'metadata':
      case 'blockchain':
      case 'database':
        return <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      case 'success':
        return <CheckCircle2 className="w-12 h-12 text-green-500" />
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'preparing':
      case 'ipfs':
      case 'metadata':
      case 'blockchain':
      case 'database':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  const getStepStatus = (step: string) => {
    const steps = ['preparing', 'ipfs', 'metadata', 'ai-review', 'blockchain', 'database', 'success']
    const currentIndex = steps.indexOf(status)
    const stepIndex = steps.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            {/* 作品预览 */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-border shadow-lg">
                  {uploadData.files[0] && (
                    <img 
                      src={URL.createObjectURL(uploadData.files[0])} 
                      alt={uploadData.workData.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* 状态指示器 */}
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-2 border-2 border-border shadow-lg">
                  {getStatusIcon()}
                </div>
              </div>
            </div>

            {/* 状态信息 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{uploadData.workData.title}</h2>
              <p className="text-muted-foreground">by {uploadData.creatorAddress.slice(0, 6)}...{uploadData.creatorAddress.slice(-4)}</p>
              
              <div className={`text-lg font-medium ${getStatusColor()}`}>
                {currentStep}
                {currentFile && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentFile}
                  </div>
                )}
              </div>

              {/* 进度条 */}
              {status !== 'success' && status !== 'error' && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{progress}% complete</span>
                    <span>Time: {formatTime(timeElapsed)}</span>
                  </div>
                </div>
              )}

              {/* 处理步骤 */}
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    getStepStatus('ipfs') === 'completed' ? 'bg-green-500' : 
                    getStepStatus('ipfs') === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className={
                    getStepStatus('ipfs') === 'completed' ? 'text-green-600' : 
                    getStepStatus('ipfs') === 'active' ? 'text-blue-600' : 'text-muted-foreground'
                  }>
                    Upload to IPFS
                  </span>
                  {getStepStatus('ipfs') === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    getStepStatus('metadata') === 'completed' ? 'bg-green-500' : 
                    getStepStatus('metadata') === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className={
                    getStepStatus('metadata') === 'completed' ? 'text-green-600' : 
                    getStepStatus('metadata') === 'active' ? 'text-blue-600' : 'text-muted-foreground'
                  }>
                    Create Metadata
                  </span>
                  {getStepStatus('metadata') === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    getStepStatus('ai-review') === 'completed' ? 'bg-green-500' : 
                    getStepStatus('ai-review') === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className={
                    getStepStatus('ai-review') === 'completed' ? 'text-green-600' : 
                    getStepStatus('ai-review') === 'active' ? 'text-blue-600' : 'text-muted-foreground'
                  }>
                    AI Content Review
                  </span>
                  {getStepStatus('ai-review') === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    getStepStatus('blockchain') === 'completed' ? 'bg-green-500' : 
                    getStepStatus('blockchain') === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className={
                    getStepStatus('blockchain') === 'completed' ? 'text-green-600' : 
                    getStepStatus('blockchain') === 'active' ? 'text-blue-600' : 'text-muted-foreground'
                  }>
                    Blockchain Registration
                  </span>
                  {getStepStatus('blockchain') === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {getStepStatus('blockchain') === 'active' && <Wallet className="w-4 h-4 text-blue-500 animate-pulse" />}
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    getStepStatus('database') === 'completed' ? 'bg-green-500' : 
                    getStepStatus('database') === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  <span className={
                    getStepStatus('database') === 'completed' ? 'text-green-600' : 
                    getStepStatus('database') === 'active' ? 'text-blue-600' : 'text-muted-foreground'
                  }>
                    Save to Database
                  </span>
                  {getStepStatus('database') === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
              </div>

              {/* AI审核结果 */}
              {aiReviewResult && (
                <div className={`p-3 border rounded-lg text-left ${
                  (aiReviewResult.result?.status === 'safe' || aiReviewResult.status === 'approved')
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${
                    (aiReviewResult.result?.status === 'safe' || aiReviewResult.status === 'approved') ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    AI Content Review Result:
                  </p>
                  <p className="text-xs">
                    Status: {(aiReviewResult.result?.status === 'safe' || aiReviewResult.status === 'approved') ? '✅ Approved' : '⚠️ Flagged'}
                  </p>
                  {aiReviewResult.result?.confidence && (
                    <p className="text-xs">
                      Confidence: {Math.round(aiReviewResult.result.confidence * 100)}%
                    </p>
                  )}
                  {aiReviewResult.message && (aiReviewResult.result?.status !== 'safe' && aiReviewResult.status !== 'approved') && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      {aiReviewResult.message}
                    </p>
                  )}
                  {(aiReviewResult.result?.status === 'safe' || aiReviewResult.status === 'approved') && (
                    <p className="text-xs mt-1 text-green-600">
                      {aiReviewResult.message || 'No issues detected.'}
                    </p>
                  )}
                </div>
              )}

              {/* 交易哈希 */}
              {txHash && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
                  <p className="text-xs font-medium text-blue-600 mb-1">Transaction Hash:</p>
                  <p className="text-xs font-mono break-all">{txHash}</p>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View on Etherscan →
                  </a>
                </div>
              )}

              {/* 成功消息 */}
              {status === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">
                    🎉 Your work has been successfully uploaded to the blockchain and is now live!
                  </p>
                </div>
              )}

              {/* 错误消息 */}
              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    ❌ {errorMessage}
                  </p>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4">
              {status === 'error' && (
                <>
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={startUpload}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </>
              )}

              {status === 'success' && (
                <div className="text-center">
                  <p className="text-sm text-green-600 mb-2">
                    🎉 Upload completed! Click below to continue.
                  </p>
                  <Button
                    onClick={() => onComplete(null)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Go to Square
                  </Button>
                </div>
              )}

              {status !== 'success' && status !== 'error' && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                  disabled={status === 'blockchain'} // 不能在区块链操作时取消
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {status === 'blockchain' ? 'Please wait...' : 'Cancel'}
                </Button>
              )}
            </div>

            {/* 帮助信息 */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {status === 'blockchain' 
                  ? 'Please confirm the transaction in your wallet...'
                  : status === 'success'
                  ? 'Your work is now permanently stored on the blockchain!'
                  : status === 'error'
                  ? 'Need help? Check your wallet connection and try again.'
                  : 'Please keep this page open while processing...'
                }
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}