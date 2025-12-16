"use client"

import { Button } from "@/components/ui/button"
import { Coins, ShoppingCart, Upload, Tag, Wallet } from "lucide-react"

export interface NFTActionButtonsProps {
  isNFT: boolean
  isListed?: boolean
  isOwned?: boolean
  canMintNFT?: boolean
  canBuyNFT?: boolean
  canListNFT?: boolean
  price?: string
  onMintNFT?: () => void
  onBuyNFT?: () => void
  onListNFT?: () => void
  onViewNFT?: () => void
  className?: string
}

export function NFTActionButtons({
  isNFT,
  isListed,
  isOwned,
  canMintNFT,
  canBuyNFT,
  canListNFT,
  price,
  onMintNFT,
  onBuyNFT,
  onListNFT,
  onViewNFT,
  className = ""
}: NFTActionButtonsProps) {
  
  // 如果不是NFT且可以铸造
  if (!isNFT && canMintNFT) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={`h-8 bg-transparent border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5 text-purple-500 ${className}`}
        onClick={onMintNFT}
      >
        <Coins className="w-3.5 h-3.5 mr-1.5" />
        Mint NFT
      </Button>
    )
  }

  // 如果是NFT且在售
  if (isNFT && isListed && canBuyNFT && price) {
    return (
      <Button
        size="sm"
        variant="default"
        className={`h-8 bg-green-600 hover:bg-green-700 text-white border-none ${className}`}
        onClick={onBuyNFT}
      >
        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
        Buy {price} ETH
      </Button>
    )
  }

  // 如果拥有NFT且可以上架
  if (isNFT && isOwned && canListNFT) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={`h-8 bg-transparent border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 text-blue-500 ${className}`}
        onClick={onListNFT}
      >
        <Tag className="w-3.5 h-3.5 mr-1.5" />
        List for Sale
      </Button>
    )
  }

  // 如果是NFT但不在售且不拥有
  if (isNFT && !isListed && !isOwned) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className={`h-8 text-muted-foreground hover:text-primary ${className}`}
        onClick={onViewNFT}
      >
        <Wallet className="w-3.5 h-3.5 mr-1.5" />
        View NFT
      </Button>
    )
  }

  // 默认情况：不是NFT且不能铸造
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled
      className={`h-8 text-muted-foreground opacity-50 ${className}`}
    >
      <Upload className="w-3.5 h-3.5 mr-1.5" />
      No NFT
    </Button>
  )
}