"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Bookmark, GitFork, Share2, Coins, Trash2, Clock, Folder, Lock, Upload, RefreshCcw, Eye, Shield, ShoppingCart, Copy, Maximize2, Minimize2, X, Flag } from "lucide-react"
import { NFTStatusBadge, NFTStatus } from "./nft-status-badge"
import { NFTActionButtons } from "./nft-action-buttons"
import { MintNFTModal, BuyNFTModal, ListNFTModal } from "./nft-modals"
import { MintNFTModal as RetroactiveMintModal } from "./mint-nft-modal"

import { MintNFTModal as NewMintModal, SellNFTModal } from "./nft-mint-sell-modals"
import { ContentModerationModal } from "./content-moderation-modal"
import { ReportModal } from "./report-modal"
import { WorkVoting } from "./work-voting"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { processPayment } from "@/lib/web3/services/contract.service"
import { toggleLike } from "@/lib/supabase/services/like.service"

export function WorkCard({
  work,
  isRemixable = false,
  allowTip = false,
  status,
  onRemix,
  onClick,
  showSavedDate = false,
  onUnsave,
  onCollect,
  folders = [],
  onCreateFolder,
  initialLiked = false,
  // NFT 相关 props
  nftStatus,
  onMintNFT,
  onBuyNFT,
  onListNFT,
  // 新增：是否为广场页面简化模式
  isSquareView = false,
}: {
  work: any
  isRemixable?: boolean
  allowTip?: boolean
  status?: "pending" | "approved" | "rejected" | "none"
  onRemix?: () => void
  onClick?: () => void
  showSavedDate?: boolean
  onUnsave?: () => void
  onCollect?: (folder: string) => void
  folders?: string[]
  onCreateFolder?: (name: string) => void
  initialLiked?: boolean
  // NFT 相关类型
  nftStatus?: NFTStatus
  onMintNFT?: () => void
  onBuyNFT?: () => void
  onListNFT?: () => void
  // 新增：是否为广场页面简化模式
  isSquareView?: boolean
}) {
  const { address } = useAccount()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(work.likes || 0)
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedRemixer, setSelectedRemixer] = useState(0)
  
  // NFT 相关状态
  const [showMintNFTModal, setShowMintNFTModal] = useState(false)
  const [showBuyNFTModal, setShowBuyNFTModal] = useState(false)
  const [showListNFTModal, setShowListNFTModal] = useState(false)
  
  // 新的NFT功能状态
  const [showNewMintModal, setShowNewMintModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  
  // 内容审核状态
  const [showContentModerationModal, setShowContentModerationModal] = useState(false)
  
  useEffect(() => {
    setLiked(initialLiked)
  }, [initialLiked])
  
  const handleLike = async () => {
    if (!address) {
      console.error('User not connected')
      return
    }
    
    try {
      const newLikedState = await toggleLike(work.id, address)
      setLiked(newLikedState)
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const canBeRemixed = work?.allowRemix !== false
  const isRemixActionAvailable = isRemixable && canBeRemixed

  // Build genealogy with proper null checks
  const genealogy = work?.allowRemix
    ? [
        {
          id: "root",
          title: work.title || "Untitled",
          author: work.author || "Unknown",
          date: work.createdAt || "2023-01-01",
          type: "Original",
          image: work.image || "/placeholder.svg",
        },
        ...(work.remixCount > 0 && Array.isArray(work.remixers) && work.remixers.length > 0
          ? work.remixers.slice(0, 3).map((remixer: string, idx: number) => ({
              id: `child${idx}`,
              title: `Remix by ${remixer}`,
              author: remixer,
              date: new Date(
                new Date(work.createdAt || Date.now()).getTime() + (idx + 1) * 30 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString(),
              type: "Remix",
              image: work.images?.[idx % work.images.length] || work.image || "/placeholder.svg",
            }))
          : []),
      ]
    : []
  // </CHANGE>

  const handleCardClick = (e: any) => {
    // Prevent click when clicking buttons
    if (e.target.closest("button")) return
    if (onClick) {
      onClick()
    } else {
      setShowDetailsModal(true)
    }
  }

  return (
    <>
      <Card
        onClick={handleCardClick}
        className="group overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)] cursor-pointer"
      >
        {/* Image Container */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          <img
            src={work.images?.[0] || work.image || "/placeholder.svg"}
            alt={work.title}
            className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
          />
          
          {work.images && work.images.length > 1 && (
            <div className="absolute bottom-2 right-2 z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
              +{work.images.length - 1}
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
              onClick={() => setShowDetailsModal(true)}
            >
              View Details
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {onUnsave && (
            <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  onUnsave()
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 items-end pointer-events-none">
            {/* NFT 状态徽章 */}
            {nftStatus && (
              <NFTStatusBadge status={nftStatus} />
            )}
            
            {work.isRemix && (
              <Badge
                variant="secondary"
                className="bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-lg"
              >
                <GitFork className="w-3 h-3 mr-1 text-primary" /> Remix
              </Badge>
            )}
            {!canBeRemixed && (
              <Badge variant="destructive" className="bg-red-500/80 backdrop-blur-md text-white border-none shadow-lg">
                <Lock className="w-3 h-3 mr-1" /> No Remix
              </Badge>
            )}
            {canBeRemixed && status === "pending" && (
              <Badge className="bg-yellow-500/80 backdrop-blur-md text-white border-none">Under Review</Badge>
            )}
            {canBeRemixed && status === "approved" && (
              <Badge className="bg-green-500/80 backdrop-blur-md text-white border-none">Approved & Paid</Badge>
            )}
            {canBeRemixed && status === "rejected" && (
              <Badge className="bg-red-500/80 backdrop-blur-md text-white border-none">Rejected: Funds</Badge>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-4 relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {work.title}
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50" />
                {work.author}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {Array.isArray(work?.tags) &&
              work.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary/70 font-mono"
                >
                  #{tag}
                </span>
              ))}
          </div>

          {showSavedDate && work.savedAt && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
              <Clock className="w-3 h-3" />
              Saved: {work.savedAt}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"} px-2 h-8 transition-colors`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-1.5 ${liked ? "fill-current" : ""}`} />
                <span className="font-mono text-xs">{likeCount}</span>
              </Button>
              {work.allowRemix && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary px-2 h-8 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetailsModal(true)
                  }}
                >
                  <GitFork className="w-4 h-4 mr-1.5" />
                  <span className="font-mono text-xs">{work.remixCount || 0}</span>
                </Button>
              )}
              {allowTip && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-yellow-500 px-2 h-8 transition-colors"
                  onClick={() => setShowTipModal(true)}
                >
                  <Coins className="w-4 h-4 mr-1.5" />
                  <span className="font-mono text-xs">Tip</span>
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {isSquareView ? (
                /* 广场页面 - 只显示图标按钮 */
                <div className="flex gap-1">
                  {/* 二创授权按钮 - 只显示图标 */}
                  {canBeRemixed && onRemix && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemix()
                      }}
                      title="Request Remix"
                    >
                      <GitFork className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {/* AI审核按钮 - 只显示图标 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowContentModerationModal(true)
                    }}
                    title="AI Content Review"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  
                  {/* 收藏按钮 - 只显示图标 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCollectModal(true)
                    }}
                    title="Collect Work"
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              ) : onUnsave ? (
                <>
                  {/* Collections View - 显示授权状态和NFT操作 */}
                  <div className="flex gap-2">
                    {/* 授权相关按钮 */}
                    {(status === "none" || !status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canBeRemixed}
                        className="h-8 bg-transparent border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onRemix}
                      >
                        {canBeRemixed ? (
                          <>
                            <GitFork className="w-3.5 h-3.5 mr-1.5" />
                            Remix
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            No Remix
                          </>
                        )}
                      </Button>
                    )}
                    {status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="h-8 bg-transparent border-primary/30 text-muted-foreground opacity-70"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Reviewing
                      </Button>
                    )}
                    {status === "approved" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white border-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onRemix) onRemix()
                        }}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Work
                      </Button>
                    )}
                    {status === "rejected" && (
                      <Button size="sm" variant="destructive" className="h-8" onClick={onRemix}>
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                        Retry
                      </Button>
                    )}

                    
                    {/* Mint to Blockchain Button - for database-only works */}
                    {(!work.is_on_chain && work.upload_status !== 'minted' && work.upload_status !== 'nft_minted') && (
                      <MintToBlockchainButton 
                        work={work}
                        onMintSuccess={(result) => {
                          console.log('Mint success:', result)
                          // Optionally refresh the work data or update UI
                        }}
                      />
                    )}
                    
                    {/* AI审核按钮 - 始终显示，让用户可以审核任何作品 */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-orange-500 text-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowContentModerationModal(true)
                      }}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      AI Review
                    </Button>

                    {/* 新的NFT功能按钮 - 根据用户行为链条 */}
                    {work.is_on_chain && work.upload_status === 'minted' && (
                      <>
                        {/* 铸造NFT按钮 - 当作品已上链但未铸造NFT时显示，且仅创作者可见 */}
                        {(!nftStatus?.isNFT && work.creator_address?.toLowerCase() === address?.toLowerCase()) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowNewMintModal(true)
                            }}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Mint NFT
                          </Button>
                        )}
                        
                        {/* 出售按钮 - 当NFT已铸造且用户拥有时显示 */}
                        {nftStatus?.isNFT && nftStatus?.isOwned && !nftStatus?.isListed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-green-500 text-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowSellModal(true)
                            }}
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                            Sell
                          </Button>
                        )}
                        
                        {/* 已上架显示 */}
                        {nftStatus?.isListed && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="h-8 opacity-70"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                            Listed ({nftStatus.price} ETH)
                          </Button>
                        )}
                      </>
                    )}
                    
                    {/* 原有的NFT 操作按钮 */}
                    {nftStatus && (
                      <NFTActionButtons
                        isNFT={nftStatus.isNFT}
                        isListed={nftStatus.isListed}
                        isOwned={nftStatus.isOwned}
                        canMintNFT={!nftStatus.isNFT && onMintNFT !== undefined}
                        canBuyNFT={nftStatus.isListed && !nftStatus.isOwned && onBuyNFT !== undefined}
                        canListNFT={nftStatus.isOwned && !nftStatus.isListed && onListNFT !== undefined}
                        price={nftStatus.price}
                        onMintNFT={() => setShowMintNFTModal(true)}
                        onBuyNFT={() => setShowBuyNFTModal(true)}
                        onListNFT={() => setShowListNFTModal(true)}
                      />
                    )}
                  </div>
                </>
              ) : (
                /* Profile Tab Actions */
                <>
                  <div className="flex gap-2">
                    {/* 授权按钮 */}
                    {isRemixable && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canBeRemixed}
                        className="h-8 bg-transparent border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onRemix}
                      >
                        {canBeRemixed ? (
                          <>
                            <GitFork className="w-3.5 h-3.5 mr-1.5" />
                            Remix
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Locked
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* AI审核按钮 - 在Profile页面也显示 */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-orange-500 text-orange-600 hover:bg-orange-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowContentModerationModal(true)
                      }}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      AI Review
                    </Button>
                    
                    {/* 收藏按钮 */}
                    {!isRemixable && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                        onClick={() => setShowCollectModal(true)}
                      >
                        <Bookmark className="w-3.5 h-3.5 mr-1.5 fill-current" />
                        Collect
                      </Button>
                    )}
                    
                    {/* Mint to Blockchain Button - for database-only works */}
                    {(!work.is_on_chain && work.upload_status !== 'minted' && work.upload_status !== 'nft_minted') && (
                      <MintToBlockchainButton 
                        work={work}
                        onMintSuccess={(result) => {
                          console.log('Mint success:', result)
                          // Optionally refresh the work data or update UI
                        }}
                      />
                    )}
                    
                    {/* NFT 操作按钮 */}
                    {nftStatus && (
                      <NFTActionButtons
                        isNFT={nftStatus.isNFT}
                        isListed={nftStatus.isListed}
                        isOwned={nftStatus.isOwned}
                        canMintNFT={!nftStatus.isNFT && onMintNFT !== undefined}
                        canBuyNFT={nftStatus.isListed && !nftStatus.isOwned && onBuyNFT !== undefined}
                        canListNFT={nftStatus.isOwned && !nftStatus.isListed && onListNFT !== undefined}
                        price={nftStatus.price}
                        onMintNFT={() => setShowMintNFTModal(true)}
                        onBuyNFT={() => setShowBuyNFTModal(true)}
                        onListNFT={() => setShowListNFTModal(true)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <CollectModal
        open={showCollectModal}
        onOpenChange={setShowCollectModal}
        workTitle={work.title}
        folders={folders}
        onCreateFolder={onCreateFolder}
        onSave={(folder) => {
          if (onCollect) onCollect(folder)
          setShowCollectModal(false)
        }}
      />
      <TipModal open={showTipModal} onOpenChange={setShowTipModal} work={work} />
      <WorkDetailDialog
        work={work}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        nftStatus={nftStatus}
        onMintNFT={() => setShowMintNFTModal(true)}
        onBuyNFT={() => setShowBuyNFTModal(true)}
        onListNFT={() => setShowListNFTModal(true)}
        onRemix={onRemix}
        canBeRemixed={canBeRemixed}
      />

      {/* Quick Upload Modal for "Approved" state */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle>Upload Remix for "{work.title}"</DialogTitle>
            <DialogDescription>Your proposal was approved! You can now upload your work.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This would open the full Upload/Create view with this work pre-selected as the parent.
            </p>
            <Button onClick={() => setShowUploadModal(false)} className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFT 相关模态框 */}
      {nftStatus && (
        <>
          <MintNFTModal
            open={showMintNFTModal}
            onOpenChange={setShowMintNFTModal}
            work={work}
            onMint={async (tokenURI: string) => {
              if (onMintNFT) {
                await onMintNFT()
              }
            }}
          />
          
          <BuyNFTModal
            open={showBuyNFTModal}
            onOpenChange={setShowBuyNFTModal}
            work={work}
            price={nftStatus.price || "0"}
            onBuy={async () => {
              if (onBuyNFT) {
                await onBuyNFT()
              }
            }}
          />
          
          <ListNFTModal
            open={showListNFTModal}
            onOpenChange={setShowListNFTModal}
            work={work}
            onList={async (price: string) => {
              if (onListNFT) {
                await onListNFT()
              }
            }}
          />
        </>
      )}

      {/* 新的NFT功能模态框 */}
      <NewMintModal
        open={showNewMintModal}
        onOpenChange={setShowNewMintModal}
        work={work}
        onMint={async (nftData) => {
          console.log('🎨 Minting NFT with data:', nftData)
          
          try {
            // 导入NFT合约服务
            const { CreationRightsNFTService } = await import('@/lib/contracts/services/creationRightsNFT.service')
            const { ethers } = await import('ethers')
            
            // 获取provider和signer
            if (typeof window !== 'undefined' && window.ethereum) {
              const provider = new ethers.BrowserProvider(window.ethereum)
              const signer = await provider.getSigner()
              
              // 创建NFT服务实例
              const nftService = new CreationRightsNFTService(provider, signer)
              
              // 铸造NFT
              const tokenId = await nftService.mintWorkNFT(work.id || work.work_id)
              
              console.log('✅ NFT minted successfully! Token ID:', tokenId)
              
              // 更新数据库中的NFT状态
              try {
                const response = await fetch('/api/works/sync-nft-status', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    workId: work.id || work.work_id,
                    tokenId: tokenId,
                    isMinted: true,
                    ownerAddress: await signer.getAddress(),
                  }),
                })
                
                if (response.ok) {
                  console.log('✅ NFT status updated in database')
                }
              } catch (dbError) {
                console.error('⚠️ Failed to update NFT status in database:', dbError)
              }
              
            } else {
              throw new Error('Please connect your wallet to mint NFT')
            }
          } catch (error) {
            console.error('❌ NFT minting failed:', error)
            throw error
          }
        }}
      />
      
      <SellNFTModal
        open={showSellModal}
        onOpenChange={setShowSellModal}
        work={work}
        onList={async (listingData) => {
          console.log('🛒 Listing NFT for sale:', listingData)
          // TODO: 实现实际的NFT上架逻辑
          // 暂时模拟成功
          await new Promise(resolve => setTimeout(resolve, 2000))
          console.log('✅ NFT listed successfully (mock)')
        }}
      />

      {/* 内容审核模态框 */}
      <ContentModerationModal
        open={showContentModerationModal}
        onOpenChange={setShowContentModerationModal}
        work={work}
        onModerationComplete={(result) => {
          console.log('🛡️ Content moderation completed:', result)
          // TODO: 根据审核结果更新作品状态
        }}
      />
    </>
  )
}

