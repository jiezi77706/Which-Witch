"use client"

import { Badge } from "@/components/ui/badge"
import { Coins, ShoppingCart, Lock, Sparkles } from "lucide-react"

export interface NFTStatus {
  isNFT: boolean
  isListed?: boolean
  price?: string
  isOwned?: boolean
}

export function NFTStatusBadge({ 
  status, 
  className = "" 
}: { 
  status: NFTStatus
  className?: string 
}) {
  if (!status.isNFT) {
    return (
      <Badge 
        variant="secondary" 
        className={`bg-gray-500/80 backdrop-blur-md text-white border-none shadow-lg ${className}`}
      >
        <Lock className="w-3 h-3 mr-1" /> 
        Non-NFT
      </Badge>
    )
  }

  if (status.isListed && status.price) {
    return (
      <Badge 
        variant="default" 
        className={`bg-green-500/80 backdrop-blur-md text-white border-none shadow-lg ${className}`}
      >
        <ShoppingCart className="w-3 h-3 mr-1" /> 
        {status.price} ETH
      </Badge>
    )
  }

  if (status.isOwned) {
    return (
      <Badge 
        variant="secondary" 
        className={`bg-blue-500/80 backdrop-blur-md text-white border-none shadow-lg ${className}`}
      >
        <Sparkles className="w-3 h-3 mr-1" /> 
        Owned
      </Badge>
    )
  }

  return (
    <Badge 
      variant="secondary" 
      className={`bg-purple-500/80 backdrop-blur-md text-white border-none shadow-lg ${className}`}
    >
      <Coins className="w-3 h-3 mr-1" /> 
      NFT
    </Badge>
  )
}