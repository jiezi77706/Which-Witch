"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { UserProfile } from "./app-container"
import { UploadCloud, CheckCircle2, X, Info, Shield, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAccount } from "wagmi"

import { NetworkSwitcher } from "./network-switcher"
import { useCollections } from "@/lib/hooks/useCollections"
import { useWorks } from "@/lib/hooks/useWorks"
import { useUser } from "@/lib/hooks/useUser"
import { AIAdvisorButton } from "./ai-advisor/ai-advisor-button"
import { LicenseSelectorButton } from "./license-selector-button"
import type { LicenseSelection } from "./license-selector-modal"

export function UploadView({ 
  onAddWork,
  preselectedParentWorkId,
  onClearPreselection,
}: { 
  user: UserProfile; 
  isRemix?: boolean;
  onAddWork?: (work: any) => void;
  preselectedParentWorkId?: number | null;
  onClearPreselection?: () => void;
}) {
  const { address } = useAccount()
  const { user: dbUser } = useUser()
  const { collections, authStatuses } = useCollections(dbUser?.id)
  const { works: userWorks } = useWorks(address) // 获取用户自己的作品
  
  // 使用 ref 跟踪上传状态，防止重复上传
  const isUploadingRef = useRef(false)
  
  const [mode, setMode] = useState<"original" | "remix">(preselectedParentWorkId ? "remix" : "original")
  const [selectedParentWork, setSelectedParentWork] = useState<number | null>(preselectedParentWorkId || null)
  
  const [files, setFiles] = useState<File[]>([])
  const [allowRemix, setAllowRemix] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [materialTags, setMaterialTags] = useState<string[]>([])
  const [currentMaterial, setCurrentMaterial] = useState("")
  
  // License selection
  const [licenseSelection, setLicenseSelection] = useState<LicenseSelection | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    licenseFee: "0.05"
  })
  
  // 新增状态：质押保证金
  const [agreeToStake, setAgreeToStake] = useState(false)
  const [showStakeInfo, setShowStakeInfo] = useState(false)
  
  // 当预选的 parent work 改变时更新状态
  useEffect(() => {
    if (preselectedParentWorkId) {
      setMode("remix")
      setSelectedParentWork(preselectedParentWorkId)
    }
  }, [preselectedParentWorkId])

  // 根据许可证选择自动调整remix设置
  useEffect(() => {
    if (licenseSelection?.derivative === 'B2') {
      setAllowRemix(false)
    }
  }, [licenseSelection])



  const SUGGESTED_TAGS = ["Cyberpunk", "Minimalist", "Nature", "Abstract", "Surreal"]
  const SUGGESTED_MATERIALS = ["Digital", "Wood", "Clay", "Glass", "Metal"]

  // Get approved works from collections and user's own works
  const approvedWorks = collections?.filter(c => {
    const work = c.work_details || c.works || c.work
    return authStatuses[c.work_id] === 'approved' && work?.allow_remix
  }) || []

  // Add user's own works as available parent works (for continue creating)
  const userOwnWorks = userWorks?.map(work => ({
    work_id: work.work_id,
    work_details: {
      work_id: work.work_id,
      title: work.title,
      image_url: work.image_url,
      creator_address: work.creator_address,
      allow_remix: work.allow_remix,
      tags: work.tags,
      material: work.material
    }
  })) || []

  // Combine approved works and user's own works, removing duplicates
  const allAvailableWorks = [
    ...approvedWorks,
    ...userOwnWorks.filter(userWork => 
      !approvedWorks.some(approved => approved.work_id === userWork.work_id)
    )
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 防止重复提交
    if (isUploadingRef.current) {
      console.log('⚠️ Upload already in progress, ignoring duplicate submission')
      return
    }
    
    if (files.length === 0 || !address) return
    if (mode === "remix" && !selectedParentWork) return

    // 立即设置上传标志并准备跳转到进度页面
    isUploadingRef.current = true
    
    // 准备上传数据
    const uploadData = {
      files,
      workData: {
        title: formData.title,
        description: formData.story,
        story: formData.story,
        material: materialTags,
        tags: tags,
        allowRemix: allowRemix,
        licenseFee: formData.licenseFee,
        licenseSelection: licenseSelection, // 使用许可证选择对象
        isRemix: mode === "remix",
        parentWorkId: mode === "remix" ? selectedParentWork : undefined,
        licenseSelection: licenseSelection,
      },
      creatorAddress: address,
      mode
    }

    // 通知父组件切换到进度页面
    if (onAddWork) {
      onAddWork(uploadData)
    }
  }

  const addTag = (val: string, list: string[], setList: any, currentSetter: any) => {
    if (val.trim() && !list.includes(val.trim())) {
      setList([...list, val.trim()])
      currentSetter("")
    }
  }

  const removeTag = (tagToRemove: string, list: string[], setList: any) => {
    setList(list.filter((tag) => tag !== tagToRemove))
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6"
      >
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {mode === "remix" ? "Remix Uploaded Successfully!" : "Work Uploaded Successfully!"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your work has been uploaded to IPFS and recorded on the blockchain!
          </p>
          
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
            <p className="font-medium text-green-500 mb-1">🎉 Upload Complete!</p>
            <p className="text-xs text-muted-foreground">
              ✅ Images uploaded to IPFS<br/>
              ✅ Metadata created and stored<br/>
              ✅ Work registered on blockchain<br/>
              ✅ Saved to database<br/>
              Your work is now live and visible on the square page!
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setStatus("idle")
          setFiles([])
          setFormData({ title: "", story: "", licenseFee: "0.05" })
          setTags([])
          setMaterialTags([])
          setSelectedParentWork(null)

          setUploadProgress({ current: 0, total: 0, step: "" })
          // 重置上传标志
          isUploadingRef.current = false
          if (onClearPreselection) onClearPreselection()
        }} className="w-full max-w-xs">
          Upload Another
        </Button>
      </motion.div>
    )
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6"
      >
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
          <X className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Upload Failed</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {errorMessage}
          </p>
        </div>
        <Button onClick={() => {
          setStatus("idle")
          setUploadProgress({ current: 0, total: 0, step: "" })
          // 重置上传标志
          isUploadingRef.current = false
        }} className="w-full max-w-xs">
          Try Again
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 网络状态检查 */}
      <NetworkSwitcher />
      
      <div className="space-y-4">
        <div className="flex items-center p-1 bg-muted rounded-lg w-full">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "original" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMode("original")}
          >
            Original Work
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "remix" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setMode("remix")}
          >
            Remix Work
          </button>
        </div>

        {/* 上传流程说明 */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
          <p className="font-medium text-blue-500 mb-2">⛓️ Blockchain Upload Flow</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Step 1:</strong> Upload images to IPFS</p>
            <p>• <strong>Step 2:</strong> Create metadata on IPFS</p>
            <p>• <strong>Step 3:</strong> Register work on blockchain</p>
            <p>• <strong>Step 4:</strong> Save to database</p>
            <p>• <strong>Result:</strong> Your work is permanently on-chain!</p>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{mode === "remix" ? "Upload Remix" : "Upload Original Work"}</h2>
          <p className="text-muted-foreground text-sm">
            {mode === "remix"
              ? "Select an approved parent work and upload your derivative."
              : "Register your creation to the genealogy tree."}
          </p>
        </div>
      </div>

      {mode === "remix" && (
        <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
          <div>
            <Label className="text-base">Select Parent Work</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose the original work you want to create a derivative from
            </p>
          </div>
          
          {/* Selected Parent Work Display */}
          {selectedParentWork && allAvailableWorks.find(w => w.work_id === selectedParentWork) && (() => {
            const selectedCollection = allAvailableWorks.find(w => w.work_id === selectedParentWork)
            const work = selectedCollection?.work_details || selectedCollection?.works || selectedCollection?.work
            return (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs font-medium text-primary mb-2">Selected Parent Work:</p>
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={work?.image_url || "/placeholder.svg"} 
                      className="w-full h-full object-cover" 
                      alt="Parent work"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {work?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {work?.creator_address?.slice(0, 6)}...
                      {work?.creator_address?.slice(-4)}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {work?.material?.slice(0, 2).map((mat: string) => (
                        <span key={mat} className="text-[10px] px-1.5 py-0.5 bg-background rounded">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedParentWork(null)}
                    className="flex-shrink-0"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )
          })()}
          
          {/* Parent Work Grid */}
          {!selectedParentWork && (
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {allAvailableWorks.length > 0 ? (
                allAvailableWorks.map((collection) => {
                  const work = collection.work_details || collection.works || collection.work
                  return (
                    <div
                      key={collection.work_id}
                      onClick={() => setSelectedParentWork(collection.work_id)}
                      className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all"
                    >
                      <div className="aspect-square bg-muted">
                        <img src={work?.image_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 bg-background/90">
                        <p className="text-xs font-medium truncate">{work?.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {work?.creator_address?.slice(0, 6)}...{work?.creator_address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-2 py-8 text-center text-muted-foreground text-sm">
                  No approved works found in your collection. <br />
                  Go to Saved tab to apply for remix rights.
                </div>
              )}
            </div>
          )}
          
          {allAvailableWorks.length > 0 && !selectedParentWork && (
            <p className="text-xs text-red-500">⚠️ Please select a parent work to proceed.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            files.length > 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || [])
              if (newFiles.length > 0) {
                setFiles(newFiles) // 替换而不是追加，避免重复
                // 清空input值，允许重新选择相同文件
                e.target.value = ''
              }
            }}
            accept="image/*,video/*"
            multiple
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            {files.length > 0 ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/20">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setFiles(prev => prev.filter((_, i) => i !== idx))
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click to add more images</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-medium text-sm">Click to upload Images/Videos</p>
                <p className="text-xs text-muted-foreground">Multiple files supported • IPFS storage</p>
              </div>
            )}
          </label>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="The Whispering Vase" 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">The Story</Label>
            <Textarea
              id="story"
              placeholder="What inspired this piece? Share the origin..."
              className="min-h-[100px]"
              value={formData.story}
              onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Material</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
              {materialTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                >
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag, materialTags, setMaterialTags)} />
                </span>
              ))}
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px]"
                placeholder="Type and enter (e.g. Clay)"
                value={currentMaterial}
                onChange={(e) => setCurrentMaterial(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addTag(currentMaterial, materialTags, setMaterialTags, setCurrentMaterial))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_MATERIALS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag, materialTags, setMaterialTags, setCurrentMaterial)}
                  className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inspiration Keywords</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                >
                  #{tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag, tags, setTags)} />
                </span>
              ))}
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-[100px]"
                placeholder="Type and enter..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag(currentTag, tags, setTags, setCurrentTag))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag, tags, setTags, setCurrentTag)}
                  className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  # {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Remixing</Label>
              <p className="text-xs text-muted-foreground">Allow others to create derivative works</p>
              {licenseSelection && licenseSelection.derivative === 'B2' && (
                <p className="text-xs text-red-500">⚠️ Current license doesn't allow derivatives</p>
              )}
            </div>
            <Switch 
              checked={allowRemix} 
              onCheckedChange={setAllowRemix}
              disabled={licenseSelection?.derivative === 'B2'}
            />
          </div>

          {/* License Configuration - 必须选择 */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
            <div className="space-y-3">
              <div>
                <Label className="text-base text-blue-600">📄 License Configuration (Required)</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  All works must have a license. This defines how others can use your work.
                </p>
              </div>
              
              {/* Two buttons in a row */}
              <div className="grid grid-cols-2 gap-3">
                <AIAdvisorButton
                  workData={{
                    title: formData.title,
                    description: formData.story,
                    tags: tags,
                    material: materialTags,
                    allowRemix: allowRemix,
                    licenseFee: formData.licenseFee
                  }}
                  size="default"
                />
                <LicenseSelectorButton
                  onLicenseSelect={setLicenseSelection}
                  initialSelection={licenseSelection || undefined}
                  size="default"
                />
              </div>

              {/* Display selected license */}
              {licenseSelection ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs font-medium text-green-600 mb-2">✓ License Selected:</p>
                  <p className="font-bold text-sm">{licenseSelection.licenseName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{licenseSelection.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-background rounded border">
                      {licenseSelection.commercial === 'A1' ? '✓ Commercial' : 
                       licenseSelection.commercial === 'A2' ? '✗ Non-Commercial' : 
                       '⚠ Auth Required'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-background rounded border">
                      {licenseSelection.derivative === 'B1' ? '✓ Derivatives' : '✗ No Derivatives'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-background rounded border">
                      {licenseSelection.nft === 'C1' ? '✓ NFT Allowed' : '✗ No NFT'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-background rounded border">
                      {licenseSelection.shareAlike === 'D1' ? 'ShareAlike' : 'No SA'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs font-medium text-red-600 mb-1">⚠️ License Required</p>
                  <p className="text-xs text-muted-foreground">Please select a license type before uploading</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Deposit Agreement */}
          <div className="space-y-4 p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Label className="text-base text-orange-600">Security Deposit Required</Label>
                <p className="text-xs text-muted-foreground">
                  To prevent spam and ensure quality, all uploads require a security deposit of <strong>0.00001 ETH</strong>.
                  This deposit will be returned after 7 days if no valid copyright disputes are filed.
                </p>
                
                <div className="flex items-start gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="agree-stake"
                    checked={agreeToStake}
                    onChange={(e) => setAgreeToStake(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="agree-stake" className="text-sm cursor-pointer">
                    I agree to stake <strong>0.00001 ETH</strong> as security deposit. I understand this amount will be returned after 7 days if no valid disputes are filed against my work.
                  </label>
                </div>

                {showStakeInfo && (
                  <div className="mt-3 p-3 bg-background/50 rounded-lg text-xs space-y-2">
                    <p><strong>How it works:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Your deposit is held in a smart contract</li>
                      <li>After 7 days, you can mint your work as NFT</li>
                      <li>If disputed and found guilty, deposit goes to reporter</li>
                      <li>If no disputes or disputes are invalid, you get full refund</li>
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStakeInfo(!showStakeInfo)}
                  className="text-xs h-6 px-2 text-orange-600 hover:text-orange-700"
                >
                  <Info className="w-3 h-3 mr-1" />
                  {showStakeInfo ? 'Hide Details' : 'Learn More'}
                </Button>
              </div>
            </div>
          </div>

          {allowRemix && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              {/* Licensing Fee */}
              <div className="space-y-2">
                <Label>Licensing Fee (ETH)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.05"
                  value={formData.licenseFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseFee: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Fee charged when others want to create derivatives of your work
                </p>
              </div>
            </div>
          )}


        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={files.length === 0 || !formData.title || isUploadingRef.current || (mode === "remix" && !selectedParentWork) || !licenseSelection || !agreeToStake}
        >
          {mode === "remix" ? "Upload Remix to Blockchain" : "Upload Work to Blockchain"}
        </Button>
        
        {/* Privacy Notice */}
        <div className="text-center p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-1">🔒 Privacy Protection</p>
          <p className="text-xs text-muted-foreground">
            Your uploaded works will not be used as training data for AI models. 
            We respect your intellectual property and creative rights.
          </p>
        </div>
        
        {/* Upload Requirements Summary */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
          <p className="font-medium mb-2">Upload Requirements:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-2 ${files.length > 0 ? 'text-green-600' : ''}`}>
              {files.length > 0 ? '✓' : '○'} Files selected
            </div>
            <div className={`flex items-center gap-2 ${formData.title ? 'text-green-600' : ''}`}>
              {formData.title ? '✓' : '○'} Title provided
            </div>
            <div className={`flex items-center gap-2 ${licenseSelection ? 'text-green-600' : ''}`}>
              {licenseSelection ? '✓' : '○'} License selected
            </div>
            <div className={`flex items-center gap-2 ${agreeToStake ? 'text-green-600' : ''}`}>
              {agreeToStake ? '✓' : '○'} Deposit agreed
            </div>
            {mode === "remix" && (
              <div className={`flex items-center gap-2 col-span-2 ${selectedParentWork ? 'text-green-600' : ''}`}>
                {selectedParentWork ? '✓' : '○'} Parent work selected
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
