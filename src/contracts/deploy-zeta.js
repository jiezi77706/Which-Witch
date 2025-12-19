#!/usr/bin/env node

const { ethers } = require('ethers');
require('dotenv').config();

// ZetaChain Athens 测试网配置
const ZETA_CONFIG = {
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  chainId: 7001,
  name: 'ZetaChain Athens Testnet',
  blockExplorer: 'https://athens3.zetachain.com',
  
  // ZetaChain官方合约地址 (Athens测试网)
  zetaConnector: '0x239e96c8f17C85c30100AC26F635Ea15f23E9c67', // 官方ZetaConnector地址
  
  // 测试用的ZRC20代币地址
  zrc20Tokens: {
    ETH: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921',
    BNB: '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb',
    MATIC: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921'
  }
};

// 合约ABI (简化版，仅用于部署)
const CONTRACT_ABI = [
  "constructor(address _zetaConnector)",
  "function configureChain(uint256 chainId, bool supported, address targetContract, uint256 minAmount, uint256 maxAmount) external",
  "function addZRC20Support(uint256 chainId, address zrc20Token, string memory symbol) external",
  "function initiateCrossChainTipZeta(address recipient, uint256 workId, uint256 targetChainId) external payable returns (uint256)",
  "function getPayment(uint256 paymentId) external view returns (tuple(uint256,address,address,uint256,uint8,uint256,uint256,uint256,string,bool,uint256))",
  "function owner() external view returns (address)"
];

