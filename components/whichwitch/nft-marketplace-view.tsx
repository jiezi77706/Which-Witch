"use client"

import { useState, useEffect } from "react"
import { WorkCard } from "./work-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Loader2, ShoppingCart, Coins, TrendingUp } from "lucide-react"
import { useWorks } from "@/lib/hooks/useWorks"
import { useMultipleNFTs } from "@/lib/web3/hooks/useNFT"

export function NFTMarketplaceView() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "listed" | "owned">("all")
  const { works, loading, error } = useWorks()
  
  // 获取所有作品的NFT状态
  const workIds = works.map(work => work.work_id)
  const { nftStatuses, loading: nftLoading } = useMultipleNFTs(workIds)

  // 转换数据库作品格式
  const transformedWorks = works.map((work: any) => ({
    id: work.work_id,
    title: work.title,
    author: work.creator_address.slice(0, 6) + '...' + work.creator_address.slice(-4),
    image: work.image_url,
    tags: work.tags || [],
    material: Array.isArray(work.material) ? work.material.join(', ') : (work.material || ''),
    likes: work.like_count || 0,
    remixCount: work.remix_count || 0,
    allowRemix: work.allow_remix,
    isRemix: work.is_remix,
    story: work.story || work.description || '',
    createdAt: work.created_at,
  }))

  // 过滤NFT作品
  const nftWorks = transformedWorks.filter(work => {
    const nftStatus = nftStatuses[work.id]
    if (!nftStatus?.isNFT) return false

    // 根据过滤器筛选
    if (filter === "listed" && !nftStatus.isListed) return false
    if (filter === "owned" && !nftStatus.isOwned) return false

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        work.title.toLowerCase().includes(searchLower) ||
        work.author.toLowerCase().includes(searchLower) ||
        work.tags.some((t: string) => t.toLowerCase().includes(searchLower))
      )
    }

    return true
  })

  // 统计数据
  const stats = {
    totalNFTs: Object.values(nftStatuses).filter(status => status.isNFT).length,
    listedNFTs: Object.values(nftStatuses).filter(status => status.isNFT && status.isListed).length,
    ownedNFTs: Object.values(nftStatuses).filter(status => status.isNFT && status.isOwned).length,
  }

  const FILTER_OPTIONS = [
    { key: "all", label: "All NFTs", icon: Coins },
    { key: "listed", label: "For Sale", icon: ShoppingCart },
    { key: "owned", label: "My NFTs", icon: TrendingUp },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="sticky top-[72px] z-40 bg-background/80 backdrop-blur-md py-4 -mx-6 px-6 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              NFT Marketplace
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Trade work ownership NFTs with instant royalties</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search NFTs..."
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

        {/* 统计信息 */}
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 whitespace-nowrap">
            <Coins className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">{stats.totalNFTs} Total NFTs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 whitespace-nowrap">
            <ShoppingCart className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">{stats.listedNFTs} For Sale</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 whitespace-nowrap">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{stats.ownedNFTs} Owned</span>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-4 no-scrollbar">
          {FILTER_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as any)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  filter === option.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                <Icon className="w-3 h-3" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading || nftLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading NFTs...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500">Failed to load NFTs. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : nftWorks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No NFTs found</p>
          <p className="text-sm">
            {filter === "all" 
              ? "No works have been minted as NFTs yet." 
              : filter === "listed"
              ? "No NFTs are currently listed for sale."
              : "You don't own any NFTs yet."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {nftWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              allowTip={false}
              // NFT 相关 props
              nftStatus={nftStatuses[work.id]}
              onMintNFT={async () => {
                console.log('Mint NFT for work:', work.id)
              }}
              onBuyNFT={async () => {
                console.log('Buy NFT for work:', work.id)
              }}
              onListNFT={async () => {
                console.log('List NFT for work:', work.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}