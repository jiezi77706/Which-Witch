import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, WorkRegistryABI } from '../config';

export interface Work {
  id: number;
  creator: string;
  creationType: number;
  parentWorkId: number;
  metadataURI: string;
  licenseFee: string;
  allowRemix: boolean;
  createdAt: number;
  isActive: boolean;
}

export interface CreateWorkParams {
  metadataURI: string;
  licenseFee: string;
  allowRemix: boolean;
  parentWorkId?: number;
}

export class WorkRegistryService {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.SEPOLIA.WORK_REGISTRY,
      WorkRegistryABI,
      provider
    );
    this.signer = signer;
  }

  // 创建作品
  async createWork(params: CreateWorkParams): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.createWork(
      params.metadataURI,
      ethers.parseEther(params.licenseFee),
      params.allowRemix,
      params.parentWorkId || 0
    );

    const receipt = await tx.wait();
    
    // 从事件中获取workId
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === ethers.id('WorkCreated(uint256,address,uint8,uint256,string,uint256,bool)')
    );
    
    if (event) {
      const workId = ethers.getBigInt(event.topics[1]);
      return workId.toString();
    }
    
    throw new Error('Work creation failed');
  }

  // 获取作品信息
  async getWork(workId: number): Promise<Work> {
    const result = await this.contract.getWork(workId);
    
    return {
      id: Number(result[0]),
      creator: result[1],
      creationType: Number(result[2]),
      parentWorkId: Number(result[3]),
      metadataURI: result[4],
      licenseFee: ethers.formatEther(result[5]),
      allowRemix: result[6],
      createdAt: Number(result[7]),
      isActive: result[8],
    };
  }

  // 获取创作者的作品列表
  async getCreatorWorks(creator: string): Promise<number[]> {
    const result = await this.contract.getCreatorWorks(creator);
    return result.map((id: bigint) => Number(id));
  }

  // 获取衍生作品列表
  async getWorkDerivatives(workId: number): Promise<number[]> {
    const result = await this.contract.getWorkDerivatives(workId);
    return result.map((id: bigint) => Number(id));
  }

  // 检查是否为作品创作者
  async isWorkCreator(workId: number, user: string): Promise<boolean> {
    return await this.contract.isWorkCreator(workId, user);
  }

  // 获取总作品数
  async getTotalWorks(): Promise<number> {
    const result = await this.contract.totalWorks();
    return Number(result);
  }

  // 监听作品创建事件
  onWorkCreated(callback: (workId: number, creator: string, creationType: number) => void) {
    this.contract.on('WorkCreated', (workId, creator, creationType) => {
      callback(Number(workId), creator, Number(creationType));
    });
  }

  // 停止监听事件
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}