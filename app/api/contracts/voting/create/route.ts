import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { VotingSystemService, VotingType } from '@/lib/contracts/services/votingSystem.service';
import { NETWORK_CONFIG } from '@/lib/contracts/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      workId, 
      title, 
      description, 
      votingType, 
      options, 
      duration, 
      minStakeAmount,
      signerAddress 
    } = body;

    // 验证必需参数
    if (!workId || !title || !options || !duration || !signerAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 验证选项数量
    if (options.length < 2 || options.length > 10) {
      return NextResponse.json(
        { error: 'Options must be between 2 and 10' },
        { status: 400 }
      );
    }

    // 验证投票类型
    if (votingType < 0 || votingType > 6) {
      return NextResponse.json(
        { error: 'Invalid voting type' },
        { status: 400 }
      );
    }

    // 准备交易数据
    const transactionData = {
      to: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTING_SYSTEM,
      data: ethers.Interface.from([
        'function createVoting(uint256 workId, string memory title, string memory description, uint8 votingType, string[] memory options, uint256 duration, uint256 minStakeAmount) external returns (uint256)'
      ]).encodeFunctionData('createVoting', [
        workId,
        title,
        description || '',
        votingType,
        options,
        duration,
        ethers.parseEther((minStakeAmount || '0.001').toString())
      ]),
      value: '0'
    };

    return NextResponse.json({
      success: true,
      transactionData,
      message: 'Voting creation transaction data prepared successfully'
    });

  } catch (error) {
    console.error('Create voting API error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare voting creation transaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const votingId = searchParams.get('votingId');

    if (!votingId) {
      return NextResponse.json(
        { error: 'Voting ID is required' },
        { status: 400 }
      );
    }

    // 创建provider和service
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
    const votingService = new VotingSystemService(provider);

    // 获取投票信息
    const voting = await votingService.getVoting(parseInt(votingId));
    
    // 获取所有选项的票数
    const optionVotes = await votingService.getAllOptionVotes(
      parseInt(votingId), 
      voting.options.length
    );

    // 检查投票是否结束
    const isEnded = await votingService.isVotingEnded(parseInt(votingId));

    return NextResponse.json({
      success: true,
      voting: {
        ...voting,
        optionVotes,
        isEnded
      }
    });

  } catch (error) {
    console.error('Get voting API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voting information' },
      { status: 500 }
    );
  }
}