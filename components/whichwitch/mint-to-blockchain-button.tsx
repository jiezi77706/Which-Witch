"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Coins, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface MintToBlockchainButtonProps {
  work: any
  onMintSuccess?: (result: any) => void
  className?: string
}

export function MintToBlockchainButton({ 
  work, 
  onMintSuccess, 
  className = "" 
}: MintToBlockchainButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [mintNFT, setMintNFT] = useState(false)
  const [nftMetadata, setNftMetadata] = useState({
    name: work?.title || "",
    description: work?.story || work?.description || "",
  })
  const [status, setStatus] = useState<"idle" | "minting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleMint = async () => {
    setStatus("error")
    setErrorMessage("This feature has been replaced by the new upload flow. Please re-upload your work using the new upload process which directly mints to blockchain.")
    return

    // 旧的mint逻辑已禁用
    /*
    setStatus("minting")
    setErrorMessage("")

    try {
      const { mintExistingWork, mintNFTForWork } = await import('@/lib/services/work-upload.service')
      
      // 构建工作数据
      const workData = {
        title: work.title,
        description: work.story || work.description,
        story: work.story,
        material: work.material || [],
        tags: work.tags || [],
        allowRemix: work.allowRemix || work.allow_remix,
        licenseFee: work.licenseFee || work.license_fee || "0.05",
        isRemix: work.isRemix || work.is_remix,
        parentWorkId: work.parentWorkId || work.parent_work_id,
      }

      console.log('⛓️ Minting work to blockchain...', work.id)

      // 第一步：Mint到区块链
      const mintResult = await mintExistingWork(
        work.id,
        workData,
        work.creatorAddress || work.creator_address,
        work.metadataUri || work.metadata_uri
      )

      console.log("✅ Blockchain mint completed!", mintResult)

      let finalResult: any = {
        ...mintResult,
        nftMinted: false
      }

      // 第二步：如果选择了NFT，则铸造NFT
      if (mintNFT) {
        console.log('🎨 Minting NFT...')
        
        const nftResult = await mintNFTForWork(
          mintResult.blockchainWorkId,
          work.creatorAddress || work.creator_address,
          {
            name: nftMetadata.name || work.title,
            description: nftMetadata.description || work.story,
            attributes: [
              { trait_type: 'Mint Method', value: 'Retroactive' },
              { trait_type: 'Platform', value: 'WhichWitch v2.0' },
            ]
          }
        )

        console.log("✅ NFT minting completed!", nftResult)
        
        finalResult = {
          ...finalResult,
          nftMinted: true,
          nft: nftResult
        }
      }

      setStatus("success")
      
      // 通知父组件
      if (onMintSuccess) {
        onMintSuccess(finalResult)
      }

      // 延迟关闭模态框
      setTimeout(() => {
        setShowModal(false)
        setStatus("idle")
        // 刷新页面以显示更新
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('❌ Minting failed:', error)
      setErrorMessage(error instanceof Error ? error.message : "Minting failed")
      setStatus("error")
    }
    */
  }

  // 如果作品已经上链，不显示按钮
  if (work?.is_on_chain || work?.upload_status === 'minted' || work?.upload_status === 'nft_minted') {
    return null
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={`h-8 bg-transparent border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/5 text-orange-500 ${className}`}
        onClick={() => setShowModal(true)}
      >
        <Coins className="w-3.5 h-3.5 mr-1.5" />
        Mint to Chain
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle>Mint to Blockchain</DialogTitle>
            <DialogDescription>
              Mint "{work?.title}" to the blockchain and optionally create an NFT
            </DialogDescription>
          </DialogHeader>

          {status === "success" ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg">Minting Successful!</h3>
              <p className="text-muted-foreground text-sm">
                {mintNFT 
                  ? "Your work has been minted to blockchain and NFT created!"
                  : "Your work has been minted to blockchain!"
                }
              </p>
            </div>
          ) : status === "error" ? (
            <div className="py-4">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Minting Failed</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => setStatus("idle")} className="w-full">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* 当前状态 */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                    Database Only
                  </Badge>
                  <span className="text-sm font-medium">{work?.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This work is currently stored in database and IPFS only. 
                  Mint it to blockchain to enable trading and full Web3 features.
                </p>
              </div>

              {/* NFT选项 */}
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-primary">🎨 Also Mint as NFT</Label>
                    <p className="text-xs text-muted-foreground">
                      Create an NFT along with blockchain minting
                    </p>
                  </div>
                  <Switch checked={mintNFT} onCheckedChange={setMintNFT} />
                </div>

                {mintNFT && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 pt-2 border-t border-primary/10">
                    <div className="space-y-2">
                      <Label className="text-sm">NFT Name</Label>
                      <Input 
                        placeholder={work?.title || "NFT Name"}
                        value={nftMetadata.name}
                        onChange={(e) => setNftMetadata(prev => ({ ...prev, name: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">NFT Description</Label>
                      <Textarea
                        placeholder={work?.story || work?.description || "NFT Description"}
                        value={nftMetadata.description}
                        onChange={(e) => setNftMetadata(prev => ({ ...prev, description: e.target.value }))}
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 费用说明 */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p className="font-medium mb-1">⚠️ Gas Fees Required</p>
                <p>
                  Minting to blockchain requires gas fees. 
                  {mintNFT && " NFT minting requires additional gas fees."}
                  Make sure you have enough ETH in your wallet.
                </p>
              </div>
            </div>
          )}

          {status !== "success" && status !== "error" && (
            <DialogFooter>
              <Button 
                onClick={handleMint} 
                className="w-full" 
                disabled={status === "minting"}
              >
                {status === "minting" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mintNFT ? "Minting & Creating NFT..." : "Minting to Blockchain..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {mintNFT ? "Mint & Create NFT" : "Mint to Blockchain"}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}