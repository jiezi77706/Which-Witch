#!/usr/bin/env node

/**
 * 使用现有 ZETA 和 Sepolia 测试币进行跨链测试
 * 不需要部署新合约，使用 ZetaChain 官方的测试功能
 */

const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

console.log('🎯 使用现有测试币进行跨链测试\n')

async function testZetaChainOfficialExample() {
  console.log('🔗 ZetaChain 官方跨链测试')
  console.log()
  
  console.log('📋 你可以使用以下方法测试跨链功能:')
  console.log()
  
  console.log('方法 1: 使用 ZetaChain Labs 官方测试应用')
  console.log('   1. 访问: https://labs.zetachain.com/')
  console.log('   2. 连接你的 MetaMask 钱包')
  console.log('   3. 选择 "Cross-Chain Swap" 或 "Cross-Chain Transfer"')
  console.log('   4. 从 ZetaChain 向 Sepolia 发送测试交易')
  console.log()
  
  console.log('方法 2: 使用 ZetaChain 官方跨链桥')
  console.log('   1. 访问: https://hub.zetachain.com/')
  console.log('   2. 选择 "Bridge" 功能')
  console.log('   3. 从 ZetaChain 桥接到 Sepolia')
  console.log('   4. 观察跨链交易过程')
  console.log()
  
  console.log('方法 3: 直接与 ZRC-20 代币交互')
  console.log('   1. 在 ZetaChain 上找到 ETH.SEP ZRC-20 代币')
  console.log('   2. 使用 withdraw() 函数发送到 Sepolia')
  console.log('   3. 监控 Sepolia 上的接收情况')
  console.log()
}

async function showZRC20WithdrawExample() {
  console.log('💡 ZRC-20 代币 withdraw 示例')
  console.log()
  
  const zrc20Address = '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' // ETH.SEP
  const zetaRpcUrl = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
  
  console.log('如果你有编程经验，可以直接调用 ZRC-20 合约:')
  console.log()
  console.log(`ZRC-20 ETH.SEP 合约地址: ${zrc20Address}`)
  console.log()
  console.log('使用 cast 命令行工具:')
  console.log(`cast call ${zrc20Address} "balanceOf(address)" 你的钱包地址 --rpc-url ${zetaRpcUrl}`)
  console.log()
  console.log('或者使用 ethers.js:')
  console.log(`
const provider = new ethers.JsonRpcProvider('${zetaRpcUrl}')
const contract = new ethers.Contract('${zrc20Address}', [
  "function balanceOf(address) view returns (uint256)",
  "function withdraw(bytes, uint256) returns (bool)"
], provider)

// 查询余额
const balance = await contract.balanceOf('你的钱包地址')
console.log('ZRC-20 ETH 余额:', ethers.formatEther(balance))

// 提取到 Sepolia (需要私钥签名)
// const signer = new ethers.Wallet('你的私钥', provider)
// const contractWithSigner = contract.connect(signer)
// await contractWithSigner.withdraw('0x你的Sepolia地址', ethers.parseEther('0.001'))
`)
  console.log()
}

