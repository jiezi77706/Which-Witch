"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, Filter, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { useMarketplaceNFTs } from "../../lib/hooks/useMarketplaceNFTs"
import { useUser } from "@/lib/hooks/useUser"

export function MarketplaceView() {
  const [search, setSearch] = useState("")
  const [priceFilter, setPriceFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const { nfts, loading, error, buyNFT } = useMarketplaceNFTs()
  const { user } = useUser()

  const COMMON_FILTERS = ["Digital", "Wood", "Clay", "Glass", "Metal", "Cyberpunk", "Minimalist", "Nature", "Abstract"]
  const PRICE_FILTERS = [
    { key: "all", label: "All Prices" },
    { key: "low", label: "< 0.1 ETH" },
    { key: "medium", label: "0.1 - 1 ETH" },
    { key: "high", label: "> 1 ETH" }
  ]

  const handleFilterClick = (tag: string) => {
    setSearch(search === tag ? "" : tag)
  }

  const handleBuyNFT = async (listingId: number, price: string) => {
    try {
      await buyNFT(listingId, price)
      console.log('✅ NFT purchased successfully')
    } catch (error) {
      console.error('❌ Failed to purchase NFT:', error)
    }
  }

  // 转换NFT数据为MarketplaceCard需要的格式
  const transformedNFTs = nfts.map((nft) => ({
    id: nft.work_id,
    title: nft.title || `NFT #${nft.token_id}`,
    author: nft.creator_address?.slice(0, 6) + '...' + nft.creator_address?.slice(-4) || 'Unknown',
    image: nft.image_url,
    tags: nft.tags || [],
    material: Array.isArray(nft.material) ? nft.material.join(', ') : (nft.material || ''),
    likes: nft.like_count || 0,
    remixCount: nft.remix_count || 0,
    allowRemix: nft.allow_remix || false,
    isRemix: nft.is_remix || false,
    story: nft.story || nft.description || '',
    createdAt: nft.listed_at,
    // NFT 特有属性
    nftId: nft.listing_id,
    tokenId: nft.token_id.toString(),
    price: nft.price,
    currency: nft.currency || 'ETH',
    seller: nft.seller_address,
    isListed: true, // marketplace中的都是已上架的
    listingDate: nft.listed_at,
    listing_id: nft.listing_id,
  }))

  // 过滤逻辑
  const filteredNFTs = transformedNFTs.filter((nft) => {
    // 文本搜索
    const matchesSearch = 
      nft.title.toLowerCase().includes(search.toLowerCase()) ||
      nft.author.toLowerCase().includes(search.toLowerCase()) ||
      nft.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())) ||
      (Array.isArray(nft.material) ? nft.material.join(' ') : (nft.material || '')).toLowerCase().includes(search.toLowerCase())

    // 价格过滤
    const price = parseFloat(nft.price || "0")
    const matchesPrice = 
      priceFilter === "all" ||
      (priceFilter === "low" && price < 0.1) ||
      (priceFilter === "medium" && price >= 0.1 && price <= 1) ||
      (priceFilter === "high" && price > 1)

    return matchesSearch && matchesPrice && nft.isListed
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="sticky top-[72px] z-40 bg-background/80 backdrop-blur-md py-4 -mx-6 px-6 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              Marketplace
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Discover and collect unique NFT artworks</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search NFTs, artists, or collections..."
                className="pl-9 bg-muted/30 border-border/50 focus:border-primary/50 focus:bg-background transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex flex-col gap-4 pt-4">
          {/* 价格过滤器 */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setPriceFilter(filter.key as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  priceFilter === filter.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* 标签过滤器 */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {COMMON_FILTERS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleFilterClick(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  search === tag
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-background border-border hover:border-secondary/50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center gap-4 pt-3 text-sm text-muted-foreground">
          <span>{filteredNFTs.length} NFTs available</span>
          <span>•</span>
          <span>Floor: {filteredNFTs.length > 0 ? Math.min(...filteredNFTs.map(n => parseFloat(n.price || "0"))).toFixed(3) : "0.000"} ETH</span>
          <span>•</span>
          <span>Volume: {filteredNFTs.reduce((sum: number, n) => sum + parseFloat(n.price || "0"), 0).toFixed(2)} ETH</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading marketplace...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500">Failed to load marketplace. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No NFTs found</p>
          <p className="text-sm">
            {search ? 'Try adjusting your search or filters.' : 'Be the first to list an NFT for sale!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNFTs.map((nft) => (
            <MarketplaceCard
              key={`${nft.nftId}-${nft.tokenId}`}
              nft={nft}
              onBuy={() => handleBuyNFT(nft.listing_id, nft.price)}
              currentUser={user?.wallet_address}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 专门的市场卡片组件
function MarketplaceCard({ 
  nft, 
  onBuy, 
  currentUser 
}: { 
  nft: {
    id: number;
    title: string;
    author: string;
    image: string;
    tags: string[];
    material?: string;
    likes: number;
    remixCount: number;
    allowRemix: boolean;
    isRemix: boolean;
    story: string;
    createdAt: string;
    nftId: number;
    tokenId: string;
    price: string;
    currency: string;
    seller: string;
    isListed: boolean;
    listingDate: string;
  }
  onBuy: () => void
  currentUser?: string 
}) {
  const [showBuyModal, setShowBuyModal] = useState(false)
  const isOwner = currentUser?.toLowerCase() === nft.seller?.toLowerCase()

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      {/* 图片区域 */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={nft.image || "/placeholder.svg"}
          alt={nft.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* NFT 标识 */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground border-0">
            NFT #{nft.tokenId}
          </Badge>
        </div>

        {/* 价格标签 */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 text-foreground border border-border/50">
            {nft.price} {nft.currency}
          </Badge>
        </div>

        {/* 悬停时显示的操作按钮 */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {!isOwner ? (
            <Button 
              onClick={() => setShowBuyModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          ) : (
            <Badge variant="secondary">Your NFT</Badge>
          )}
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm truncate">{nft.title}</h3>
          <p className="text-xs text-muted-foreground">by {nft.author}</p>
        </div>

        {/* 标签 */}
        {nft.tags && nft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nft.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {nft.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{nft.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            Listed {new Date(nft.listingDate).toLocaleDateString()}
          </div>
          <div className="text-sm font-bold">
            {nft.price} {nft.currency}
          </div>
        </div>

        {/* 购买按钮 */}
        {!isOwner && (
          <Button 
            onClick={() => setShowBuyModal(true)}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy for {nft.price} {nft.currency}
          </Button>
        )}
      </div>

      {/* 购买确认弹窗 */}
      {showBuyModal && (
        <BuyConfirmModal
          nft={nft}
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onConfirm={() => {
            onBuy()
            setShowBuyModal(false)
          }}
        />
      )}
    </Card>
  )
}

// 购买确认弹窗
function BuyConfirmModal({
  nft,
  isOpen,
  onClose,
  onConfirm
}: {
  nft: {
    id: number;
    title: string;
    author: string;
    image: string;
    tokenId: string;
    price: string;
    currency: string;
  }
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            You are about to purchase this NFT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* NFT 预览 */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={nft.image} 
                alt={nft.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{nft.title}</h3>
              <p className="text-sm text-muted-foreground">by {nft.author}</p>
              <Badge className="mt-1">NFT #{nft.tokenId}</Badge>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Price</span>
              <span className="font-bold">{nft.price} {nft.currency}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm">Gas Fee</span>
              <span className="text-sm text-muted-foreground">~0.005 ETH</span>
            </div>
            <div className="border-t border-border mt-2 pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>{(parseFloat(nft.price) + 0.005).toFixed(3)} ETH</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This transaction will be processed on the blockchain and cannot be reversed.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}