/**
 * WhichWitch v2.0 作品-NFT集成服务
 * 统一处理图片上传、IPFS存储、作品创建和NFT铸造的完整流程
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
  // NFT相关选项
  mintNFT?: boolean // 是否同时铸造NFT
  nftMetadata?: {
    name?: string
    description?: string
    attributes?: Array<{ trait_type: string; value: string }>
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
    txHash: string
  }
  // NFT信息（如果铸造了）
  nft?: {
    tokenId: string
    tokenURI: string
    mintTxHash: string
    isMinted: boolean
  }
  // IPFS信息
  ipfs: {
    imageHashes: string[]
    metadataHash: string
    imageUrls: string[]
  }
}

/**
 * 统一的作品上传和NFT铸造流程
 * 1. 上传图片到IPFS
 * 2. 创建并上传metadata到IPFS  
 * 3. 在区块链上注册作品
 * 4. 保存到数据库
 * 5. 可选：铸造NFT
 */
export async function createWorkWithOptionalNFT(
  files: File[],
  workData: WorkUploadData,
  creatorAddress: string
): Promise<WorkCreationResult> {
  
  console.log('🚀 开始作品创建流程...')
  
  try {
    // ============================================
    // 步骤1: 上传所有图片到IPFS
    // ============================================
    console.log('📸 步骤1: 上传图片到IPFS...')
    
    // 为了避免进度条闪烁，我们逐个上传文件而不是并行上传
    const imageHashes: string[] = []
    for (let i = 0; i < files.length; i++) {
      console.log(`📸 上传文件 ${i + 1}/${files.length}: ${files[i].name}`)
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
    // 步骤3: 在区块链上注册作品
    // ============================================
    console.log('⛓️ 步骤3: 注册作品到区块链...')
    let contractResult
    if (workData.isRemix && workData.parentWorkId) {
      contractResult = await registerDerivativeWork(
        BigInt(workData.parentWorkId),
        workData.licenseFee,
        workData.allowRemix,
        workMetadataUri
      )
    } else {
      contractResult = await registerOriginalWork(
        workData.licenseFee,
        workData.allowRemix,
        workMetadataUri
      )
    }
    
    const workId = Number(contractResult.workId)
    console.log('✅ 作品注册完成:', {
      workId,
      txHash: contractResult.hash
    })

    // ============================================
    // 步骤4: 保存作品到数据库
    // ============================================
    console.log('💾 步骤4: 保存到数据库...')
    const dbWorkData = {
      workId,
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
    }
    
    console.log('📋 准备保存的数据:', dbWorkData)
    
    try {
      const newWork = await createWork(dbWorkData)
      console.log('✅ 数据库保存完成:', newWork)
      
      // 触发前端刷新 - 发送自定义事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workCreated', { 
          detail: { workId, work: newWork } 
        }))
        console.log('📡 已发送作品创建事件，前端将自动刷新')
      }
    } catch (dbError) {
      console.error('❌ 数据库保存失败:', dbError)
      // 不抛出错误，让NFT铸造继续进行
      console.log('⚠️ 继续NFT铸造流程，稍后可手动同步数据库')
      
      // 即使数据库保存失败，也尝试触发刷新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workCreationFailed', { 
          detail: { workId, error: dbError } 
        }))
      }
    }

    // 构建基础结果
    const result: WorkCreationResult = {
      work: {
        workId,
        creatorAddress,
        title: workData.title,
        imageUrl: primaryImageUrl,
        images: imageUrls,
        metadataUri: workMetadataUri,
        txHash: contractResult.hash,
      },
      ipfs: {
        imageHashes,
        metadataHash: workMetadataHash,
        imageUrls,
      }
    }

    // ============================================
    // 步骤5: 可选 - 铸造NFT
    // ============================================
    if (workData.mintNFT) {
      console.log('🎨 步骤5: 铸造NFT...')
      
      try {
        // 创建NFT专用的metadata
        const nftMetadata = {
          name: workData.nftMetadata?.name || workData.title,
          description: workData.nftMetadata?.description || workData.description || '',
          image: `ipfs://${imageHashes[0]}`,
          external_url: `${process.env.NEXT_PUBLIC_APP_URL}/work/${workId}`,
          attributes: [
            ...(workData.material?.map(m => ({ trait_type: 'Material', value: m })) || []),
            ...(workData.tags?.map(t => ({ trait_type: 'Tag', value: t })) || []),
            { trait_type: 'Creator', value: creatorAddress },
            { trait_type: 'Work ID', value: workId.toString() },
            { trait_type: 'Is Remix', value: workData.isRemix ? 'Yes' : 'No' },
            ...(workData.nftMetadata?.attributes || []),
          ],
          properties: {
            workId,
            creator: creatorAddress,
            isRemix: workData.isRemix,
            parentWorkId: workData.parentWorkId,
            createdAt: new Date().toISOString(),
          }
        }

        // 上传NFT metadata到IPFS
        const nftMetadataHash = await uploadJSONToPinata(
          nftMetadata, 
          `${workData.title}-nft-metadata`
        )
        const nftTokenURI = `ipfs://${nftMetadataHash}`
        
        console.log('📄 NFT metadata创建完成:', nftTokenURI)

        // 铸造NFT
        const mintTxHash = await mintWorkNFT(BigInt(workId), nftTokenURI)
        
        // 获取tokenId (需要从交易receipt中解析或调用合约查询)
        // 这里简化处理，实际应该从事件日志中获取
        const tokenId = workId.toString() // 简化：假设tokenId与workId相关
        
        console.log('✅ NFT铸造完成:', {
          tokenId,
          tokenURI: nftTokenURI,
          mintTxHash
        })

        // 更新数据库中的NFT状态
        await updateWorkNFTStatus(workId, {
          tokenId: BigInt(tokenId),
          isMinted: true,
          ownerAddress: creatorAddress,
          tokenURI: nftTokenURI,
          mintTxHash
        })

        result.nft = {
          tokenId,
          tokenURI: nftTokenURI,
          mintTxHash,
          isMinted: true,
        }
        
      } catch (nftError) {
        console.error('❌ NFT铸造失败:', nftError)
        // NFT铸造失败不影响作品创建，只是记录错误
        result.nft = {
          tokenId: '',
          tokenURI: '',
          mintTxHash: '',
          isMinted: false,
        }
      }
    }

    console.log('🎉 作品创建流程完成!')
    return result

  } catch (error) {
    console.error('❌ 作品创建流程失败:', error)
    throw error
  }
}

