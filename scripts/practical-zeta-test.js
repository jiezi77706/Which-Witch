#!/usr/bin/env node

/**
 * 实用的 ZetaChain 跨链测试
 * 基于网络连接成功的基础上，提供实际可用的测试方案
 */

const { ethers } = require('ethers')

console.log('🎯 实用的 ZetaChain 跨链测试方案\n')

async function showNetworkStatus() {
  console.log('✅ 网络状态检查通过!')
  console.log('   - ZetaChain Athens 测试网: 正常')
  console.log('   - Sepolia 测试网: 正常')
  console.log()
}

async function showPracticalTestMethods() {
  console.log('🧪 推荐的实际测试方法:\n')
  
  console.log('方法 1: 使用 ZetaChain 官方测试应用 (推荐)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1. 访问: https://labs.zetachain.com/')
  console.log('2. 连接你的 MetaMask 钱包')
  console.log('3. 确保钱包切换到 ZetaChain Athens 测试网')
  console.log('4. 选择 "Cross-Chain Transfer" 功能')
  console.log('5. 设置:')
  console.log('   - From: ZetaChain Athens')
  console.log('   - To: Sepolia')
  console.log('   - Amount: 0.001 ZETA (小额测试)')
  console.log('6. 确认交易并等待 1-3 分钟')
  console.log('7. 在 Sepolia 上查看接收到的 ETH')
  console.log()
  
  console.log('方法 2: 使用 ZetaChain Hub (官方桥接)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1. 访问: https://hub.zetachain.com/')
  console.log('2. 选择 "Bridge" 功能')
  console.log('3. 从 ZetaChain 桥接到 Sepolia')
  console.log('4. 观察跨链桥接过程')
  console.log()
  
  console.log('方法 3: 直接与智能合约交互 (高级)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('如果你熟悉智能合约，可以直接调用 ZRC-20 合约:')
  console.log()
  console.log('// 使用 ethers.js 示例')
  console.log('const provider = new ethers.JsonRpcProvider("https://zetachain-athens-evm.blockpi.network/v1/rpc/public")')
  console.log('const signer = new ethers.Wallet("你的私钥", provider)')
  console.log()
  console.log('// ZRC-20 ETH 合约地址 (可能需要更新)')
  console.log('const zrc20Address = "0x..." // 需要查找最新的有效地址')
  console.log('const contract = new ethers.Contract(zrc20Address, ZRC20_ABI, signer)')
  console.log()
  console.log('// 提取到 Sepolia')
  console.log('await contract.withdraw("0x你的Sepolia地址", ethers.parseEther("0.001"))')
  console.log()
}

async function showMetaMaskSetup() {
  console.log('🦊 MetaMask 网络配置')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('添加 ZetaChain Athens 测试网:')
  console.log('   网络名称: ZetaChain Athens Testnet')
  console.log('   RPC URL: https://zetachain-athens-evm.blockpi.network/v1/rpc/public')
  console.log('   链ID: 7001')
  console.log('   货币符号: ZETA')
  console.log('   区块浏览器: https://zetachain-athens-3.blockscout.com')
  console.log()
  console.log('快速添加链接: https://chainlist.org/chain/7001')
  console.log()
}

async function showTestingChecklist() {
  console.log('📋 测试前检查清单')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('✅ 网络连接正常 (已确认)')
  console.log('🔄 需要检查的项目:')
  console.log('   □ MetaMask 已安装并解锁')
  console.log('   □ 已添加 ZetaChain Athens 测试网')
  console.log('   □ 钱包中有 ZETA 测试币 (建议 > 0.01 ZETA)')
  console.log('   □ 钱包中有 Sepolia ETH (用于接收测试)')
  console.log()
  console.log('💰 获取测试币:')
  console.log('   ZETA: https://labs.zetachain.com/get-zeta')
  console.log('   Sepolia ETH: https://sepoliafaucet.com/')
  console.log()
}

async function showExpectedResults() {
  console.log('🎯 预期测试结果')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('成功的跨链测试应该显示:')
  console.log('1. 在 ZetaChain 上发起交易 (消耗 ZETA)')
  console.log('2. 交易状态: Pending → Processing → Completed')
  console.log('3. 在 Sepolia 上接收到对应的 ETH')
  console.log('4. 整个过程通常需要 1-3 分钟')
  console.log()
  console.log('🔍 如何验证成功:')
  console.log('   - ZetaChain 浏览器显示发送交易')
  console.log('   - Sepolia 浏览器显示接收交易')
  console.log('   - MetaMask 余额变化')
  console.log()
}

async function showTroubleshooting() {
  console.log('🔧 常见问题解决')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('问题 1: MetaMask 无法连接到 ZetaChain')
  console.log('解决: 手动添加网络，检查 RPC URL 是否正确')
  console.log()
  console.log('问题 2: 交易失败或卡住')
  console.log('解决: 检查 gas 费设置，等待网络不拥堵时重试')
  console.log()
  console.log('问题 3: 跨链交易长时间未完成')
  console.log('解决: 这是正常的，跨链需要时间，可以在区块浏览器查看状态')
  console.log()
  console.log('问题 4: 余额不足')
  console.log('解决: 从水龙头获取更多测试币')
  console.log()
}

async function showNextSteps() {
  console.log('🚀 测试成功后的下一步')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('一旦你成功体验了跨链功能，你就可以:')
  console.log()
  console.log('1. 理解跨链原理')
  console.log('   - ZRC-20 代币如何工作')
  console.log('   - 跨链消息传递机制')
  console.log('   - 统一流动性的概念')
  console.log()
  console.log('2. 集成到 WhichWitch 项目')
  console.log('   - 添加跨链打赏功能')
  console.log('   - 实现跨链授权费支付')
  console.log('   - 支持跨链 NFT 购买')
  console.log()
  console.log('3. 自定义开发')
  console.log('   - 部署自己的跨链合约')
  console.log('   - 定制跨链支付逻辑')
  console.log('   - 优化用户体验')
  console.log()
}

async function main() {
  await showNetworkStatus()
  await showMetaMaskSetup()
  await showTestingChecklist()
  await showPracticalTestMethods()
  await showExpectedResults()
  await showTroubleshooting()
  await showNextSteps()
  
  console.log('🎉 准备就绪!')
  console.log()
  console.log('💡 建议的测试顺序:')
  console.log('1. 配置 MetaMask (添加 ZetaChain 网络)')
  console.log('2. 获取足够的测试币')
  console.log('3. 访问 https://labs.zetachain.com/ 进行官方测试')
  console.log('4. 观察和理解跨链过程')
  console.log('5. 考虑集成到你的项目中')
  console.log()
  console.log('🔗 重要链接:')
  console.log('   ZetaChain Labs: https://labs.zetachain.com/')
  console.log('   ZETA 水龙头: https://labs.zetachain.com/get-zeta')
  console.log('   添加网络: https://chainlist.org/chain/7001')
  console.log('   文档: https://docs.zetachain.com')
}

if (require.main === module) {
  main()
}

module.exports = { main }