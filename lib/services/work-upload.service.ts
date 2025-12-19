/**
 * WhichWitch v2.0 作品上传服务
 * 分离数据库存储和NFT铸造流程
 */

import { uploadFileToPinata, createAndUploadMetadata } from '@/lib/ipfs/pinata.service'
import { registerOriginalWork, registerDerivativeWork } from '@/lib/web3/services/contract.service'
import { createWork } from '@/lib/supabase/services/work.service'
import { mintWorkNFT } from '@/lib/web3/services/nft.service'

export interface WorkUploadData {
  title: string
  description?: string
  story?: string
  material?: string[]
  tags?: string[]
  allowRemix: boolean
  licenseFee: string
  isRemix: boolean
  parentWorkId?: number
  // 许可证信息
  licenseSelection?: {
    commercial: string
    derivative: string
    nft: string
    shareAlike: string
    licenseName: string
    description: string
  }
}

export interface WorkCreationResult {
  // 基础作品信息
  work: {
    workId: number
    creatorAddress: string
    title: string
    imageUrl: string
    images: string[]
    metadataUri: string
    txHash?: string // 可选，只有mint时才有
  }
  // IPFS信息
  ipfs: {
    imageHashes: string[]
    metadataHash: string
    imageUrls: string[]
  }
  // 是否进行了区块链操作
  onChain: boolean
}

/**
 * 第一步：上传作品到数据库和IPFS（不上链）
 * 用户可以选择稍后mint或直接显示在广场
 */
export async function uploadWorkToDatabase(
  files: File[],
  workData: WorkUploadData,
  creatorAddress: string,
  onProgress?: (current: number, total: number, step: string) => void
): Promise<WorkCreationResult> {
  
  console.log('📤 开始上传作品到数据库和IPFS...')
  
  try {
    // ============================================
    // 步骤1: 上传所有图片到IPFS
    // ============================================
    console.log('📸 步骤1: 上传图片到IPFS...')
    
    // 为了避免进度条闪烁，我们逐个上传文件而不是并行上传
    const imageHashes: string[] = []
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].name
      console.log(`📸 上传文件 ${i + 1}/${files.length}: ${fileName}`)
      onProgress?.(i, files.length, `上传图片: ${fileName}`)
      
      const hash = await uploadFileToPinata(files[i])
      imageHashes.push(hash)
    }
    const imageUrls = imageHashes.map(hash => 
      `https://gateway.pinata.cloud/ipfs/${hash}`
    )
    const primaryImageUrl = imageUrls[0]
    
    console.log('✅ 图片上传完成:', {
      count: imageHashes.length,
      primaryHash: imageHashes[0],
      primaryUrl: primaryImageUrl
    })

    // ============================================
    // 步骤2: 创建并上传作品metadata到IPFS
    // ============================================
    console.log('📝 步骤2: 创建作品metadata...')
    onProgress?.(files.length, files.length, '创建作品metadata...')
    
    const workMetadataHash = await createAndUploadMetadata({
      title: workData.title,
      description: workData.description,
      story: workData.story,
      imageHash: imageHashes[0],
      images: imageUrls,
      material: workData.material,
      tags: workData.tags,
      creator: creatorAddress,
      parentWorkId: workData.parentWorkId,
    })
    const workMetadataUri = `ipfs://${workMetadataHash}`
    
    console.log('✅ 作品metadata创建完成:', workMetadataUri)

    // ============================================
    // 步骤3: 生成临时workId并保存到数据库
    // ============================================
    console.log('💾 步骤3: 保存到数据库...')
    onProgress?.(files.length, files.length, '保存到数据库...')
    
    // 生成临时workId（使用时间戳 + 随机数）
    const tempWorkId = Date.now() + Math.floor(Math.random() * 1000)
    
    const dbWorkData = {
      workId: tempWorkId,
      creatorAddress,
      title: workData.title,
      description: workData.description,
      story: workData.story,
      imageUrl: primaryImageUrl,
      images: imageUrls,
      metadataUri: workMetadataUri,
      material: workData.material,
      tags: workData.tags,
      allowRemix: workData.allowRemix,
      licenseFee: workData.licenseFee,
      isRemix: workData.isRemix,
      parentWorkId: workData.parentWorkId,
      licenseSelection: workData.licenseSelection,
    }
    
    console.log('📋 准备保存的数据:', dbWorkData)
    
    const newWork = await createWork(dbWorkData)
    console.log('✅ 数据库保存完成:', newWork)

    // 构建结果
    const result: WorkCreationResult = {
      work: {
        workId: tempWorkId,
        creatorAddress,
        title: workData.title,
        imageUrl: primaryImageUrl,
        images: imageUrls,
        metadataUri: workMetadataUri,
        // 没有txHash，因为没有上链
      },
      ipfs: {
        imageHashes,
        metadataHash: workMetadataHash,
        imageUrls,
      },
      onChain: false // 标记为未上链
    }

    console.log('🎉 作品上传完成! (仅数据库和IPFS)')
    return result

  } catch (error) {
    console.error('❌ 作品上传失败:', error)
    throw error
  }
}

/**
 * 第二步：将已存在的作品mint到区块链
 */
