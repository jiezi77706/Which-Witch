// 智能合约配置文件
// 更新时间: 2024-12-19
// 版本: v3.0 模块化合约系统

export const CONTRACT_ADDRESSES = {
  // Sepolia 测试网合约
  SEPOLIA: {
    WORK_REGISTRY: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_WORK_REGISTRY || '0xe683b6970593fa5c2277779fda61a815e86fbbb8',
    VOTING_SYSTEM: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTING_SYSTEM || '0xa473bbc7fb3d3f715e92b6b4fb311bd116bc59a5',
    CREATION_RIGHTS_NFT: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION_RIGHTS_NFT || '0xeb3663709c5609c581d73acf79c9af931ee5cdc5',
  },
  
  // ZetaChain 合约
  ZETA: {
    CROSS_CHAIN_PAYMENT: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ZETA_PAYMENT || '',
  }
} as const;

export const NETWORK_CONFIG = {
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  ZETA_TESTNET: {
    chainId: 7001,
    name: 'ZetaChain Athens',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://athens3.zetachain.com',
  }
} as const;

// 合约ABI导入
export { default as WorkRegistryABI } from './abis/WorkRegistry.json';
export { default as VotingSystemABI } from './abis/VotingSystem.json';
export { default as CreationRightsNFTABI } from './abis/CreationRightsNFT.json';
export { default as ZetaCrossChainPaymentABI } from './abis/ZetaCrossChainPayment.json';

// 合约实例类型
export type ContractName = 
  | 'WorkRegistry'
  | 'VotingSystem' 
  | 'CreationRightsNFT'
  | 'ZetaCrossChainPayment';

// 网络类型
export type NetworkName = 'SEPOLIA' | 'ZETA_TESTNET';

// 合约地址验证
export function validateContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// 获取合约地址
export function getContractAddress(contract: ContractName, network: NetworkName = 'SEPOLIA'): string {
  switch (contract) {
    case 'WorkRegistry':
      return CONTRACT_ADDRESSES.SEPOLIA.WORK_REGISTRY;
    case 'VotingSystem':
      return CONTRACT_ADDRESSES.SEPOLIA.VOTING_SYSTEM;
    case 'CreationRightsNFT':
      return CONTRACT_ADDRESSES.SEPOLIA.CREATION_RIGHTS_NFT;
    case 'ZetaCrossChainPayment':
      return CONTRACT_ADDRESSES.ZETA.CROSS_CHAIN_PAYMENT;
    default:
      throw new Error(`Unknown contract: ${contract}`);
  }
}

// 获取网络配置
export function getNetworkConfig(network: NetworkName) {
  return NETWORK_CONFIG[network];
}

// 合约部署状态
export const DEPLOYMENT_STATUS = {
  WorkRegistry: {
    deployed: true,
    address: CONTRACT_ADDRESSES.SEPOLIA.WORK_REGISTRY,
    network: 'Sepolia',
    deployedAt: '2024-12-19',
    verified: true,
  },
  VotingSystem: {
    deployed: true,
    address: CONTRACT_ADDRESSES.SEPOLIA.VOTING_SYSTEM,
    network: 'Sepolia',
    deployedAt: '2024-12-19',
    verified: true,
  },
  CreationRightsNFT: {
    deployed: true,
    address: CONTRACT_ADDRESSES.SEPOLIA.CREATION_RIGHTS_NFT,
    network: 'Sepolia',
    deployedAt: '2024-12-19',
    verified: true,
  },
  ZetaCrossChainPayment: {
    deployed: false,
    address: '',
    network: 'ZetaChain Athens',
    deployedAt: '',
    verified: false,
  },
} as const;