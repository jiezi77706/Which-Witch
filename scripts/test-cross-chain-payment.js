#!/usr/bin/env node

/**
 * ZetaChain 跨链支付测试脚本
 * 
 * 使用方法:
 * node scripts/test-cross-chain-payment.js
 */

const { ethers } = require('ethers')
require('dotenv').config({ path: '.env.local' })

// ZetaChain 合约 ABI (简化版)
const ZETA_PAYMENT_ABI = [
  "function owner() view returns (address)",
  "function platformFeeRate() view returns (uint256)",
  "function nextPaymentId() view returns (uint256)",
  "function supportedChains(uint256) view returns (bool)",
  "function isCurrencySupported(string) view returns (bool)",
  "function getPayment(uint256) view returns (tuple(uint256,address,address,uint256,uint8,uint256,uint256,uint256,string,bool,uint256))",
  "function zetaConnector() view returns (address)",
  "function zrc20Tokens(uint256) view returns (address)",
  "function supportedZRC20(address) view returns (bool)"
]

// ZRC-20 代币 ABI
const ZRC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
]

// 配置
const ZETA_RPC_URL = 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ZETA_PAYMENT_CONTRACT

// 支持的链配置
const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH' },
  56: { name: 'BSC', symbol: 'BNB' },
  137: { name: 'Polygon', symbol: 'MATIC' },
  8453: { name: 'Base', symbol: 'ETH' },
  11155111: { name: 'Sepolia', symbol: 'ETH' }
}

// 支持的币种
const SUPPORTED_CURRENCIES = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'MATIC', 'ZETA']

// ZRC-20 代币地址
const ZRC20_TOKENS = {
  1: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921',    // ETH.ETH
  56: '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb',   // BNB.BSC
  137: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921',  // MATIC.MATIC
  8453: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921', // ETH.BASE
  11155111: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' // ETH.SEP
}

async function main() {
  console.log('🧪 开始测试 ZetaChain 跨链支付功能...\n')
  
  // 检查配置
  if (!CONTRACT_ADDRESS) {
    console.error('❌ 未找到合约地址，请确保 NEXT_PUBLIC_ZETA_PAYMENT_CONTRACT 已配置')
    process.exit(1)
  }
  
  // 连接到 ZetaChain
  const provider = new ethers.JsonRpcProvider(ZETA_RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ZETA_PAYMENT_ABI, provider)
  
  try {
    await testBasicInfo(contract)
    await testChainSupport(contract)
    await testCurrencySupport(contract)
    await testZRC20Tokens(contract, provider)
    await testNetworkConnectivity(provider)
    
    console.log('🎉 所有测试完成!')
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message)
    process.exit(1)
  }
}

// 测试基本信息
async function testBasicInfo(contract) {
  console.log('📋 测试合约基本信息...')
  
  try {
    const owner = await contract.owner()
    const platformFeeRate = await contract.platformFeeRate()
    const nextPaymentId = await contract.nextPaymentId()
    const zetaConnector = await contract.zetaConnector()
    
    console.log('✅ 合约基本信息:')
    console.log(`   合约地址: ${contract.target}`)
    console.log(`   所有者: ${owner}`)
    console.log(`   平台费率: ${platformFeeRate} 基点 (${platformFeeRate / 100}%)`)
    console.log(`   下一个支付ID: ${nextPaymentId}`)
    console.log(`   ZetaConnector: ${zetaConnector}`)
    console.log()
    
  } catch (error) {
    console.error('❌ 获取基本信息失败:', error.message)
    throw error
  }
}

// 测试链支持
async function testChainSupport(contract) {
  console.log('🔗 测试支持的链...')
  
  try {
    console.log('✅ 链支持状态:')
    
    for (const [chainId, config] of Object.entries(SUPPORTED_CHAINS)) {
      const isSupported = await contract.supportedChains(chainId)
      const status = isSupported ? '✅' : '❌'
      console.log(`   ${config.name} (${chainId}): ${status}`)
    }
    console.log()
    
  } catch (error) {
    console.error('❌ 检查链支持失败:', error.message)
    throw error
  }
}

// 测试币种支持
async function testCurrencySupport(contract) {
  console.log('💰 测试支持的币种...')
  
  try {
    console.log('✅ 币种支持状态:')
    
    for (const currency of SUPPORTED_CURRENCIES) {
      const isSupported = await contract.isCurrencySupported(currency)
      const status = isSupported ? '✅' : '❌'
      console.log(`   ${currency}: ${status}`)
    }
    console.log()
    
  } catch (error) {
    console.error('❌ 检查币种支持失败:', error.message)
    throw error
  }
}

