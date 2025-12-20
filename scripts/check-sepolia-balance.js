#!/usr/bin/env node

/**
 * 检查 Sepolia 上的余额和交易记录
 */

const { ethers } = require('ethers')

// 从你的交易截图中提取的信息
const TRANSACTION_HASH = '0x6261bd41aedd405567595658a1fb1bcd593554ec7172b8857810556dfe540e'
const RECIPIENT_ADDRESS = '0x169f03c43c9C7F514' // 请替换为完整地址
const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg'

async function checkSepoliaTransaction() {
  console.log('🔍 检查 Sepolia 上的跨链接收情况...\n')
  
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
    
    console.log('📋 交易信息:')
    console.log(`   ZetaChain 交易哈希: ${TRANSACTION_HASH}`)
    console.log(`   接收地址: ${RECIPIENT_ADDRESS}`)
    console.log()
    
    // 检查接收地址的余额
    console.log('💰 检查接收地址余额...')
    const balance = await provider.getBalance(RECIPIENT_ADDRESS)
    console.log(`   当前 Sepolia ETH 余额: ${ethers.formatEther(balance)} ETH`)
    console.log()
    
    // 获取最近的交易记录
    console.log('📜 获取最近的交易记录...')
    const latestBlock = await provider.getBlockNumber()
    console.log(`   当前区块高度: ${latestBlock}`)
    
    // 查找最近几个区块的交易
    for (let i = 0; i < 10; i++) {
      const blockNumber = latestBlock - i
      const block = await provider.getBlock(blockNumber, true)
      
      if (block && block.transactions) {
        const relevantTxs = block.transactions.filter(tx => 
          tx.to && tx.to.toLowerCase() === RECIPIENT_ADDRESS.toLowerCase()
        )
        
        if (relevantTxs.length > 0) {
          console.log(`   ✅ 在区块 ${blockNumber} 找到相关交易:`)
          relevantTxs.forEach(tx => {
            console.log(`      交易哈希: ${tx.hash}`)
            console.log(`      金额: ${ethers.formatEther(tx.value)} ETH`)
            console.log(`      发送者: ${tx.from}`)
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

async function showTroubleshootingSteps() {
  console.log('\n🔧 故障排除步骤:')
  console.log()
  
  console.log('1. 检查 MetaMask 网络')
  console.log('   - 确保已切换到 Sepolia 测试网')
  console.log('   - 刷新钱包余额')
  console.log()
  
  console.log('2. 检查接收地址')
  console.log('   - 确认接收地址是你的钱包地址')
  console.log('   - 检查地址是否正确')
  console.log()
  
  console.log('3. 查看区块浏览器')
  console.log('   - Sepolia 浏览器: https://sepolia.etherscan.io/')
  console.log(`   - 搜索你的地址: ${RECIPIENT_ADDRESS}`)
  console.log('   - 查看交易历史')
  console.log()
  
  console.log('4. 等待时间')
  console.log('   - 跨链交易可能需要几分钟到几小时')
  console.log('   - ZetaChain 显示成功不代表立即到账')
  console.log()
  
  console.log('5. 手动添加代币（如果需要）')
  console.log('   - 有时需要手动添加代币才能显示')
  console.log('   - 但 ETH 应该自动显示')
  console.log()
}

async function showNextSteps() {
  console.log('📋 下一步操作:')
  console.log()
  
  console.log('如果余额正确显示:')
  console.log('   ✅ 跨链测试成功!')
  console.log('   ✅ 你已经理解了 ZetaChain 跨链机制')
  console.log('   ✅ 可以考虑集成到你的项目中')
  console.log()
  
  console.log('如果仍然没有收到:')
  console.log('   1. 等待更长时间（最多24小时）')
  console.log('   2. 在 ZetaChain Discord 寻求帮助')
  console.log('   3. 检查是否有网络拥堵')
  console.log()
  
  console.log('🔗 有用的链接:')
  console.log('   ZetaChain 浏览器: https://zetachain-athens-3.blockscout.com')
  console.log('   Sepolia 浏览器: https://sepolia.etherscan.io')
  console.log('   ZetaChain Discord: https://discord.gg/zetachain')
}

async function main() {
  await checkSepoliaTransaction()
  await showTroubleshootingSteps()
  await showNextSteps()
}

if (require.main === module) {
  main()
}