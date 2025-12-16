import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  isWorkNFTMinted, 
  getWorkTokenId, 
  getNFTListing, 
  doesUserOwnNFT,
  formatPrice,
  mintWorkNFT,
  listNFT,
  buyNFT,
  cancelListing
} from '../services/nft.service'
import { NFTStatus } from '@/components/whichwitch/nft-status-badge'

export function useNFT(workId: number) {
  const { address } = useAccount()
  const [nftStatus, setNftStatus] = useState<NFTStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载NFT状态
  const loadNFTStatus = async () => {
    if (!workId) return

    try {
      setLoading(true)
      setError(null)

      const workIdBigInt = BigInt(workId)
      
      // 检查是否已铸造NFT
      const isNFT = await isWorkNFTMinted(workIdBigInt)
      
      if (!isNFT) {
        setNftStatus({ isNFT: false })
        return
      }

      // 获取NFT ID
      const tokenId = await getWorkTokenId(workIdBigInt)
      
      if (tokenId === BigInt(0)) {
        setNftStatus({ isNFT: false })
        return
      }

      // 检查是否拥有NFT
      const isOwned = address ? await doesUserOwnNFT(tokenId, address) : false
      
      // 获取listing信息
      const listing = await getNFTListing(tokenId)
      
      const status: NFTStatus = {
        isNFT: true,
        isListed: listing?.active || false,
        price: listing?.active ? formatPrice(listing.price) : undefined,
        isOwned
      }
      
      setNftStatus(status)
    } catch (err) {
      console.error('Failed to load NFT status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load NFT status')
      setNftStatus({ isNFT: false })
    } finally {
      setLoading(false)
    }
  }

  // 铸造NFT
  const handleMintNFT = async (tokenURI?: string) => {
    if (!workId) throw new Error('Work ID is required')
    
    const workIdBigInt = BigInt(workId)
    const uri = tokenURI || `https://whichwitch.app/api/nft/${workId}`
    
    const txHash = await mintWorkNFT(workIdBigInt, uri)
    
    // 重新加载状态
    await loadNFTStatus()
    
    return txHash
  }

  // 上架NFT
  const handleListNFT = async (price: string) => {
    if (!workId || !nftStatus?.isNFT) throw new Error('Invalid NFT')
    
    const workIdBigInt = BigInt(workId)
    const tokenId = await getWorkTokenId(workIdBigInt)
    
    if (tokenId === BigInt(0)) throw new Error('NFT not found')
    
    const txHash = await listNFT(tokenId, price)
    
    // 重新加载状态
    await loadNFTStatus()
    
    return txHash
  }

  // 购买NFT
  const handleBuyNFT = async () => {
    if (!workId || !nftStatus?.isNFT || !nftStatus.isListed || !nftStatus.price) {
      throw new Error('NFT is not available for purchase')
    }
    
    const workIdBigInt = BigInt(workId)
    const tokenId = await getWorkTokenId(workIdBigInt)
    
    if (tokenId === BigInt(0)) throw new Error('NFT not found')
    
    const txHash = await buyNFT(tokenId, nftStatus.price)
    
    // 重新加载状态
    await loadNFTStatus()
    
    return txHash
  }

  // 取消上架
  const handleCancelListing = async () => {
    if (!workId || !nftStatus?.isNFT) throw new Error('Invalid NFT')
    
    const workIdBigInt = BigInt(workId)
    const tokenId = await getWorkTokenId(workIdBigInt)
    
    if (tokenId === BigInt(0)) throw new Error('NFT not found')
    
    const txHash = await cancelListing(tokenId)
    
    // 重新加载状态
    await loadNFTStatus()
    
    return txHash
  }

  // 初始加载
  useEffect(() => {
    loadNFTStatus()
  }, [workId, address])

  return {
    nftStatus,
    loading,
    error,
    refetch: loadNFTStatus,
    mintNFT: handleMintNFT,
    listNFT: handleListNFT,
    buyNFT: handleBuyNFT,
    cancelListing: handleCancelListing
  }
}

// 批量获取多个作品的NFT状态
export function useMultipleNFTs(workIds: number[]) {
  const { address } = useAccount()
  const [nftStatuses, setNftStatuses] = useState<Record<number, NFTStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMultipleNFTStatuses = async () => {
    if (!workIds.length) return

    try {
      setLoading(true)
      setError(null)

      const statuses: Record<number, NFTStatus> = {}

      // 并行加载所有NFT状态
      await Promise.all(
        workIds.map(async (workId) => {
          try {
            const workIdBigInt = BigInt(workId)
            
            // 检查是否已铸造NFT
            const isNFT = await isWorkNFTMinted(workIdBigInt)
            
            if (!isNFT) {
              statuses[workId] = { isNFT: false }
              return
            }

            // 获取NFT ID
            const tokenId = await getWorkTokenId(workIdBigInt)
            
            if (tokenId === BigInt(0)) {
              statuses[workId] = { isNFT: false }
              return
            }

            // 检查是否拥有NFT
            const isOwned = address ? await doesUserOwnNFT(tokenId, address) : false
            
            // 获取listing信息
            const listing = await getNFTListing(tokenId)
            
            statuses[workId] = {
              isNFT: true,
              isListed: listing?.active || false,
              price: listing?.active ? formatPrice(listing.price) : undefined,
              isOwned
            }
          } catch (err) {
            console.error(`Failed to load NFT status for work ${workId}:`, err)
            statuses[workId] = { isNFT: false }
          }
        })
      )
      
      setNftStatuses(statuses)
    } catch (err) {
      console.error('Failed to load multiple NFT statuses:', err)
      setError(err instanceof Error ? err.message : 'Failed to load NFT statuses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMultipleNFTStatuses()
  }, [workIds.join(','), address])

  return {
    nftStatuses,
    loading,
    error,
    refetch: loadMultipleNFTStatuses
  }
}