async function deployZetaContract() {
  console.log('🚀 Starting ZetaCrossChainPayment deployment to ZetaChain Athens...\n');

  // 检查环境变量
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.log('💡 Please set PRIVATE_KEY in .env file');
    process.exit(1);
  }

  try {
    // 创建provider和wallet
    console.log('🌐 Connecting to ZetaChain Athens testnet...');
    const provider = new ethers.JsonRpcProvider(ZETA_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // 检查网络连接
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

    if (Number(network.chainId) !== ZETA_CONFIG.chainId) {
      console.error(`❌ Wrong network! Expected ${ZETA_CONFIG.chainId}, got ${network.chainId}`);
      process.exit(1);
    }

    // 检查余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Deployer address: ${wallet.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ZETA`);

    if (balance < ethers.parseEther('0.1')) {
      console.warn('⚠️  Low ZETA balance. Get testnet ZETA from: https://labs.zetachain.com/get-zeta');
    }

    // 读取合约字节码
    console.log('\n📄 Reading contract bytecode...');
    const fs = require('fs');
    const path = require('path');
    
    // 这里我们需要编译后的字节码，先创建一个简化的部署
    console.log('📝 Preparing contract deployment...');

    // 创建合约工厂
    const contractFactory = new ethers.ContractFactory(
      CONTRACT_ABI,
      "0x", // 这里需要实际的字节码，我们先用Foundry编译
      wallet
    );

    console.log('\n⚠️  Note: This script requires compiled bytecode.');
    console.log('Please run the following commands first:');
    console.log('');
    console.log('1. Install Foundry (if not installed):');
    console.log('   curl -L https://foundry.paradigm.xyz | bash');
    console.log('   foundryup');
    console.log('');
    console.log('2. Compile the contract:');
    console.log('   cd src/contracts');
    console.log('   forge build');
    console.log('');
    console.log('3. Deploy using Foundry:');
    console.log(`   forge create --rpc-url ${ZETA_CONFIG.rpcUrl} \\`);
    console.log('     --private-key $PRIVATE_KEY \\');
    console.log('     src/ZetaCrossChainPayment.sol:ZetaCrossChainPayment \\');
    console.log(`     --constructor-args ${ZETA_CONFIG.zetaConnector}`);

    return {
      success: false,
      message: 'Please use Foundry for deployment (see instructions above)'
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 配置已部署的合约
async function configureDeployedContract(contractAddress) {
  console.log(`\n🔧 Configuring deployed contract at ${contractAddress}...`);

  try {
    const provider = new ethers.JsonRpcProvider(ZETA_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    console.log('⚙️  Configuring supported chains...');

    // 配置支持的链
    const chains = [
      { id: 1, name: 'Ethereum', minAmount: '0.001', maxAmount: '100' },
      { id: 56, name: 'BSC', minAmount: '0.001', maxAmount: '100' },
      { id: 137, name: 'Polygon', minAmount: '0.001', maxAmount: '100' },
      { id: 8453, name: 'Base', minAmount: '0.001', maxAmount: '100' },
      { id: 11155111, name: 'Sepolia', minAmount: '0.001', maxAmount: '100' }
    ];

    for (const chain of chains) {
      console.log(`   Configuring ${chain.name} (${chain.id})...`);
      const tx = await contract.configureChain(
        chain.id,
        true, // supported
        ethers.ZeroAddress, // no target contract
        ethers.parseEther(chain.minAmount),
        ethers.parseEther(chain.maxAmount)
      );
      await tx.wait();
      console.log(`   ✅ ${chain.name} configured`);
    }

    console.log('\n⚙️  Adding ZRC20 token support...');

    // 添加ZRC20代币支持
    const tokens = [
      { chainId: 1, address: ZETA_CONFIG.zrc20Tokens.ETH, symbol: 'ETH' },
      { chainId: 56, address: ZETA_CONFIG.zrc20Tokens.BNB, symbol: 'BNB' },
      { chainId: 137, address: ZETA_CONFIG.zrc20Tokens.MATIC, symbol: 'MATIC' },
      { chainId: 11155111, address: ZETA_CONFIG.zrc20Tokens.ETH, symbol: 'ETH' }
    ];

    for (const token of tokens) {
      console.log(`   Adding ${token.symbol} support for chain ${token.chainId}...`);
      const tx = await contract.addZRC20Support(
        token.chainId,
        token.address,
        token.symbol
      );
      await tx.wait();
      console.log(`   ✅ ${token.symbol} support added`);
    }

    console.log('\n🎉 Contract configuration completed!');
    return { success: true };

  } catch (error) {
    console.error('❌ Configuration failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 测试已部署的合约
async function testDeployedContract(contractAddress) {
  console.log(`\n🧪 Testing deployed contract at ${contractAddress}...`);

  try {
    const provider = new ethers.JsonRpcProvider(ZETA_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    // 检查合约所有者
    const owner = await contract.owner();
    console.log(`📋 Contract owner: ${owner}`);
    console.log(`📋 Deployer address: ${wallet.address}`);
    console.log(`📋 Owner match: ${owner.toLowerCase() === wallet.address.toLowerCase()}`);

    // 测试跨链支付功能 (小额测试)
    console.log('\n🔄 Testing cross-chain tip functionality...');
    
    const testAmount = ethers.parseEther('0.001'); // 0.001 ZETA
    const testRecipient = wallet.address; // 发送给自己进行测试
    const testWorkId = 1;
    const testTargetChain = 11155111; // Sepolia

    console.log(`   Sending ${ethers.formatEther(testAmount)} ZETA to ${testRecipient}`);
    console.log(`   Work ID: ${testWorkId}, Target Chain: ${testTargetChain}`);

    const tx = await contract.initiateCrossChainTipZeta(
      testRecipient,
      testWorkId,
      testTargetChain,
      { value: testAmount }
    );

    console.log(`   Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // 获取支付信息
    const paymentId = 1; // 第一笔支付
    try {
      const payment = await contract.getPayment(paymentId);
      console.log(`   📋 Payment ID: ${payment[0]}`);
      console.log(`   📋 Sender: ${payment[1]}`);
      console.log(`   📋 Recipient: ${payment[2]}`);
      console.log(`   📋 Amount: ${ethers.formatEther(payment[3])} ZETA`);
      console.log(`   📋 Completed: ${payment[9]}`);
    } catch (error) {
      console.log(`   ⚠️  Could not fetch payment info: ${error.message}`);
    }

    console.log('\n🎉 Contract test completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ Contract test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const contractAddress = args[1];

  switch (command) {
    case 'deploy':
      await deployZetaContract();
      break;
    
    case 'configure':
      if (!contractAddress) {
        console.error('❌ Contract address required for configure command');
        console.log('Usage: node deploy-zeta.js configure <CONTRACT_ADDRESS>');
        process.exit(1);
      }
      await configureDeployedContract(contractAddress);
      break;
    
    case 'test':
      if (!contractAddress) {
        console.error('❌ Contract address required for test command');
        console.log('Usage: node deploy-zeta.js test <CONTRACT_ADDRESS>');
        process.exit(1);
      }
      await testDeployedContract(contractAddress);
      break;
    
    default:
      console.log('ZetaChain Contract Deployment Tool\n');
      console.log('Usage:');
      console.log('  node deploy-zeta.js deploy                    - Show deployment instructions');
      console.log('  node deploy-zeta.js configure <ADDRESS>       - Configure deployed contract');
      console.log('  node deploy-zeta.js test <ADDRESS>            - Test deployed contract');
      console.log('\nEnvironment variables required:');
      console.log('  PRIVATE_KEY - Your wallet private key');
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  deployZetaContract,
  configureDeployedContract,
  testDeployedContract,
  ZETA_CONFIG
};