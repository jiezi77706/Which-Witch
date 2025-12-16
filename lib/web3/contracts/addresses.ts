// 智能合约地址配置
export const CONTRACT_ADDRESSES = {
  // v1.0 合约
  creation: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION as `0x${string}`,
  payment: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT as `0x${string}`,
  authorization: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION as `0x${string}`,
  
  // v2.0 NFT 相关合约
  nftManager: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MANAGER as `0x${string}`,
  nftMarketplace: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MARKETPLACE as `0x${string}`,
  royaltyManager: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROYALTY_MANAGER as `0x${string}`,
  
  // ZetaChain 跨链支付
  zetaPaymentManager: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ZETA_PAYMENT as `0x${string}`,
} as const;

export const CHAIN_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
  networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org',
} as const;
