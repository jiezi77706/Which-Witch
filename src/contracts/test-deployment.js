#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

// 网络配置
const networks = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    chainId: 11155111
  },
  zetaTestnet: {
    rpc: process.env.ZETA_TESTNET_RPC || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    chainId: 7001
  }
};

// 合约 ABI (简化版本，仅用于测试)
const contractABIs = {
  WorkRegistry: [
    "constructor()",
    "function createWork(string memory metadataURI, uint256 licenseFee, bool allowRemix, uint256 parentWorkId) external returns (uint256)",
    "function getWork(uint256 workId) external view returns (tuple(uint256,address,uint8,uint256,string,uint256,bool,uint256,bool))",
    "function totalWorks() external view returns (uint256)"
  ],
  CreationRightsNFT: [
    "constructor(address _workRegistry)",
    "function mintWorkNFT(uint256 workId) external returns (uint256)",
    "function getWorkNFTId(uint256 workId) external view returns (uint256)"
  ],
  VotingSystem: [
    "constructor(address _workRegistry)",
    "function createVoting(uint256 workId, string memory title, string memory description, uint8 votingType, string[] memory options, uint256 duration, uint256 minStakeAmount) external returns (uint256)",
    "function vote(uint256 votingId, uint256 optionId) external payable"
  ],
  ZetaCrossChainPayment: [
    "constructor(address _zetaConnector)",
    "function initiateCrossChainTipZeta(address recipient, uint256 workId, uint256 targetChainId) external payable returns (uint256)",
    "function getPlatformBalance(string memory currency) external view returns (uint256)"
  ]
};

async function testDeployment() {
  console.log('🚀 Starting contract deployment test...\n');

  // 检查环境变量
  if (!process.env.PRIVATE_KEY) {
    console.log('❌ PRIVATE_KEY not found in environment variables');
    console.log('💡 Please set PRIVATE_KEY in .env file');
    return;
  }

  try {
    // 测试网络连接
    console.log('🌐 Testing network connections...');
    
    const sepoliaProvider = new ethers.JsonRpcProvider(networks.sepolia.rpc);
    const zetaProvider = new ethers.JsonRpcProvider(networks.zetaTestnet.rpc);
    
    const sepoliaNetwork = await sepoliaProvider.getNetwork();
    const zetaNetwork = await zetaProvider.getNetwork();
    
    console.log(`✅ Sepolia connected - Chain ID: ${sepoliaNetwork.chainId}`);
    console.log(`✅ ZetaChain connected - Chain ID: ${zetaNetwork.chainId}\n`);

    // 创建钱包
    const sepoliaWallet = new ethers.Wallet(process.env.PRIVATE_KEY, sepoliaProvider);
    const zetaWallet = new ethers.Wallet(process.env.PRIVATE_KEY, zetaProvider);

    // 检查余额
    const sepoliaBalance = await sepoliaProvider.getBalance(sepoliaWallet.address);
    const zetaBalance = await zetaProvider.getBalance(zetaWallet.address);

    console.log('💰 Wallet balances:');
    console.log(`Sepolia: ${ethers.formatEther(sepoliaBalance)} ETH`);
    console.log(`ZetaChain: ${ethers.formatEther(zetaBalance)} ZETA\n`);

    if (sepoliaBalance < ethers.parseEther('0.01')) {
      console.log('⚠️  Low Sepolia ETH balance. Get testnet ETH from: https://sepoliafaucet.com/');
    }

    if (zetaBalance < ethers.parseEther('0.01')) {
      console.log('⚠️  Low ZetaChain balance. Get testnet ZETA from: https://labs.zetachain.com/get-zeta');
    }

    console.log('\n📋 Deployment Summary:');
    console.log('Ready to deploy:');
    console.log('- WorkRegistry → Sepolia');
    console.log('- CreationRightsNFT → Sepolia');  
    console.log('- VotingSystem → Sepolia');
    console.log('- ZetaCrossChainPayment → ZetaChain');

    console.log('\n🔧 Next steps:');
    console.log('1. Run: forge build (to compile contracts)');
    console.log('2. Run deployment scripts for each network');
    console.log('3. Configure contract interactions');
    console.log('4. Run functional tests');

    console.log('\n✅ Pre-deployment checks completed successfully!');

  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
    
    if (error.message.includes('network')) {
      console.log('💡 Check your RPC URLs and network connectivity');
    }
    
    if (error.message.includes('private key')) {
      console.log('💡 Check your PRIVATE_KEY format (should start with 0x)');
    }
  }
}

// 运行测试
testDeployment().catch(console.error);