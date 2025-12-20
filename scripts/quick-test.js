#!/usr/bin/env node

/**
 * 快速测试脚本 - 无需额外配置
 * 只检查网络连接和基本信息
 */

const { ethers } = require('ethers')

console.log('🚀 快速测试 ZetaChain 跨链功能\n')

async function quickTest() {
  try {
    console.log('1️⃣ 测试 ZetaChain 网络连接...')
    const zetaProvider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public')
    const zetaNetwork = await zetaProvider.getNetwork()
    const zetaBlock = await zetaProvider.getBlockNumber()
    console.log(`   ✅ ZetaChain Athens (${zetaNetwork.chainId}) - 区块: ${zetaBlock}`)
    
    console.log('\n2️⃣ 测试 Sepolia 网络连接...')
    const sepoliaProvider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg')
    const sepoliaNetwork = await sepoliaProvider.getNetwork()
    const sepoliaBlock = await sepoliaProvider.getBlockNumber()
    console.log(`   ✅ Sepolia (${sepoliaNetwork.chainId}) - 区块: ${sepoliaBlock}`)
    
    console.log('\n3️⃣ 检查 ZRC-20 代币...')
    const zrc20Address = '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' // ETH.SEP
    const zrc20Contract = new ethers.Contract(zrc20Address, [
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)"
    ], zetaProvider)
    
    const symbol = await zrc20Contract.symbol()
    const totalSupply = await zrc20Contract.totalSupply()
    console.log(`   ✅ ZRC-20 ${symbol} - 总供应量: ${ethers.formatEther(totalSupply)}`)
    
    console.log('\n🎉 网络测试成功!')
    console.log('\n📋 下一步测试建议:')
    console.log('   1. 运行: node scripts/test-with-existing-tokens.js')
    console.log('   2. 在 MetaMask 中添加 ZetaChain 网络')
    console.log('   3. 访问 https://labs.zetachain.com/ 体验官方跨链功能')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.log('\n🔧 可能的解决方案:')
    console.log('   - 检查网络连接')
    console.log('   - 稍后重试（RPC 可能暂时不可用）')
  }
}

quickTest()