// 测试 ZRC-20 代币
async function testZRC20Tokens(contract, provider) {
  console.log('🪙 测试 ZRC-20 代币...')
  
  try {
    console.log('✅ ZRC-20 代币状态:')
    
    for (const [chainId, tokenAddress] of Object.entries(ZRC20_TOKENS)) {
      try {
        // 检查合约中的配置
        const configuredAddress = await contract.zrc20Tokens(chainId)
        const isSupported = await contract.supportedZRC20(tokenAddress)
        
        // 检查代币信息
        const tokenContract = new ethers.Contract(tokenAddress, ZRC20_ABI, provider)
        const symbol = await tokenContract.symbol()
        const decimals = await tokenContract.decimals()
        const totalSupply = await tokenContract.totalSupply()
        
        const chainName = SUPPORTED_CHAINS[chainId]?.name || `Chain ${chainId}`
        const status = isSupported ? '✅' : '❌'
        
        console.log(`   ${chainName} (${symbol}):`)
        console.log(`     地址: ${tokenAddress}`)
        console.log(`     配置地址: ${configuredAddress}`)
        console.log(`     支持状态: ${status}`)
        console.log(`     小数位: ${decimals}`)
        console.log(`     总供应量: ${ethers.formatEther(totalSupply)} ${symbol}`)
        console.log()
        
      } catch (error) {
        console.log(`   Chain ${chainId}: ❌ 获取信息失败 (${error.message})`)
      }
    }
    
  } catch (error) {
    console.error('❌ 检查 ZRC-20 代币失败:', error.message)
    throw error
  }
}

// 测试网络连接
async function testNetworkConnectivity(provider) {
  console.log('🌐 测试网络连接...')
  
  try {
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    const gasPrice = await provider.getFeeData()
    
    console.log('✅ 网络连接状态:')
    console.log(`   网络名称: ${network.name}`)
    console.log(`   链ID: ${network.chainId}`)
    console.log(`   当前区块: ${blockNumber}`)
    console.log(`   Gas 价格: ${ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')} Gwei`)
    console.log()
    
  } catch (error) {
    console.error('❌ 网络连接测试失败:', error.message)
    throw error
  }
}

// 模拟跨链支付测试 (只读操作)
async function simulateCrossChainPayment() {
  console.log('🔄 模拟跨链支付流程...')
  
  // 这里只是展示流程，不执行实际交易
  console.log('📝 跨链支付流程:')
  console.log('   1. 用户在源链授权 ZRC-20 代币')
  console.log('   2. 调用 initiateCrossChainTip() 函数')
  console.log('   3. ZetaChain 处理跨链消息')
  console.log('   4. 目标链接收支付')
  console.log('   5. 更新支付状态为完成')
  console.log()
  
  console.log('💡 要执行实际的跨链支付测试，请:')
  console.log('   1. 确保钱包有足够的 ZETA 代币')
  console.log('   2. 使用前端界面或 cast 命令行工具')
  console.log('   3. 监控交易状态和事件日志')
  console.log()
}

// 显示使用指南
function showUsageGuide() {
  console.log('📖 使用指南:')
  console.log()
  console.log('🔧 手动测试命令:')
  console.log('   # 查询合约所有者')
  console.log(`   cast call ${CONTRACT_ADDRESS} "owner()" --rpc-url ${ZETA_RPC_URL}`)
  console.log()
  console.log('   # 查询平台费率')
  console.log(`   cast call ${CONTRACT_ADDRESS} "platformFeeRate()" --rpc-url ${ZETA_RPC_URL}`)
  console.log()
  console.log('   # 检查链支持状态')
  console.log(`   cast call ${CONTRACT_ADDRESS} "supportedChains(uint256)" 11155111 --rpc-url ${ZETA_RPC_URL}`)
  console.log()
  console.log('🌐 有用的链接:')
  console.log('   ZetaChain 浏览器: https://zetachain-athens-3.blockscout.com')
  console.log('   ZetaChain 水龙头: https://labs.zetachain.com/get-zeta')
  console.log('   ZetaChain 文档: https://docs.zetachain.com')
  console.log()
}

// 运行主函数
if (require.main === module) {
  main().then(() => {
    simulateCrossChainPayment()
    showUsageGuide()
  }).catch(console.error)
}

module.exports = { main }