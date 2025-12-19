import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CreationRightsNFTService } from '@/lib/contracts/services/creationRightsNFT.service';
import { NETWORK_CONFIG } from '@/lib/contracts/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, signerAddress } = body;

    // 验证必需参数
    if (!workId || !signerAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 创建provider
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
    const nftService = new CreationRightsNFTService(provider);

    // 检查作品是否已经铸造NFT
    const hasNFT = await nftService.hasWorkNFT(workId);
    if (hasNFT) {
      return NextResponse.json(
        { error: 'NFT already minted for this work' },
        { status: 400 }
      );
    }

    // 准备交易数据
    const transactionData = {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION_RIGHTS_NFT,
      data: ethers.Interface.from([
        'function mintWorkNFT(uint256 workId) external returns (uint256)'
      ]).encodeFunctionData('mintWorkNFT', [workId]),
      value: '0'
    };

    return NextResponse.json({
      success: true,
      transactionData,
      message: 'NFT mint transaction data prepared successfully'
    });

  } catch (error) {
    console.error('Mint NFT API error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare NFT mint transaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('workId');
    const tokenId = searchParams.get('tokenId');

    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
    const nftService = new CreationRightsNFTService(provider);

    if (workId) {
      // 检查作品是否有NFT
      const hasNFT = await nftService.hasWorkNFT(parseInt(workId));
      let nftInfo = null;

      if (hasNFT) {
        const nftTokenId = await nftService.getWorkNFTId(parseInt(workId));
        const owner = await nftService.getOwner(nftTokenId);
        const tokenURI = await nftService.getTokenURI(nftTokenId);

        nftInfo = {
          tokenId: nftTokenId,
          workId: parseInt(workId),
          owner,
          tokenURI,
          hasNFT: true
        };
      }

      return NextResponse.json({
        success: true,
        hasNFT,
        nftInfo
      });
    }

    if (tokenId) {
      // 获取NFT信息
      const workId = await nftService.getNFTWorkId(parseInt(tokenId));
      const owner = await nftService.getOwner(parseInt(tokenId));
      const tokenURI = await nftService.getTokenURI(parseInt(tokenId));

      return NextResponse.json({
        success: true,
        nftInfo: {
          tokenId: parseInt(tokenId),
          workId,
          owner,
          tokenURI
        }
      });
    }

    return NextResponse.json(
      { error: 'Either workId or tokenId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Get NFT info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT information' },
      { status: 500 }
    );
  }
}