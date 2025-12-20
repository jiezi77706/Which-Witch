#!/usr/bin/env node

/**
 * 创建测试作品脚本
 * 在新合约中快速创建一些测试作品
 */

const { ethers } = require('ethers');
require('dotenv').config();

const NEW_CONTRACTS = {
  creation: '0x74Cca0302a14d7bcA60389de48B38150584B25F2'
};

const CREATION_MANAGER_ABI = [
  "function nextWorkId() view returns (uint256)",
  "function registerOriginalWork(uint256 licenseFee, bool derivativeAllowed, string metadataURI) returns (uint256)",
  "function getWork(uint256 workId) view returns (tuple(uint256 id, address creator, uint256 parentId, uint256 licenseFee, uint256 timestamp, bool derivativeAllowed, bool exists))"
];

const SEPOLIA_CONFIG = {
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg'
};

// 测试作品数据
const TEST_WORKS = [
  {
    licenseFee: ethers.parseEther('0.05'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-1-original-art',
    description: '原创艺术作品 #1'
  },
  {
    licenseFee: ethers.parseEther('0.03'),
    derivativeAllowed: false,
    metadataURI: 'ipfs://test-work-2-exclusive-design',
    description: '独家设计作品 #2'
  },
  {
    licenseFee: ethers.parseEther('0.08'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-3-music-composition',
    description: '音乐创作 #3'
  },
  {
    licenseFee: ethers.parseEther('0.02'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-4-digital-painting',
    description: '数字绘画 #4'
  },
  {
    licenseFee: ethers.parseEther('0.06'),
    derivativeAllowed: false,
    metadataURI: 'ipfs://test-work-5-photography',
    description: '摄影作品 #5'
  },
  {
    licenseFee: ethers.parseEther('0.04'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-6-3d-model',
    description: '3D 模型 #6'
  },
  {
    licenseFee: ethers.parseEther('0.07'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-7-animation',
    description: '动画作品 #7'
  },
  {
    licenseFee: ethers.parseEther('0.05'),
    derivativeAllowed: false,
    metadataURI: 'ipfs://test-work-8-logo-design',
    description: 'Logo 设计 #8'
  },
  {
    licenseFee: ethers.parseEther('0.09'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-9-video-content',
    description: '视频内容 #9'
  },
  {
    licenseFee: ethers.parseEther('0.03'),
    derivativeAllowed: true,
    metadataURI: 'ipfs://test-work-10-illustration',
    description: '插画作品 #10'
  }
];

async function createTestWorks() {
  console.log('🎨 开始创建测试作品...\n');
  
  // 检查私钥
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    process.exit(1);
  }
  
  // 创建 provider 和 wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 创作者地址: ${wallet.address}`);
  
  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 余额: ${ethers.formatEther(balance)} ETH`);
  
  // 创建合约实例
  const contract = new ethers.Contract(NEW_CONTRACTS.creation, CREATION_MANAGER_ABI, wallet);
  
  try {
    // 检查当前作品数量
    const currentNextWorkId = await contract.nextWorkId();
    console.log(`📊 当前下一个作品 ID: ${currentNextWorkId}`);
    
    // 创建测试作品
    for (let i = 0; i < TEST_WORKS.length; i++) {
      const work = TEST_WORKS[i];
      const workNumber = i + 1;
      
      console.log(`\n🎨 创建测试作品 #${workNumber}...`);
      console.log(`📝 ${work.description}`);
      console.log(`💰 授权费: ${ethers.formatEther(work.licenseFee)} ETH`);
      console.log(`🔄 允许二创: ${work.derivativeAllowed ? '是' : '否'}`);
      
      try {
        const tx = await contract.registerOriginalWork(
          work.licenseFee,
          work.derivativeAllowed,
          work.metadataURI,
          {
            gasLimit: 500000,
            gasPrice: ethers.parseUnits('20', 'gwei')
          }
        );
        
        console.log(`⏳ 交易哈希: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          // 从事件中获取作品 ID
          const workId = Number(currentNextWorkId) + i;
          console.log(`✅ 作品 #${workNumber} 创建成功! 作品 ID: ${workId}`);
        } else {
          console.log(`❌ 作品 #${workNumber} 创建失败`);
        }
        
        // 添加延迟避免 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ 创建作品 #${workNumber} 时出错:`, error.message);
        
        // 如果是 nonce 相关错误，等待更长时间
        if (error.message.includes('nonce')) {
          console.log('⏳ 等待 10 秒后继续...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
    
    // 验证创建结果
    console.log('\n🔍 验证创建结果...');
    const finalNextWorkId = await contract.nextWorkId();
    const totalCreated = Number(finalNextWorkId) - Number(currentNextWorkId);
    
    console.log(`📊 创建完成:`);
    console.log(`   计划创建: ${TEST_WORKS.length} 个作品`);
    console.log(`   实际创建: ${totalCreated} 个作品`);
    console.log(`   当前总作品数: ${Number(finalNextWorkId) - 1}`);
    
    if (totalCreated >= 9) {
      console.log('✅ 测试作品创建成功! 现在可以测试作品 ID 9 的授权功能了');
    } else {
      console.log('⚠️ 部分作品创建失败，但应该已经有足够的作品进行测试');
    }
    
    // 显示一些作品信息
    console.log('\n📋 作品列表:');
    for (let i = 1; i < Math.min(Number(finalNextWorkId), 11); i++) {
      try {
        const work = await contract.getWork(i);
        if (work.exists) {
          console.log(`   作品 ID ${i}: 授权费 ${ethers.formatEther(work.licenseFee)} ETH, 允许二创: ${work.derivativeAllowed ? '是' : '否'}`);
        }
      } catch (error) {
        console.log(`   作品 ID ${i}: 读取失败`);
      }
    }
    
  } catch (error) {
    console.error('❌ 创建过程中出现错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestWorks().catch(console.error);
}

module.exports = { createTestWorks };