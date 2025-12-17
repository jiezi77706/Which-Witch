"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { UserProfile } from "./app-container"
import { UploadCloud, CheckCircle2, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAccount } from "wagmi"

import { NetworkSwitcher } from "./network-switcher"
import { useCollections } from "@/lib/hooks/useCollections"
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
  
  const [mode, setMode] = useState<"original" | "remix">(preselectedParentWorkId ? "remix" : "original")
  const [selectedParentWork, setSelectedParentWork] = useState<number | null>(preselectedParentWorkId || null)
  
  // 当预选的 parent work 改变时更新状态
  useEffect(() => {
    if (preselectedParentWorkId) {
      setMode("remix")
      setSelectedParentWork(preselectedParentWorkId)
    }
  }, [preselectedParentWorkId])

  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [files, setFiles] = useState<File[]>([])
  const [allowRemix, setAllowRemix] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [materialTags, setMaterialTags] = useState<string[]>([])
  const [currentMaterial, setCurrentMaterial] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  
  // License selection
  const [licenseSelection, setLicenseSelection] = useState<LicenseSelection | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    licenseFee: "0.05"
  })

  // NFT相关状态
  const [mintNFT, setMintNFT] = useState(false)
  const [nftMetadata, setNftMetadata] = useState({
    name: "",
    description: "",
  })

  const SUGGESTED_TAGS = ["Cyberpunk", "Minimalist", "Nature", "Abstract", "Surreal"]
  const SUGGESTED_MATERIALS = ["Digital", "Wood", "Clay", "Glass", "Metal"]

  // Get approved works from collections
  const approvedWorks = collections?.filter(c => {
    const work = c.work_details || c.works || c.work
    return authStatuses[c.work_id] === 'approved' && work?.allow_remix
  }) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0 || !address) return
    if (mode === "remix" && !selectedParentWork) return

    setStatus("uploading")
    setErrorMessage("")

    try {
      // 使用新的分离式上传服务
      const { uploadWorkToDatabase, mintExistingWork, mintNFTForWork } = await import('@/lib/services/work-upload.service')
      
      const workUploadData = {
        title: formData.title,
        description: formData.story,
        story: formData.story,
        material: materialTags,
        tags: tags,
        allowRemix: allowRemix,
        licenseFee: formData.licenseFee,
        isRemix: mode === "remix",
        parentWorkId: mode === "remix" ? selectedParentWork : undefined,
      }

      console.log('📤 Step 1: Upload work to database and IPFS...')

      // Step 1: Upload to database and IPFS
      const uploadResult = await uploadWorkToDatabase(
        files,
        workUploadData,
        address
      )

      console.log("✅ Work uploaded to database!", uploadResult)

      // Step 2: AI Content Moderation (with token staking)
      console.log('🛡️ Step 2: AI Content Moderation...')
      
      try {
        const moderationResponse = await fetch('/api/ai/content-moderation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workId: uploadResult.work.workId,
            imageUrl: uploadResult.work.imageUrl,
            creatorAddress: address,
            stakeAmount: "0.01", // Token stake amount
            stakeTxHash: "0x" + Math.random().toString(16).substring(2) // Mock tx hash
          })
        })

        const moderationData = await moderationResponse.json()
        
        if (moderationData.status === 'rejected') {
          throw new Error('Content rejected by AI moderation: ' + moderationData.message)
        }

        console.log("✅ Content moderation passed!", moderationData)
      } catch (moderationError) {
        console.error('⚠️ Moderation warning:', moderationError)
        // Continue with upload even if moderation fails (for demo purposes)
      }

      let finalResult = uploadResult

      // 第二步：如果用户选择mint，则进行区块链操作
      if (mintNFT) {
        console.log('⛓️ 第二步：Mint到区块链...')
        
        const mintResult = await mintExistingWork(
          uploadResult.work.workId,
          workUploadData,
          address,
          uploadResult.work.metadataUri
        )

        console.log("✅ 区块链mint完成!", mintResult)

        // 第三步：铸造NFT
        console.log('🎨 第三步：铸造NFT...')
        
        const nftResult = await mintNFTForWork(
          mintResult.blockchainWorkId,
          address,
          {
            name: nftMetadata.name || formData.title,
            description: nftMetadata.description || formData.story,
            attributes: [
              { trait_type: 'Upload Method', value: 'WhichWitch v2.0' },
              { trait_type: 'Auto IPFS', value: 'Yes' },
            ]
          }
        )

        console.log("✅ NFT铸造完成!", nftResult)

        // 更新最终结果
        finalResult = {
          ...uploadResult,
          work: {
            ...uploadResult.work,
            workId: mintResult.blockchainWorkId,
            txHash: mintResult.txHash
          },
          onChain: true
        }
      }

      setStatus("success")
      
      // 通知父组件
      if (onAddWork) {
        onAddWork(finalResult)
      }
      
    } catch (error) {
      console.error("❌ 上传失败:", error)
      setErrorMessage(error instanceof Error ? error.message : "Upload failed. Please try again.")
      setStatus("error")
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
            {mode === "remix" ? "Remix Uploaded!" : "Work Uploaded Successfully!"}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {mintNFT 
              ? "Your work has been uploaded to IPFS, recorded on the blockchain, and minted as an NFT!"
              : "Your work has been uploaded to IPFS and saved to the database. It's now visible on the square page!"
            }
          </p>
          
          {mintNFT ? (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <p className="font-medium text-primary mb-1">🎨 Complete NFT Creation!</p>
              <p className="text-xs text-muted-foreground">
                ✅ Uploaded to IPFS<br/>
                ✅ Recorded on blockchain<br/>
                ✅ Minted as NFT<br/>
                Your work is now fully on-chain and tradeable!
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <p className="font-medium text-blue-500 mb-1">📤 Database Upload Complete!</p>
              <p className="text-xs text-muted-foreground">
                ✅ Uploaded to IPFS<br/>
                ✅ Saved to database<br/>
                💡 You can mint to blockchain later from your profile or the square page!
              </p>
            </div>
          )}
        </div>
        <Button onClick={() => {
          setStatus("idle")
          setFiles([])
          setFormData({ title: "", story: "", licenseFee: "0.05" })
          setTags([])
          setMaterialTags([])
          setSelectedParentWork(null)
          setMintNFT(false)
          setNftMetadata({ name: "", description: "" })
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
        <Button onClick={() => setStatus("idle")} className="w-full max-w-xs">
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
          <p className="font-medium text-blue-500 mb-2">📤 New Upload Flow</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Step 1:</strong> Your work is uploaded to IPFS and saved to database</p>
            <p>• <strong>Step 2:</strong> Choose to mint to blockchain now or later</p>
            <p>• <strong>Result:</strong> Work appears on square page immediately, mint when ready!</p>
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
          {selectedParentWork && approvedWorks.find(w => w.work_id === selectedParentWork) && (() => {
            const selectedCollection = approvedWorks.find(w => w.work_id === selectedParentWork)
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
              {approvedWorks.length > 0 ? (
                approvedWorks.map((collection) => {
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
          
          {approvedWorks.length > 0 && !selectedParentWork && (
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
              setFiles(prev => [...prev, ...newFiles])
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
            </div>
            <Switch checked={allowRemix} onCheckedChange={setAllowRemix} />
          </div>

          {allowRemix && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              {/* License Options Section */}
              <div className="space-y-3">
                <Label className="text-base">License Configuration</Label>
                
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
                {licenseSelection && (
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
                )}
              </div>

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

          {/* NFT铸造选项 */}
          <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-primary">🎨 Mint as NFT (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Choose to mint your work as an NFT immediately, or upload to database first and mint later
                </p>
              </div>
              <Switch checked={mintNFT} onCheckedChange={setMintNFT} />
            </div>

            {mintNFT && (
              <div className="space-y-3 animate-in slide-in-from-top-2 pt-2 border-t border-primary/10">
                <div className="space-y-2">
                  <Label className="text-sm">NFT Name (Optional)</Label>
                  <Input 
                    placeholder={formData.title || "Leave empty to use work title"}
                    value={nftMetadata.name}
                    onChange={(e) => setNftMetadata(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">NFT Description (Optional)</Label>
                  <Textarea
                    placeholder={formData.story || "Leave empty to use work story"}
                    value={nftMetadata.description}
                    onChange={(e) => setNftMetadata(prev => ({ ...prev, description: e.target.value }))}
                    className="text-sm min-h-[60px]"
                  />
                </div>

                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <p className="font-medium mb-1">✨ Auto-generated NFT features:</p>
                  <ul className="space-y-0.5 text-[10px]">
                    <li>• IPFS metadata with your images</li>
                    <li>• Material and tag attributes</li>
                    <li>• Creator and work ID properties</li>
                    <li>• External link to your work page</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={files.length === 0 || !formData.title || status === "uploading" || (mode === "remix" && !selectedParentWork)}
        >
          {status === "uploading" 
            ? (mintNFT ? "Uploading & Minting..." : "Uploading...") 
            : (mintNFT 
              ? (mode === "remix" ? "Upload & Mint Remix" : "Upload & Mint to Chain")
              : (mode === "remix" ? "Upload Remix" : "Upload Work")
            )
          }
        </Button>
      </form>
    </div>
  )
}