export async function mintExistingWork(
  workId: number,
  workData: WorkUploadData,
  creatorAddress: string,
  metadataUri: string
): Promise<{ txHash: string; blockchainWorkId: number }> {
  
  console.log('⛓️ 开始将作品mint到区块链...', workId)
  
  try {
    // ============================================
    // 在区块链上注册作品
    // ============================================
    console.log('⛓️ 注册作品到区块链...')
    let contractResult
    if (workData.isRemix && workData.parentWorkId) {
      contractResult = await registerDerivativeWork(
        BigInt(workData.parentWorkId),
        workData.licenseFee,
        workData.allowRemix,
        metadataUri
      )
    } else {
      contractResult = await registerOriginalWork(
        workData.licenseFee,
        workData.allowRemix,
        metadataUri
      )
    }
    
    const blockchainWorkId = Number(contractResult.workId)
    console.log('✅ 区块链注册完成:', {
      blockchainWorkId,
      txHash: contractResult.hash
    })

    // ============================================
    // 更新数据库中的workId和交易哈希
    // ============================================
    console.log('🔄 更新数据库中的区块链信息...')
    
    // 调用API更新work记录
    const updateResponse = await fetch('/api/works/update-blockchain-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tempWorkId: workId,
        blockchainWorkId: blockchainWorkId,
        txHash: contractResult.hash,
      }),
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update blockchain info in database')
    }

    console.log('✅ 数据库更新完成')

    return {
      txHash: contractResult.hash,
      blockchainWorkId: blockchainWorkId
    }

  } catch (error) {
    console.error('❌ 区块链mint失败:', error)
    throw error
  }
}

/**
 * 第三步：为已mint的作品铸造NFT
 */
export async function mintNFTForWork(
  blockchainWorkId: number,
  creatorAddress: string,
  nftMetadata?: {
    name?: string
    description?: string
    attributes?: Array<{ trait_type: string; value: string }>
  }
): Promise<{
  tokenId: string
  tokenURI: string
  mintTxHash: string
}> {
  
  console.log('🎨 为作品铸造NFT:', blockchainWorkId)
  
  try {
    // 从数据库获取作品信息
    const workResponse = await fetch(`/api/works/${blockchainWorkId}`)
    if (!workResponse.ok) {
      throw new Error('Work not found')
    }
    
    const work = await workResponse.json()
    
    if (work.creator_address.toLowerCase() !== creatorAddress.toLowerCase()) {
      throw new Error('Only work creator can mint NFT')
    }

    // 检查是否已经铸造过NFT
    const { isWorkNFTMinted } = await import('@/lib/web3/services/nft.service')
    const isAlreadyMinted = await isWorkNFTMinted(BigInt(blockchainWorkId))
    if (isAlreadyMinted) {
      throw new Error('NFT already minted for this work')
    }

    // 创建NFT metadata
    const { uploadJSONToPinata } = await import('@/lib/ipfs/pinata.service')
    
    const nftMetadataObj = {
      name: nftMetadata?.name || work.title,
      description: nftMetadata?.description || work.description || '',
      image: work.image_url.startsWith('ipfs://') 
        ? work.image_url 
        : `ipfs://${work.image_url.split('/').pop()}`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/work/${blockchainWorkId}`,
      attributes: [
        ...(work.material?.map((m: string) => ({ trait_type: 'Material', value: m })) || []),
        ...(work.tags?.map((t: string) => ({ trait_type: 'Tag', value: t })) || []),
        { trait_type: 'Creator', value: creatorAddress },
        { trait_type: 'Work ID', value: blockchainWorkId.toString() },
        { trait_type: 'Is Remix', value: work.is_remix ? 'Yes' : 'No' },
        ...(nftMetadata?.attributes || []),
      ],
      properties: {
        workId: blockchainWorkId,
        creator: creatorAddress,
        isRemix: work.is_remix,
        parentWorkId: work.parent_work_id,
        originalCreatedAt: work.created_at,
        nftMintedAt: new Date().toISOString(),
      }
    }

    // 上传NFT metadata到IPFS
    const nftMetadataHash = await uploadJSONToPinata(
      nftMetadataObj, 
      `${work.title}-nft-metadata`
    )
    const nftTokenURI = `ipfs://${nftMetadataHash}`
    
    console.log('📄 NFT metadata创建完成:', nftTokenURI)

    // 铸造NFT
    const mintTxHash = await mintWorkNFT(BigInt(blockchainWorkId), nftTokenURI)
    
    // 获取tokenId (简化处理)
    const tokenId = blockchainWorkId.toString()
    
    console.log('✅ NFT铸造完成:', {
      tokenId,
      tokenURI: nftTokenURI,
      mintTxHash
    })

    // 更新数据库中的NFT状态
    const updateResponse = await fetch('/api/works/sync-nft-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workId: blockchainWorkId,
        tokenId: tokenId,
        isMinted: true,
        ownerAddress: creatorAddress,
        tokenURI: nftTokenURI,
        mintTxHash: mintTxHash,
      }),
    })

    if (!updateResponse.ok) {
      console.error('Failed to update NFT status in database')
    }

    return {
      tokenId,
      tokenURI: nftTokenURI,
      mintTxHash,
    }

  } catch (error) {
    console.error('❌ NFT铸造失败:', error)
    throw error
  }
}