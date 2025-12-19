import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { WorkRegistryService } from '@/lib/contracts/services/workRegistry.service';
import { NETWORK_CONFIG } from '@/lib/contracts/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      metadataURI, 
      licenseFee, 
      allowRemix, 
      parentWorkId = 0,
      signerAddress,
      signature 
    } = body;

    // 验证必需参数
    if (!metadataURI || !licenseFee || signerAddress === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 创建provider
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
    
    // 这里应该验证签名并创建signer
    // 为了安全，实际项目中应该使用更安全的方式处理私钥
    const workRegistryService = new WorkRegistryService(provider);

    // 由于这是API路由，我们不能直接执行需要签名的交易
    // 这个API主要用于验证参数和返回交易数据
    const transactionData = {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_WORK_REGISTRY,
      data: ethers.Interface.from([
        'function createWork(string memory metadataURI, uint256 licenseFee, bool allowRemix, uint256 parentWorkId) external returns (uint256)'
      ]).encodeFunctionData('createWork', [
        metadataURI,
        ethers.parseEther(licenseFee.toString()),
        allowRemix,
        parentWorkId
      ]),
      value: '0'
    };

    return NextResponse.json({
      success: true,
      transactionData,
      message: 'Transaction data prepared successfully'
    });

  } catch (error) {
    console.error('Create work API error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare work creation transaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('workId');

    if (!workId) {
      return NextResponse.json(
        { error: 'Work ID is required' },
        { status: 400 }
      );
    }

    // 创建provider和service
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
    const workRegistryService = new WorkRegistryService(provider);

    // 获取作品信息
    const work = await workRegistryService.getWork(parseInt(workId));

    return NextResponse.json({
      success: true,
      work
    });

  } catch (error) {
    console.error('Get work API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work information' },
      { status: 500 }
    );
  }
}