async function checkCurrentBalances() {
  console.log('💰 检查当前余额状态')
  
  const walletAddress = process.env.WALLET_ADDRESS
  if (!walletAddress) {
    console.log('⚠️  请设置 WALLET_ADDRESS 环境变量来检查余额')
    console.log('   export WALLET_ADDRESS=0x你的钱包地址')
    return
  }
  
  try {
    // ZetaChain 原生 ZETA 余额
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public')
    const zetaBalance = await zetaProvider.getBalance(walletAddress)
    console.log(`✅ ZetaChain ZETA 余额: ${ethers.formatEther(zetaBalance)}`)
    
    // Sepolia ETH 余额
    const sepoliaProvider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg')
    const sepoliaBalance = await sepoliaProvider.getBalance(walletAddress)
    console.log(`✅ Sepolia ETH 余额: ${ethers.formatEther(sepoliaBalance)}`)
    
    // ZRC-20 ETH.SEP 余额
    const zrc20Address = '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921'
    const zrc20Contract = new ethers.Contract(zrc20Address, [
      "function balanceOf(address) view returns (uint256)"
    ], zetaProvider)
    
    const zrc20Balance = await zrc20Contract.balanceOf(walletAddress)
    console.log(`✅ ZRC-20 ETH.SEP 余额: ${ethers.formatEther(zrc20Balance)}`)
    
    console.log()
    
    // 给出建议
    if (zetaBalance > ethers.parseEther('0.01')) {
      console.log('🎉 你有足够的 ZETA 代币进行跨链测试!')
    } else {
      console.log('⚠️  建议获取更多 ZETA 代币: https://labs.zetachain.com/get-zeta')
    }
    
    if (sepoliaBalance > ethers.parseEther('0.001')) {
      console.log('🎉 你有足够的 Sepolia ETH!')
    } else {
      console.log('⚠️  建议获取更多 Sepolia ETH: https://sepoliafaucet.com/')
    }
    
  } catch (error) {
    console.error('❌ 检查余额失败:', error.message)
  }
}

async function showMetaMaskSetup() {
  console.log('🦊 MetaMask 网络配置')
  console.log()
  
  console.log('添加 ZetaChain Athens 测试网到 MetaMask:')
  console.log('   网络名称: ZetaChain Athens Testnet')
  console.log('   RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public')
  console.log('   链ID: 7001')
  console.log('   货币符号: ZETA')
  console.log('   区块浏览器: https://zetachain-athens-3.blockscout.com')
  console.log()
  
  console.log('或者点击这个链接自动添加:')
  console.log('https://chainlist.org/chain/7001')
  console.log()
}

async function showSimpleTestSteps() {
  console.log('🧪 简单测试步骤')
  console.log()
  
  console.log('步骤 1: 准备环境')
  console.log('   ✅ 你已经有 ZETA 测试币')
  console.log('   ✅ 你已经有 Sepolia 测试币')
  console.log('   🔄 在 MetaMask 中添加 ZetaChain 网络')
  console.log()
  
  console.log('步骤 2: 体验官方跨链功能')
  console.log('   1. 访问 https://labs.zetachain.com/')
  console.log('   2. 连接钱包并切换到 ZetaChain')
  console.log('   3. 尝试 "Cross-Chain Transfer" 功能')
  console.log('   4. 从 ZetaChain 发送少量代币到 Sepolia')
  console.log()
  
  console.log('步骤 3: 监控交易')
  console.log('   1. 在 ZetaChain 浏览器查看发送交易')
  console.log('   2. 在 Sepolia 浏览器查看接收交易')
  console.log('   3. 观察跨链处理时间 (通常 1-3 分钟)')
  console.log()
  
  console.log('步骤 4: 集成到你的应用')
  console.log('   1. 理解跨链流程后，可以集成到 WhichWitch')
  console.log('   2. 使用相同的 ZRC-20 withdraw 机制')
  console.log('   3. 为用户提供跨链打赏功能')
  console.log()
}

async function main() {
  console.log('🎯 目标: 使用现有的 ZETA 和 Sepolia 测试币体验跨链功能\n')
  
  await showMetaMaskSetup()
  await checkCurrentBalances()
  await testZetaChainOfficialExample()
  await showZRC20WithdrawExample()
  await showSimpleTestSteps()
  
  console.log('🎉 测试指南完成!')
  console.log()
  console.log('💡 推荐的测试顺序:')
  console.log('   1. 配置 MetaMask 网络')
  console.log('   2. 访问 ZetaChain Labs 官方测试应用')
  console.log('   3. 体验跨链转账功能')
  console.log('   4. 理解流程后集成到你的项目')
  console.log()
  console.log('🆘 如果遇到问题:')
  console.log('   - 检查网络连接和 RPC 状态')
  console.log('   - 确保钱包有足够的 gas 费')
  console.log('   - 查看 ZetaChain 官方文档')
  console.log('   - 在 Discord 社区寻求帮助')
}

if (require.main === module) {
  main()
}

module.exports = { main }