function TipModal({ open, onOpenChange, work }: any) {
  const [amount, setAmount] = useState("0.01")
  const [customAmount, setCustomAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleTip = async () => {
    const finalAmount = customAmount || amount
    
    if (!work?.id) {
      setErrorMessage("Work ID not found")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMessage("")

    try {
      console.log(`Sending tip of ${finalAmount} ETH to work ${work.id}`)
      console.log('Work details:', work)
      
      // 调用合约处理支付
      const txHash = await processPayment(BigInt(work.id), finalAmount)
      
      console.log("Tip sent successfully! Transaction hash:", txHash)
      console.log("The creator's balance should be updated. They can refresh in Profile tab.")
      setStatus("success")
      
      setTimeout(() => {
        onOpenChange(false)
        setStatus("idle")
        setCustomAmount("")
        setAmount("0.01")
        // 提示用户刷新余额
        alert("Tip sent successfully! The creator can refresh their balance in the Profile tab to see the update.")
      }, 1500)
      
    } catch (error) {
      console.error("Tip failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to send tip")
      setStatus("error")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle>Tip Artist</DialogTitle>
          <DialogDescription>Send a tip to the creator of "{work?.title}".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {status === "success" ? (
            <div className="text-center text-green-500 font-bold py-4">Tip sent successfully!</div>
          ) : status === "error" ? (
            <div className="space-y-2 text-center">
              <div className="text-red-500 font-bold">Tip Failed</div>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Select Amount (ETH)</Label>
              <RadioGroup
                value={customAmount ? "custom" : amount}
                onValueChange={(v) => {
                  if (v !== "custom") {
                    setAmount(v)
                    setCustomAmount("")
                  }
                }}
                className="grid grid-cols-3 gap-2"
              >
                {["0.01", "0.05", "0.1"].map((val) => (
                  <div key={val}>
                    <RadioGroupItem value={val} id={`tip-${val}`} className="peer sr-only" />
                    <Label
                      htmlFor={`tip-${val}`}
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-xs font-mono"
                    >
                      {val}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Or enter custom amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.00"
                    className="pl-8"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Ξ</span>
                </div>
              </div>
            </div>
          )}
        </div>
        {status === "error" ? (
          <Button onClick={() => setStatus("idle")} className="w-full">
            Try Again
          </Button>
        ) : (
          status !== "success" && (
            <DialogFooter>
              <Button onClick={handleTip} className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : `Send Tip ${customAmount || amount} ETH`}
              </Button>
            </DialogFooter>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

function CollectModal({ open, onOpenChange, workTitle, folders = [], onCreateFolder, onSave }: any) {
  const [folderName, setFolderName] = useState("")
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddFolder = () => {
    if (folderName.trim()) {
      if (onCreateFolder) onCreateFolder(folderName.trim())
      setSelectedFolder(folderName.trim())
      setFolderName("")
      setShowNewFolder(false)
    }
  }

  const handleSave = () => {
    if (!selectedFolder) return
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      if (onSave) onSave(selectedFolder)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle>Collect "{workTitle}"</DialogTitle>
          <DialogDescription>Save this work to your folders.</DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
              <Bookmark className="w-6 h-6 fill-current" />
            </div>
            <h3 className="font-bold text-lg">Added successfully</h3>
            <p className="text-muted-foreground text-sm">You can view this in your Saved tab.</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Folder</Label>
              <div className="grid grid-cols-2 gap-2">
                {folders.map((f: string) => (
                  <Button
                    key={f}
                    variant={selectedFolder === f ? "default" : "outline"}
                    className={cn(
                      "justify-start text-xs h-9",
                      selectedFolder === f
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent border-border/50 hover:border-primary/50 hover:bg-primary/5",
                    )}
                    onClick={() => setSelectedFolder(f)}
                  >
                    <Folder className="w-3 h-3 mr-2" />
                    {f}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="justify-start text-xs h-9 bg-transparent border-dashed border-border/50 hover:border-primary/50"
                  onClick={() => setShowNewFolder(true)}
                >
                  + New Folder
                </Button>
              </div>
            </div>
            {showNewFolder && (
              <div className="space-y-2 p-3 bg-muted/20 rounded-md border border-border/50 animate-in fade-in slide-in-from-top-2">
                <Label className="text-xs">New Folder Name</Label>
                <div className="flex gap-2">
                  <input
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="e.g. My Project"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAddFolder}>
                    Add
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Add Note</Label>
              <Textarea
                placeholder="I want to try recreating this pattern in wood..."
                className="text-xs bg-muted/50"
              />
            </div>
          </div>
        )}

        {!showSuccess && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={!selectedFolder}>
              Save to Collection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function WorkDetailDialog({ 
  work, 
  open, 
  onOpenChange,
  nftStatus,
  onMintNFT,
  onBuyNFT,
  onListNFT,
  onRemix,
  canBeRemixed = true
}: {
  work: any
  open: boolean
  onOpenChange: (open: boolean) => void
  nftStatus?: NFTStatus
  onMintNFT?: () => void
  onBuyNFT?: () => void
  onListNFT?: () => void
  onRemix?: () => void
  canBeRemixed?: boolean
}) {
  const { address } = useAccount()
  // Defensive check at the top of the component
  if (!work) return null

  const [selectedRemixer, setSelectedRemixer] = useState(0)
  const [derivatives, setDerivatives] = useState<any[]>([])
  const [loadingDerivatives, setLoadingDerivatives] = useState(false)
  
  // 点赞相关状态
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(work.likes || 0)
  
  // 模态框状态
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [showContentModerationModal, setShowContentModerationModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // 复制ID到剪贴板
  const copyToClipboard = (text: string | number) => {
    navigator.clipboard.writeText(String(text))
    // TODO: 添加toast提示
    console.log('Copied to clipboard:', text)
  }

  // 点赞处理函数
  const handleLike = async () => {
    if (!address) {
      console.error('User not connected')
      return
    }
    
    try {
      const newLikedState = await toggleLike(work.id, address)
      setLiked(newLikedState)
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  // 加载衍生作品
  const [genealogy, setGenealogy] = useState<{
    root: any | null;
    continuations: any[];
    derivatives: any[];
    totalDerivatives: number;
  }>({
    root: null,
    continuations: [],
    derivatives: [],
    totalDerivatives: 0
  })

  useEffect(() => {
    if (open && work?.work_id && work?.allowRemix) {
      loadGenealogy()
    }
  }, [open, work?.work_id])

  const loadGenealogy = async () => {
    if (!work?.work_id) return
    
    setLoadingDerivatives(true)
    try {
      const { getWorkGenealogy } = await import('@/lib/supabase/services/work.service')
      const genealogyData = await getWorkGenealogy(work.work_id)
      setGenealogy(genealogyData)
      // 保持向后兼容
      setDerivatives([...genealogyData.continuations, ...genealogyData.derivatives])
    } catch (error) {
      console.error('Failed to load genealogy:', error)
    } finally {
      setLoadingDerivatives(false)
    }
  }

  // Ensure safe access to arrays
  const safeTags = Array.isArray(work.tags) ? work.tags : []
  const safeImages = Array.isArray(work.images) ? work.images : []
  
  // Build genealogy display data
  const genealogyDisplay = work?.allowRemix
    ? {
        root: {
          id: genealogy.root?.work_id || work.work_id || work.id,
          title: genealogy.root?.title || work.title || "Untitled",
          author: genealogy.root?.creator_address || work.creator_address || work.author || "Unknown",
          date: genealogy.root?.created_at || work.createdAt || new Date().toLocaleDateString(),
          type: "Original",
          image: genealogy.root?.image_url || work.images?.[0] || work.image || "/placeholder.svg",
        },
        continuations: genealogy.continuations.map((cont: any) => ({
          id: cont.work_id,
          title: cont.title,
          author: cont.creator_address?.slice(0, 6) + '...' + cont.creator_address?.slice(-4),
          date: new Date(cont.created_at).toLocaleDateString(),
          type: "Canonical Extension",
          image: cont.image_url || "/placeholder.svg",
        })),
        derivatives: genealogy.derivatives.map((deriv: any) => ({
          id: deriv.work_id,
          title: deriv.title,
          author: deriv.creator_address?.slice(0, 6) + '...' + deriv.creator_address?.slice(-4),
          date: new Date(deriv.created_at).toLocaleDateString(),
          type: "Authorized Derivative",
          image: deriv.image_url || "/placeholder.svg",
        }))
      }
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] m-0 rounded-none' : 'max-w-[60vw] h-[80vh]'} flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-primary/20 overflow-hidden transition-all duration-300 [&>button]:hidden`}>
        <DialogHeader className="sr-only">
          <DialogTitle>Work Details: {work?.title || 'Untitled'}</DialogTitle>
        </DialogHeader>
        
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{work?.title || 'Untitled'}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ID:</span>
              <button
                onClick={() => copyToClipboard(work?.work_id || work?.id)}
                className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-muted/80 rounded transition-colors"
                title="Click to copy work ID"
              >
                <span className="font-mono">{work?.work_id || work?.id}</span>
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
          {/* Left Column: Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border border-border/50 relative group">
              <img 
                src={(work.images && work.images.length > 0 ? work.images[0] : work.image) || "/placeholder.svg"} 
                className="object-cover w-full h-full" 
                alt={work.title} 
              />
            </div>
            {work.images && work.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {work.images.slice(1, 5).map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square rounded-md overflow-hidden border border-border/30 cursor-pointer hover:border-primary/50 transition-colors">
                    <img src={img} className="object-cover w-full h-full" alt={`${work.title} ${idx + 2}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{work.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-600" />
                <span className="font-mono text-sm">{work.author}</span>
              </div>
            </div>

            {/* 作品基本信息 */}
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>{work.story}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-primary/70 mb-1">Material</span>
                  {work.material || "N/A"}
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-primary/70 mb-1">Keywords</span>
                  <div className="flex flex-wrap gap-1">
                    {safeTags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 授权类型信息 */}
            <div className="pt-4 border-t border-border/50">
              <h3 className="font-bold text-lg mb-3">License & Permissions</h3>
              <div className="space-y-3">
                {work.allowRemix ? (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <GitFork className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">Remixing Allowed</span>
                    </div>
                    {/* TODO: 显示具体的许可证信息 */}
                    <div className="text-xs text-muted-foreground">
                      License fee: {work.license_fee || '0'} ETH
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-500">All Rights Reserved</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      This work cannot be used for derivatives
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 用户行为按钮 */}
            <div className="pt-4 border-t border-border/50">
              <h3 className="font-bold text-lg mb-3">User Actions</h3>
              <div className="flex flex-wrap gap-3">
                {/* 点赞按钮 */}
                <Button
                  variant="ghost"
                  className={`${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"} transition-colors`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`} />
                  Like ({likeCount})
                </Button>

                {/* 收藏按钮 */}
                <Button
                  variant="outline"
                  className="bg-transparent border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
                  onClick={() => setShowCollectModal(true)}
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Collect
                </Button>

                {/* Remix按钮 */}
                {canBeRemixed && onRemix && (
                  <Button
                    variant="outline"
                    className="bg-transparent border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary"
                    onClick={onRemix}
                  >
                    <GitFork className="w-4 h-4 mr-2" />
                    Request Remix
                  </Button>
                )}

                {/* Tip按钮 */}
                <Button
                  variant="outline"
                  className="bg-transparent border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-50 text-yellow-600"
                  onClick={() => setShowTipModal(true)}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Tip Creator
                </Button>

                {/* 举报按钮 - 不能举报自己的作品 */}
                {work.creator_address?.toLowerCase() !== address?.toLowerCase() && (
                  <Button
                    variant="outline"
                    className="bg-transparent border-red-500/30 hover:border-red-500/60 hover:bg-red-50 text-red-600"
                    onClick={() => setShowReportModal(true)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                )}
              </div>
            </div>

            {/* 作者行为按钮 - 只有作者才能看到 */}
            {work.creator_address?.toLowerCase() === address?.toLowerCase() && (
              <div className="pt-4 border-t border-border/50">
                <h3 className="font-bold text-lg mb-3">Creator Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {/* AI内容审核按钮 */}
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => setShowContentModerationModal(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    AI Content Review
                  </Button>

                  {/* NFT相关按钮 */}
                  {nftStatus && (
                    <>
                      {!nftStatus.isNFT && onMintNFT && (
                        <Button
                          variant="default"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={onMintNFT}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Mint as NFT
                        </Button>
                      )}
                      
                      {nftStatus.isOwned && !nftStatus.isListed && onListNFT && (
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={onListNFT}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          List for Sale
                        </Button>
                      )}
                    </>
                  )}

                  {/* Mint to Blockchain按钮 */}
                  {(!work.is_on_chain && work.upload_status !== 'minted' && work.upload_status !== 'nft_minted') && (
                    <MintToBlockchainButton 
                      work={work}
                      onMintSuccess={(result) => {
                        console.log('Mint success:', result)
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* NFT状态显示 - 非作者也能看到 */}
            {nftStatus && work.creator_address?.toLowerCase() !== address?.toLowerCase() && (
              <div className="pt-4 border-t border-border/50">
                <h3 className="font-bold text-lg mb-3">NFT Status</h3>
                <div className="flex flex-wrap gap-3">
                  <NFTStatusBadge status={nftStatus} />
                  
                  {nftStatus.isListed && !nftStatus.isOwned && onBuyNFT && (
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={onBuyNFT}
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Buy NFT ({nftStatus.price} ETH)
                    </Button>
                  )}
                  
                  {nftStatus.isNFT && !nftStatus.isListed && !nftStatus.isOwned && (
                    <Button
                      variant="outline"
                      disabled
                      className="opacity-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      NFT (Not for Sale)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Community Voting Section */}
            <WorkVoting 
              work={work}
              onVote={(votingId, optionId) => {
                console.log('Vote submitted:', { votingId, optionId })
              }}
            />

            {/* Genealogy Section */}
            <div className="pt-6 border-t border-border/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <GitFork className="w-4 h-4" /> Creation Genealogy
              </h3>

              {!work.allowRemix ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Lock className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium text-red-500 text-center">Remixing disabled by creator</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This work cannot be used as a source for new creations.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {loadingDerivatives ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      Loading genealogy...
                    </div>
                  ) : (
                    <>
                      {/* Root Work */}
                      {genealogyDisplay && (
                        <div className="space-y-4">
                          <div className="relative pl-4 border-l-2 border-primary/20">
                            <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                            <div className="flex items-start gap-3 bg-primary/5 p-3 rounded-lg border border-primary/20">
                              <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                                <img
                                  src={genealogyDisplay.root.image || "/placeholder.svg"}
                                  className="w-full h-full object-cover"
                                  alt={genealogyDisplay.root.title}
                                />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-primary mb-0.5">{genealogyDisplay.root.type}</p>
                                <p className="font-medium text-sm">{genealogyDisplay.root.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  by {genealogyDisplay.root.author} • {genealogyDisplay.root.date}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Official Continuations */}
                          {genealogyDisplay.continuations.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-purple-600 flex items-center gap-2">
                                🟣 Official Continuations (by original creator)
                              </h4>
                              <div className="relative pl-4 border-l-2 border-purple-200 space-y-3">
                                {genealogyDisplay.continuations.map((node: any, i: number) => (
                                  <div key={node.id} className="relative">
                                    <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-background" />
                                    <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                                        <img
                                          src={node.image || "/placeholder.svg"}
                                          className="w-full h-full object-cover"
                                          alt={node.title}
                                        />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold uppercase text-purple-600 mb-0.5">{node.type}</p>
                                        <p className="font-medium text-sm">{node.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          by {node.author} • {node.date}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Community Derivatives */}
                          {genealogyDisplay.derivatives.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                                🔵 Community Derivatives
                              </h4>
                              <div className="relative pl-4 border-l-2 border-blue-200 space-y-3">
                                {genealogyDisplay.derivatives.map((node: any, i: number) => (
                                  <div key={node.id} className="relative">
                                    <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-background" />
                                    <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                      <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0">
                                        <img
                                          src={node.image || "/placeholder.svg"}
                                          className="w-full h-full object-cover"
                                          alt={node.title}
                                        />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold uppercase text-blue-600 mb-0.5">{node.type}</p>
                                        <p className="font-medium text-sm">{node.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                          by {node.author} • {node.date}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Statistics */}
                          <div className="pt-4 border-t border-border/30">
                            <h4 className="text-sm font-bold mb-3">Creation Statistics</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-sm">
                                  <span className="text-purple-700 font-medium">Official continuations:</span>
                                  <span className="ml-2 font-bold text-purple-600">{genealogy.continuations.length}</span>
                                </div>
                              </div>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm">
                                  <span className="text-blue-700 font-medium">Community derivatives:</span>
                                  <span className="ml-2 font-bold text-blue-600">{genealogy.derivatives.length}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <div className="text-sm">
                                <span className="text-foreground font-medium">Total derivatives:</span>
                                <span className="ml-2 font-bold text-primary">{genealogy.totalDerivatives}</span>
                              </div>
                            </div>
                          </div>

                          {/* Recent Derivatives Preview */}
                          {(genealogy.continuations.length > 0 || genealogy.derivatives.length > 0) && (
                            <div className="mt-4">
                              <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Recent Creations</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[...genealogy.continuations, ...genealogy.derivatives].slice(0, 4).map((item: any) => (
                                  <div key={item.work_id} className="p-2 bg-muted/30 rounded-lg border border-border/50">
                                    <img
                                      src={item.image_url || "/placeholder.svg"}
                                      className="w-full h-20 object-cover rounded mb-2"
                                      alt={item.title}
                                    />
                                    <p className="text-xs font-medium truncate">{item.title}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      by {item.creator_address?.slice(0, 6)}...{item.creator_address?.slice(-4)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* 模态框组件 */}
      <CollectModal
        open={showCollectModal}
        onOpenChange={setShowCollectModal}
        workTitle={work.title}
        folders={[]} // TODO: 传入实际的folders
        onCreateFolder={() => {}} // TODO: 传入实际的函数
        onSave={(folder) => {
          console.log('Collect work to folder:', folder)
          setShowCollectModal(false)
        }}
      />
      
      <TipModal 
        open={showTipModal} 
        onOpenChange={setShowTipModal} 
        work={work} 
      />
      
      <ContentModerationModal
        open={showContentModerationModal}
        onOpenChange={setShowContentModerationModal}
        work={work}
        onModerationComplete={(result) => {
          console.log('Content moderation completed:', result)
        }}
      />
      
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        work={work}
        onReportComplete={(result) => {
          console.log('Report completed:', result)
        }}
      />
    </Dialog>
  )
}
