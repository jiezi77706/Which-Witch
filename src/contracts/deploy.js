const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 网络配置
const networks = {
  zetaTestnet: {
    name: 'ZetaChain Athens Testnet',
    chainId: 7001,
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    zetaConnector: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
  },
  zetaMainnet: {
    name: 'ZetaChain Mainnet',
    chainId: 7000,
    rpcUrl: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    zetaConnector: '0x0000000000000000000000000000000000000000' // 需要更新
  }
};

// 合约ABI和字节码（需要编译后填入）
const contractABI = [
  // 这里需要填入编译后的ABI
];

const contractBytecode = "0x"; // 这里需要填入编译后的字节码

async function deployContract(networkName, privateKey) {
  const network = networks[networkName];
  if (!network) {
    throw new Error(`Unknown network: ${networkName}`);
  }

  console.log(`🚀 Deploying to ${network.name}...`);
  console.log(`📡 RPC URL: ${network.rpcUrl}`);
  console.log(`🔗 Chain ID: ${network.chainId}`);

  // 创建provider和wallet
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`👤 Deployer address: ${wallet.address}`);

  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error('Insufficient balance for deployment');
  }

  // 创建合约工厂
  const contractFactory = new ethers.ContractFactory(
    contractABI,
    contractBytecode,
    wallet
  );

  // 部署合约
  console.log('📦 Deploying contract...');
  const contract = await contractFactory.deploy(network.zetaConnector);
  
  console.log(`⏳ Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ Contract deployed successfully!`);
  console.log(`📍 Contract address: ${contractAddress}`);

  // 验证部署
  console.log('🔍 Verifying deployment...');
  const owner = await contract.owner();
  const zetaConnector = await contract.zetaConnector();
  const platformFeeRate = await contract.platformFeeRate();

  console.log(`👤 Owner: ${owner}`);
  console.log(`🔗 ZetaConnector: ${zetaConnector}`);
  console.log(`💰 Platform Fee Rate: ${platformFeeRate} basis points`);

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress,
    deployerAddress: wallet.address,
    transactionHash: contract.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    owner,
    zetaConnector,
    platformFeeRate: platformFeeRate.toString()
  };

  const deploymentFile = `deployment-${networkName}-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  return contractAddress;
}

// 配置合约
async function configureContract(contractAddress, networkName, privateKey) {
  const network = networks[networkName];
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  console.log('⚙️ Configuring contract...');

  // 配置支持的链
  const chains = [
    { chainId: 1, name: 'Ethereum', minAmount: ethers.parseEther('0.001'), maxAmount: ethers.parseEther('100') },
    { chainId: 56, name: 'BSC', minAmount: ethers.parseEther('0.001'), maxAmount: ethers.parseEther('100') },
    { chainId: 137, name: 'Polygon', minAmount: ethers.parseEther('0.001'), maxAmount: ethers.parseEther('100') },
    { chainId: 8453, name: 'Base', minAmount: ethers.parseEther('0.001'), maxAmount: ethers.parseEther('100') },
    { chainId: 11155111, name: 'Sepolia', minAmount: ethers.parseEther('0.001'), maxAmount: ethers.parseEther('100') }
  ];

  for (const chain of chains) {
    console.log(`🔧 Configuring ${chain.name} (${chain.chainId})...`);
    const tx = await contract.configureChain(
      chain.chainId,
      true,
      ethers.ZeroAddress, // 暂时设为零地址
      chain.minAmount,
      chain.maxAmount
    );
    await tx.wait();
    console.log(`✅ ${chain.name} configured`);
  }

  // 配置币种
  const currencies = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'MATIC'];
  for (const currency of currencies) {
    console.log(`💱 Configuring currency: ${currency}...`);
    const tx = await contract.configureCurrency(currency, true);
    await tx.wait();
    console.log(`✅ ${currency} configured`);
  }

  console.log('✅ Contract configuration completed!');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const networkName = args[1] || 'zetaTestnet';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'deploy':
        const contractAddress = await deployContract(networkName, privateKey);
        console.log(`\n🎉 Deployment completed!`);
        console.log(`📋 Next steps:`);
        console.log(`   1. Save the contract address: ${contractAddress}`);
        console.log(`   2. Run configuration: node deploy.js configure ${networkName}`);
        console.log(`   3. Verify on block explorer`);
        break;

      case 'configure':
        const address = process.env.CONTRACT_ADDRESS;
        if (!address) {
          console.error('❌ Error: CONTRACT_ADDRESS environment variable not set');
          process.exit(1);
        }
        await configureContract(address, networkName, privateKey);
        break;

      default:
        console.log('Usage:');
        console.log('  node deploy.js deploy [network]     - Deploy contract');
        console.log('  node deploy.js configure [network]  - Configure contract');
        console.log('');
        console.log('Networks: zetaTestnet, zetaMainnet');
        console.log('');
        console.log('Environment variables:');
        console.log('  PRIVATE_KEY        - Your wallet private key');
        console.log('  CONTRACT_ADDRESS   - Contract address (for configure command)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployContract, configureContract };