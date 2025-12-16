import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core'
import { parseEther, formatEther } from 'viem'
import { config } from '../config'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'
import { NFT_MANAGER_ABI, NFT_MARKETPLACE_ABI } from '../contracts/abis'

/**
 * NFT 相关服务
 */

// 铸造 NFT
export async function mintWorkNFT(workId: bigint, tokenURI: string): Promise<string> {
  try {
    console.log('Minting NFT for work:', workId.toString(), 'with URI:', tokenURI)
    
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.nftManager,
      abi: NFT_MANAGER_ABI,
      functionName: 'mintWorkNFT',
      args: [workId, tokenURI],
    })

    console.log('Mint transaction sent:', hash)
    
    // 等待交易确认
    const receipt = await waitForTransactionReceipt(config, { hash })
    console.log('Mint transaction confirmed:', receipt)
    
    return hash
  } catch (error) {
    console.error('Failed to mint NFT:', error)
    throw error
  }
}

// 检查作品是否已铸造 NFT
export async function isWorkNFTMinted(workId: bigint): Promise<boolean> {
  try {
    const result = await readContract(config, {
      address: CONTRACT_ADDRESSES.nftManager,
      abi: NFT_MANAGER_ABI,
      functionName: 'isWorkNFTMinted',
      args: [workId],
    })
    
    return result as boolean
  } catch (error) {
    console.error('Failed to check NFT status:', error)
    return false
  }
}

// 获取作品对应的 NFT ID
export async function getWorkTokenId(workId: bigint): Promise<bigint> {
  try {
    const result = await readContract(config, {
      address: CONTRACT_ADDRESSES.nftManager,
      abi: NFT_MANAGER_ABI,
      functionName: 'getWorkTokenId',
      args: [workId],
    })
    
    return result as bigint
  } catch (error) {
    console.error('Failed to get token ID:', error)
    return BigInt(0)
  }
}

// 上架 NFT
export async function listNFT(tokenId: bigint, price: string): Promise<string> {
  try {
    console.log('Listing NFT:', tokenId.toString(), 'for price:', price, 'ETH')
    
    const priceInWei = parseEther(price)
    
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.nftMarketplace,
      abi: NFT_MARKETPLACE_ABI,
      functionName: 'listToken',
      args: [tokenId, priceInWei],
    })

    console.log('List transaction sent:', hash)
    
    // 等待交易确认
    const receipt = await waitForTransactionReceipt(config, { hash })
    console.log('List transaction confirmed:', receipt)
    
    return hash
  } catch (error) {
    console.error('Failed to list NFT:', error)
    throw error
  }
}

// 购买 NFT
export async function buyNFT(tokenId: bigint, price: string): Promise<string> {
  try {
    console.log('Buying NFT:', tokenId.toString(), 'for price:', price, 'ETH')
    
    const priceInWei = parseEther(price)
    
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.nftMarketplace,
      abi: NFT_MARKETPLACE_ABI,
      functionName: 'buyToken',
      args: [tokenId],
      value: priceInWei,
    })

    console.log('Buy transaction sent:', hash)
    
    // 等待交易确认
    const receipt = await waitForTransactionReceipt(config, { hash })
    console.log('Buy transaction confirmed:', receipt)
    
    return hash
  } catch (error) {
    console.error('Failed to buy NFT:', error)
    throw error
  }
}

// 取消上架
export async function cancelListing(tokenId: bigint): Promise<string> {
  try {
    console.log('Cancelling listing for NFT:', tokenId.toString())
    
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESSES.nftMarketplace,
      abi: NFT_MARKETPLACE_ABI,
      functionName: 'cancelListing',
      args: [tokenId],
    })

    console.log('Cancel transaction sent:', hash)
    
    // 等待交易确认
    const receipt = await waitForTransactionReceipt(config, { hash })
    console.log('Cancel transaction confirmed:', receipt)
    
    return hash
  } catch (error) {
    console.error('Failed to cancel listing:', error)
    throw error
  }
}

// 获取 NFT listing 信息
export async function getNFTListing(tokenId: bigint): Promise<{
  tokenId: bigint
  seller: string
  price: bigint
  active: boolean
  timestamp: bigint
} | null> {
  try {
    const result = await readContract(config, {
      address: CONTRACT_ADDRESSES.nftMarketplace,
      abi: NFT_MARKETPLACE_ABI,
      functionName: 'getListing',
      args: [tokenId],
    })
    
    const listing = result as any
    
    // 检查是否有有效的 listing
    if (!listing || listing.seller === '0x0000000000000000000000000000000000000000') {
      return null
    }
    
    return {
      tokenId: listing.tokenId,
      seller: listing.seller,
      price: listing.price,
      active: listing.active,
      timestamp: listing.timestamp,
    }
  } catch (error) {
    console.error('Failed to get NFT listing:', error)
    return null
  }
}

// 获取活跃的 listings
export async function getActiveListings(): Promise<bigint[]> {
  try {
    const result = await readContract(config, {
      address: CONTRACT_ADDRESSES.nftMarketplace,
      abi: NFT_MARKETPLACE_ABI,
      functionName: 'getActiveListings',
      args: [],
    })
    
    return result as bigint[]
  } catch (error) {
    console.error('Failed to get active listings:', error)
    return []
  }
}

// 获取 NFT 所有者
export async function getNFTOwner(tokenId: bigint): Promise<string | null> {
  try {
    const result = await readContract(config, {
      address: CONTRACT_ADDRESSES.nftManager,
      abi: NFT_MANAGER_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    })
    
    return result as string
  } catch (error) {
    console.error('Failed to get NFT owner:', error)
    return null
  }
}

// 检查用户是否拥有特定 NFT
export async function doesUserOwnNFT(tokenId: bigint, userAddress: string): Promise<boolean> {
  try {
    const owner = await getNFTOwner(tokenId)
    return owner?.toLowerCase() === userAddress.toLowerCase()
  } catch (error) {
    console.error('Failed to check NFT ownership:', error)
    return false
  }
}

// 格式化价格显示
export function formatPrice(priceInWei: bigint): string {
  return formatEther(priceInWei)
}