/**
 * 为已存在的作品铸造NFT
 */
export async function mintNFTForExistingWork(
  workId: number,
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
  
  console.log('🎨 为现有作品铸造NFT:', workId)
  
  try {
    // 从数据库获取作品信息
    const work = await getWorkById(workId)
    if (!work) {
      throw new Error('作品不存在')
    }
    
    if (work.creator_address.toLowerCase() !== creatorAddress.toLowerCase()) {
      throw new Error('只有作品创作者可以铸造NFT')
    }

    // 检查是否已经铸造过NFT
    const isAlreadyMinted = await isWorkNFTMinted(BigInt(workId))
    if (isAlreadyMinted) {
      throw new Error('该作品已经铸造过NFT')
    }

    // 创建NFT metadata
    const nftMetadataObj = {
      name: nftMetadata?.name || work.title,
      description: nftMetadata?.description || work.description || '',
      image: work.image_url.startsWith('ipfs://') 
        ? work.image_url 
        : `ipfs://${work.image_url.split('/').pop()}`,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL}/work/${workId}`,
      attributes: [
        ...(work.material?.map(m => ({ trait_type: 'Material', value: m })) || []),
        ...(work.tags?.map(t => ({ trait_type: 'Tag', value: t })) || []),
        { trait_type: 'Creator', value: creatorAddress },
        { trait_type: 'Work ID', value: workId.toString() },
        { trait_type: 'Is Remix', value: work.is_remix ? 'Yes' : 'No' },
        ...(nftMetadata?.attributes || []),
      ],
      properties: {
        workId,
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
    const mintTxHash = await mintWorkNFT(BigInt(workId), nftTokenURI)
    
    // 获取tokenId
    const tokenId = workId.toString() // 简化处理
    
    console.log('✅ NFT铸造完成:', {
      tokenId,
      tokenURI: nftTokenURI,
      mintTxHash
    })

    // 更新数据库中的NFT状态
    await updateWorkNFTStatus(workId, {
      tokenId: BigInt(tokenId),
      isMinted: true,
      ownerAddress: creatorAddress,
      tokenURI: nftTokenURI,
      mintTxHash
    })

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

/**
 * 更新数据库中的NFT状态
 */
async function updateWorkNFTStatus(
  workId: number,
  nftData: {
    tokenId: bigint
    isMinted: boolean
    ownerAddress: string
    tokenURI?: string
    mintTxHash?: string
  }
) {
  try {
    // 调用数据库同步函数
    const response = await fetch('/api/works/sync-nft-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workId,
        tokenId: nftData.tokenId.toString(),
        isMinted: nftData.isMinted,
        ownerAddress: nftData.ownerAddress,
        tokenURI: nftData.tokenURI,
        mintTxHash: nftData.mintTxHash,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update NFT status in database')
    }

    console.log('✅ NFT状态已同步到数据库')
  } catch (error) {
    console.error('❌ 数据库NFT状态同步失败:', error)
    // 不抛出错误，因为NFT已经铸造成功
  }
}

// 导入必要的函数
import { uploadJSONToPinata } from '@/lib/ipfs/pinata.service'
import { getWorkById } from '@/lib/supabase/services/work.service'
import { isWorkNFTMinted } from '@/lib/web3/services/nft.service'