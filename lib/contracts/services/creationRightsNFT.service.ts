import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CreationRightsNFTABI } from '../config';

export interface NFTInfo {
  tokenId: number;
  workId: number;
  owner: string;
  tokenURI: string;
  isForSale: boolean;
  price?: string;
}

export class CreationRightsNFTService {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.SEPOLIA.CREATION_RIGHTS_NFT,
      CreationRightsNFTABI,
      provider
    );
    this.signer = signer;
  }

  // 铸造作品NFT
  async mintWorkNFT(workId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.mintWorkNFT(workId);
    const receipt = await tx.wait();

    // 从事件中获取tokenId
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === ethers.id('NFTMinted(uint256,uint256,address)')
    );
    
    if (event) {
      const tokenId = ethers.getBigInt(event.topics[1]);
      return tokenId.toString();
    }
    
    throw new Error('NFT minting failed');
  }

  // 挂售NFT
  async listNFT(tokenId: number, price: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.listNFT(
      tokenId,
      ethers.parseEther(price)
    );
    
    return tx.hash;
  }

  // 购买NFT
  async buyNFT(tokenId: number, price: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.buyNFT(tokenId, {
      value: ethers.parseEther(price)
    });
    
    return tx.hash;
  }

  // 检查作品是否已铸造NFT
  async hasWorkNFT(workId: number): Promise<boolean> {
    return await this.contract.hasWorkNFT(workId);
  }

  // 获取作品对应的NFT ID
  async getWorkNFTId(workId: number): Promise<number> {
    const result = await this.contract.getWorkNFTId(workId);
    return Number(result);
  }

  // 获取NFT对应的作品ID
  async getNFTWorkId(tokenId: number): Promise<number> {
    const result = await this.contract.getNFTWorkId(tokenId);
    return Number(result);
  }

  // 获取NFT所有者
  async getOwner(tokenId: number): Promise<string> {
    return await this.contract.ownerOf(tokenId);
  }

  // 获取NFT元数据URI
  async getTokenURI(tokenId: number): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }

  // 获取用户NFT余额
  async getBalance(owner: string): Promise<number> {
    const result = await this.contract.balanceOf(owner);
    return Number(result);
  }

  // 授权NFT
  async approve(to: string, tokenId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.approve(to, tokenId);
    return tx.hash;
  }

  // 转移NFT
  async transferFrom(from: string, to: string, tokenId: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    const contractWithSigner = this.contract.connect(this.signer);
    const tx = await contractWithSigner.transferFrom(from, to, tokenId);
    return tx.hash;
  }

  // 监听NFT铸造事件
  onNFTMinted(callback: (tokenId: number, workId: number, creator: string) => void) {
    this.contract.on('NFTMinted', (tokenId, workId, creator) => {
      callback(Number(tokenId), Number(workId), creator);
    });
  }

  // 监听NFT上架事件
  onNFTListed(callback: (tokenId: number, workId: number, seller: string, price: string) => void) {
    this.contract.on('NFTListed', (tokenId, workId, seller, price) => {
      callback(Number(tokenId), Number(workId), seller, ethers.formatEther(price));
    });
  }

  // 监听NFT售出事件
  onNFTSold(callback: (tokenId: number, workId: number, seller: string, buyer: string, price: string) => void) {
    this.contract.on('NFTSold', (tokenId, workId, seller, buyer, price) => {
      callback(Number(tokenId), Number(workId), seller, buyer, ethers.formatEther(price));
    });
  }

  // 停止监听事件
  removeAllListeners() {
    this.contract.removeAllListeners();
  }
}