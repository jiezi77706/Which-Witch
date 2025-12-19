import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, VotingSystemABI } from '../config';

export interface Voting {
  votingId: number;
  workId: number;
  creator: string;
  title: string;
  description: string;
  votingType: number;
  options: string[];
  startTime: number;
  endTime: number;
  totalStaked: string;
  status: number;
  minStakeAmount: string;
}

export interface VoteRecord {
  optionId: number;
  stakedAmount: string;
  hasVoted: boolean;
  hasWithdrawn: boolean;
}

export interface CreateVotingParams {
  workId: number;
  title: string;
  description: string;
  votingType: number;
  options: string[];
  duration: number; // in seconds
  minStakeAmount: string; // in ETH
}

export enum VotingType {
  CHARACTER_DESIGN = 0,
  STORY_SETTING = 1,
  PLOT_DIRECTION = 2,
  ART_STYLE = 3,
  COLOR_SCHEME = 4,
  MUSIC_STYLE = 5,
  OTHER = 6
}

export enum VotingStatus {
  ACTIVE = 0,
  ENDED = 1,
  CANCELLED = 2
}

export class VotingSystemService {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.SEPOLIA.VOTING_SYSTEM,
      VotingSystemABI,
      provider
    );
    this.signer = signer;
  }

  // 创建投票
  async createVoting(params: CreateVotingParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.createVoting(
      params.workId,
      params.title,
      params.description,
      params.votingType,
      params.options,
      params.duration,
      ethers.parseEther(params.minStakeAmount)
    );

    const receipt = await tx.wait();
    
    // 从事件中获取votingId
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === ethers.id('VotingCreated(uint256,uint256,address,string,uint8,uint256,uint256)')
    );
    
    if (event) {
      const votingId = ethers.getBigInt(event.topics[1]);
      return votingId.toString();
    }
    
    throw new Error('Voting creation failed');
  }

  // 参与投票
  async vote(votingId: number, optionId: number, stakeAmount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.vote(votingId, optionId, {
      value: ethers.parseEther(stakeAmount)
    });
    
    return tx.hash;
  }

  // 结束投票
  async endVoting(votingId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.endVoting(votingId);
    return tx.hash;
  }

  // 提取质押
  async withdrawStake(votingId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.withdrawStake(votingId);
    return tx.hash;
  }

  // 获取投票信息
  async getVoting(votingId: number): Promise<Voting> {
    const result = await this.contract.getVoting(votingId);
    
    return {
      votingId: Number(result[0]),
      workId: Number(result[1]),
      creator: result[2],
      title: result[3],
      description: result[4],
      votingType: Number(result[5]),
      options: result[6],
      startTime: Number(result[7]),
      endTime: Number(result[8]),
      totalStaked: ethers.formatEther(result[9]),
      status: Number(result[10]),
      minStakeAmount: ethers.formatEther(result[11]),
    };
  }

  // 获取选项票数
  async getOptionVotes(votingId: number, optionId: number): Promise<string> {
    const result = await this.contract.getOptionVotes(votingId, optionId);
    return ethers.formatEther(result);
  }

  // 获取用户投票记录
  async getUserVoteRecord(votingId: number, user: string): Promise<VoteRecord> {
    const result = await this.contract.getUserVoteRecord(votingId, user);
    
    return {
      optionId: Number(result[0]),
      stakedAmount: ethers.formatEther(result[1]),
      hasVoted: result[2],
      hasWithdrawn: result[3],
    };
  }

  // 获取所有选项的票数
  async getAllOptionVotes(votingId: number, optionsCount: number): Promise<string[]> {
    const votes: string[] = [];
    
    for (let i = 0; i < optionsCount; i++) {
      const vote = await this.getOptionVotes(votingId, i);
      votes.push(vote);
    }
    
    return votes;
  }

  // 检查投票是否结束
  async isVotingEnded(votingId: number): Promise<boolean> {
    const voting = await this.getVoting(votingId);
    const now = Math.floor(Date.now() / 1000);
    return voting.status === VotingStatus.ENDED || now > voting.endTime;
  }

  // 检查用户是否已投票
  async hasUserVoted(votingId: number, user: string): Promise<boolean> {
    const record = await this.getUserVoteRecord(votingId, user);
    return record.hasVoted;
  }

  // 监听投票创建事件
  onVotingCreated(callback: (votingId: number, workId: number, creator: string, title: string) => void) {
    this.contract.on('VotingCreated', (votingId, workId, creator, title) => {
      callback(Number(votingId), Number(workId), creator, title);
    });
  }

  // 监听投票事件
  onVoteCast(callback: (votingId: number, voter: string, optionId: number, stakedAmount: string) => void) {
    this.contract.on('VoteCast', (votingId, voter, optionId, stakedAmount) => {
      callback(Number(votingId), voter, Number(optionId), ethers.formatEther(stakedAmount));
    });
  }

  // 监听投票结束事件
  onVotingEnded(callback: (votingId: number, winningOption: number, totalParticipants: number) => void) {
    this.contract.on('VotingEnded', (votingId, winningOption, totalParticipants) => {
      callback(Number(votingId), Number(winningOption), Number(totalParticipants));
    });
  }

  // 停止监听事件
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}