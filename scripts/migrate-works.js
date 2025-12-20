#!/usr/bin/env node

/**
 * 作品数据迁移脚本
 * 从旧合约读取作品数据，在新合约中重新创建
 */

const { ethers } = require('ethers');
require('dotenv').config();

// 合约地址
const OLD_CONTRACTS = {
  creation: '0x8a4664807dafa6017aa1de55bf974e9515c6efb1',
  payment: '0x8c46877629fea27ced23345ab8e9eecb4c302c0c',
  authorization: '0x5988c2af3eb0d6504fef8c00ed948aa9c3f339f8'
};

const NEW_CONTRACTS = {
  creation: '0x74Cca0302a14d7bcA60389de48B38150584B25F2',
  payment: '0xd2c2EC069425FF06ea1EE639507fc6a1c2Bb9c5f',
  authorization: '0xACB3F1A4dD6D581996e9eD0651975d7C3Bc33b67'
};

// 简化的 ABI
const CREATION_MANAGER_ABI = [
  "function nextWorkId() view returns (uint256)",
  "function getWork(uint256 workId) view returns (tuple(uint256 id, address creator, uint256 parentId, uint256 licenseFee, uint256 timestamp, bool derivativeAllowed, bool exists))",
  "function registerOriginalWork(uint256 licenseFee, bool derivativeAllowed, string metadataURI) returns (uint256)",
  "function registerDerivativeWork(uint256 parentId, uint256 licenseFee, bool derivativeAllowed, string metadataURI) returns (uint256)"
];

const SEPOLIA_CONFIG = {
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg'
};

async function migrateWorks() {
  console.log('🔄 开始迁移作品数据...\n');
  
  // 检查私钥
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    process.exit(1);
  }
  
  // 创建 provider 和 wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 迁移者地址: ${wallet.address}`);
  
  // 创建合约实例
  const oldContract = new ethers.Contract(OLD_CONTRACTS.creation, CREATION_MANAGER_ABI, provider);
  const newContract = new ethers.Contract(NEW_CONTRACTS.creation, CREATION_MANAGER_ABI, wallet);
  
  try {
    // 获取旧合约中的作品数量
    const nextWorkId = await oldContract.nextWorkId();
    const totalWorks = Number(nextWorkId) - 1;
    
    console.log(`📊 发现 ${totalWorks} 个作品需要迁移`);
    
    if (totalWorks === 0) {
      console.log('✅ 没有作品需要迁移');
      return;
    }
    
    // 迁移每个作品
    for (let workId = 1; workId <= totalWorks; workId++) {
      console.log(`\n🔄 迁移作品 ID ${workId}...`);
      
      try {
        // 从旧合约读取作品信息
        const work = await oldContract.getWork(workId);
        
        if (!work.exists) {
          console.log(`⚠️ 作品 ID ${workId} 不存在，跳过`);
          continue;
        }
        
        console.log(`📝 作品信息:`);
        console.log(`   创作者: ${work.creator}`);
        console.log(`   授权费: ${ethers.formatEther(work.licenseFee)} ETH`);
        console.log(`   允许二创: ${work.derivativeAllowed}`);
        console.log(`   父作品 ID: ${work.parentId}`);
        
        // 生成元数据 URI
        const metadataURI = `ipfs://work-${workId}-metadata`;
        
        let tx;
        if (work.parentId === 0n) {
          // 原创作品
          console.log(`🎨 注册为原创作品...`);
          tx = await newContract.registerOriginalWork(
            work.licenseFee,
            work.derivativeAllowed,
            metadataURI,
            {
              gasLimit: 500000,
              gasPrice: ethers.parseUnits('20', 'gwei')
            }
          );
        } else {
          // 二创作品
          console.log(`🎭 注册为二创作品（父作品 ID: ${work.parentId}）...`);
          tx = await newContract.registerDerivativeWork(
            work.parentId,
            work.licenseFee,
            work.derivativeAllowed,
            metadataURI,
            {
              gasLimit: 500000,
              gasPrice: ethers.parseUnits('20', 'gwei')
            }
          );
        }
        
        console.log(`⏳ 交易哈希: ${tx.hash}`);
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
          console.log(`✅ 作品 ID ${workId} 迁移成功`);
        } else {
          console.log(`❌ 作品 ID ${workId} 迁移失败`);
        }
        
        // 添加延迟避免 RPC 限制
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ 迁移作品 ID ${workId} 时出错:`, error.message);
        
        // 如果是 gas 相关错误，继续下一个
        if (error.message.includes('gas') || error.message.includes('nonce')) {
          console.log('⏳ 等待 5 秒后继续...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // 验证迁移结果
    console.log('\n🔍 验证迁移结果...');
    const newNextWorkId = await newContract.nextWorkId();
    const newTotalWorks = Number(newNextWorkId) - 1;
    
    console.log(`📊 迁移完成:`);
    console.log(`   原合约作品数: ${totalWorks}`);
    console.log(`   新合约作品数: ${newTotalWorks}`);
    
    if (newTotalWorks >= totalWorks) {
      console.log('✅ 迁移成功完成!');
    } else {
      console.log('⚠️ 部分作品可能未成功迁移，请检查日志');
    }
    
  } catch (error) {
    console.error('❌ 迁移过程中出现错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateWorks().catch(console.error);
}

module.exports = { migrateWorks };