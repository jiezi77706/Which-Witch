#!/usr/bin/env node

/**
 * 简化的 ZetaChain 跨链支付测试
 * 只需要 ZETA 测试币和 Sepolia 测试币
 * 
 * 使用方法:
 * 1. 确保钱包有 ZETA 测试币
 * 2. 确保钱包有 Sepolia ETH
 * 3. 运行: node scripts/simple-zeta-test.js
 */

const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

// 配置
const ZETA_RPC_URL = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg'

// 简化的合约 ABI
const SIMPLE_ABI = [
  "function owner() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)"
]

console.log('🧪 开始简化的跨链支付测试...\n')

async function testNetworkConnectivity() {
  console.log('🌐 测试网络连接...')
  
  try {
    // 测试 ZetaChain 连接
    const zetaProvider = new ethers.JsonRpcProvider(ZETA_RPC_URL)
    const zetaNetwork = await zetaProvider.getNetwork()
    const zetaBlockNumber = await zetaProvider.getBlockNumber()
    
    console.log('✅ ZetaChain Athens 测试网:')
    console.log(`   链ID: ${zetaNetwork.chainId}`)
    console.log(`   当前区块: ${zetaBlockNumber}`)
    
    // 测试 Sepolia 连接
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
    const sepoliaNetwork = await sepoliaProvider.getNetwork()
    const sepoliaBlockNumber = await sepoliaProvider.getBlockNumber()
    
    console.log('✅ Sepolia 测试网:')
    console.log(`   链ID: ${sepoliaNetwork.chainId}`)
    console.log(`   当前区块: ${sepoliaBlockNumber}`)
    console.log()
    
    return { zetaProvider, sepoliaProvider }
    
  } catch (error) {
    console.error('❌ 网络连接失败:', error.message)
    throw error
  }
}

async function checkWalletBalance(address) {
  console.log('💰 检查钱包余额...')
  
  if (!address) {
    console.log('⚠️  未提供钱包地址，跳过余额检查')
    console.log('💡 提示: 设置 WALLET_ADDRESS 环境变量来检查余额')
    return
  }
  
  try {
    const zetaProvider = new ethers.JsonRpcProvider(ZETA_RPC_URL)
    const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
    
    // 检查 ZETA 余额
    const zetaBalance = await zetaProvider.getBalance(address)
    console.log(`✅ ZetaChain 余额: ${ethers.formatEther(zetaBalance)} ZETA`)
    
    // 检查 Sepolia ETH 余额
    const sepoliaBalance = await sepoliaProvider.getBalance(address)
    console.log(`✅ Sepolia 余额: ${ethers.formatEther(sepoliaBalance)} ETH`)
    
    // 检查是否有足够的测试币
    const minZeta = ethers.parseEther('0.1')
    const minSepolia = ethers.parseEther('0.01')
    
    if (zetaBalance < minZeta) {
      console.log('⚠️  ZETA 余额不足，建议至少 0.1 ZETA')
      console.log('🔗 获取 ZETA: https://labs.zetachain.com/get-zeta')
    }
    
    if (sepoliaBalance < minSepolia) {
      console.log('⚠️  Sepolia ETH 余额不足，建议至少 0.01 ETH')
      console.log('🔗 获取 Sepolia ETH: https://sepoliafaucet.com/')
    }
    
    console.log()
    
  } catch (error) {
    console.error('❌ 检查余额失败:', error.message)
  }
}

async function testZRC20Tokens() {
  console.log('🪙 测试 ZRC-20 代币...')
  
  try {
    const provider = new ethers.JsonRpcProvider(ZETA_RPC_URL)
    
    // ZetaChain Athens 测试网的 ZRC-20 代币地址
    const zrc20Tokens = {
      'ETH.ETH': '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921',
      'BNB.BSC': '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb',
      'BTC.BTC': '0x13A0c5930C028511Dc02665E7285134B6d11A5f4'
    }
    
    console.log('✅ ZRC-20 代币状态:')
    
    for (const [symbol, address] of Object.entries(zrc20Tokens)) {
      try {
        const contract = new ethers.Contract(address, [
          "function symbol() view returns (string)",
          "function totalSupply() view returns (uint256)",
          "function decimals() view returns (uint8)"
        ], provider)
        
        const tokenSymbol = await contract.symbol()
        const decimals = await contract.decimals()
        const totalSupply = await contract.totalSupply()
        
        console.log(`   ${symbol}:`)
        console.log(`     地址: ${address}`)
        console.log(`     符号: ${tokenSymbol}`)
        console.log(`     小数位: ${decimals}`)
        console.log(`     总供应量: ${ethers.formatUnits(totalSupply, decimals)}`)
        console.log()
        
      } catch (error) {
        console.log(`   ${symbol}: ❌ 无法获取信息 (${error.message})`)
      }
    }
    
  } catch (error) {
    console.error('❌ 测试 ZRC-20 代币失败:', error.message)
  }
}

async function simulateCrossChainFlow() {
  console.log('🔄 模拟跨链支付流程...')
  
  console.log('📝 跨链支付步骤:')
  console.log('   1. 用户在 ZetaChain 上发起跨链支付')
  console.log('   2. 选择目标链: Sepolia')
  console.log('   3. 选择支付金额: 0.01 ZETA')
  console.log('   4. ZetaChain 处理跨链消息')
  console.log('   5. Sepolia 接收支付并分配给创作者')
  console.log()
  
  console.log('💡 实际测试需要:')
  console.log('   - 部署 ZetaChain 跨链支付合约')
  console.log('   - 部署 Sepolia 接收合约')
  console.log('   - 配置跨链消息传递')
  console.log()
}

function showTestingGuide() {
  console.log('📖 手动测试指南:')
  console.log()
  
  console.log('🔧 1. 准备环境:')
  console.log('   - 在 MetaMask 中添加 ZetaChain Athens 测试网')
  console.log('   - 确保有 ZETA 测试币 (至少 0.1 ZETA)')
  console.log('   - 确保有 Sepolia ETH (至少 0.01 ETH)')
  console.log()
  
  console.log('🌐 2. 网络配置:')
  console.log('   ZetaChain Athens:')
  console.log('   - 链ID: 7001')
  console.log('   - RPC: https://zetachain-athens-evm.blockpi.network/v1/rpc/public')
  console.log('   - 浏览器: https://zetachain-athens-3.blockscout.com')
  console.log()
  
  console.log('🧪 3. 简单测试方法:')
  console.log('   a) 使用现有的 WhichWitch 合约:')
  console.log('      - 在 Sepolia 上创建作品')
  console.log('      - 尝试从 ZetaChain 发起打赏')
  console.log()
  console.log('   b) 使用 ZetaChain 官方示例:')
  console.log('      - 访问 ZetaChain 官方测试 dApp')
  console.log('      - 测试跨链转账功能')
  console.log()
  
  console.log('🔗 有用的链接:')
  console.log('   - ZETA 水龙头: https://labs.zetachain.com/get-zeta')
  console.log('   - Sepolia 水龙头: https://sepoliafaucet.com/')
  console.log('   - ZetaChain 文档: https://docs.zetachain.com')
  console.log('   - ZetaChain 示例: https://labs.zetachain.com/')
  console.log()
}

function showQuickDeployGuide() {
  console.log('🚀 快速部署指南:')
  console.log()
  
  console.log('如果你想部署自己的跨链支付合约:')
  console.log()
  
  console.log('1. 设置环境变量:')
  console.log('   export PRIVATE_KEY=你的私钥')
  console.log('   export WALLET_ADDRESS=你的钱包地址')
  console.log()
  
  console.log('2. 安装 Foundry:')
  console.log('   curl -L https://foundry.paradigm.xyz | bash')
  console.log('   foundryup')
  console.log()
  
  console.log('3. 部署合约:')
  console.log('   cd src/contracts')
  console.log('   forge build')
  console.log('   forge script script/DeployZetaPayment.s.sol --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public --private-key $PRIVATE_KEY --broadcast')
  console.log()
  
  console.log('4. 测试合约:')
  console.log('   forge test')
  console.log()
}

async function main() {
  try {
    // 获取钱包地址（如果提供）
    const walletAddress = process.env.WALLET_ADDRESS
    
    await testNetworkConnectivity()
    await checkWalletBalance(walletAddress)
    await testZRC20Tokens()
    await simulateCrossChainFlow()
    
    showTestingGuide()
    showQuickDeployGuide()
    
    console.log('🎉 测试完成!')
    console.log()
    console.log('💡 下一步:')
    console.log('   1. 确保钱包有足够的测试币')
    console.log('   2. 在 MetaMask 中添加 ZetaChain 网络')
    console.log('   3. 访问 ZetaChain 官方测试应用体验跨链功能')
    console.log('   4. 或者部署自己的跨链支付合约')
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  main()
}

module.exports = { main }