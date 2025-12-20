#!/usr/bin/env node

/**
 * 修复 PaymentManager 合约配置
 * 设置正确的 CreationManager 和 AuthorizationManager 地址
 */

const { createWalletClient, createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

// 合约地址
const CONTRACT_ADDRESSES = {
  creation: '0x8a4664807dafa6017aa1de55bf974e9515c6efb1',
  payment: '0x8c46877629fea27ced23345ab8e9eecb4c302c0c',
  authorization: '0x5988c2af3eb0d6504fef8c00ed948aa9c3f339f8'
};

// PaymentManager ABI（包含初始化函数）
const PaymentManagerABI = [
  {
    type: 'function',
    name: 'setCreationManager',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_creationManager', type: 'address' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'setAuthorizationManager',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_authorizationManager', type: 'address' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'creationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'authorizationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  }
];

// 创建客户端
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg')
});

async function fixPaymentManagerConfig() {
  console.log('🔧 开始修复 PaymentManager 合约配置...\n');

  try {
    // 1. 检查当前配置
    console.log('📋 当前配置:');
    
    const currentCreationManager = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.payment,
      abi: PaymentManagerABI,
      functionName: 'creationManager'
    });
    console.log(`当前 CreationManager: ${currentCreationManager}`);

    const currentAuthManager = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.payment,
      abi: PaymentManagerABI,
      functionName: 'authorizationManager'
    });
    console.log(`当前 AuthorizationManager: ${currentAuthManager}`);

    // 2. 检查合约所有者
    try {
      const owner = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.payment,
        abi: PaymentManagerABI,
        functionName: 'owner'
      });
      console.log(`合约所有者: ${owner}`);
    } catch (error) {
      console.log('⚠️ 无法获取合约所有者信息（可能没有 owner 函数）');
    }

    console.log('\n📝 需要设置的地址:');
    console.log(`CreationManager: ${CONTRACT_ADDRESSES.creation}`);
    console.log(`AuthorizationManager: ${CONTRACT_ADDRESSES.authorization}`);

    console.log('\n⚠️ 注意：');
    console.log('要修复这个问题，需要合约所有者调用以下函数：');
    console.log(`1. setCreationManager("${CONTRACT_ADDRESSES.creation}")`);
    console.log(`2. setAuthorizationManager("${CONTRACT_ADDRESSES.authorization}")`);
    
    console.log('\n💡 如果你是合约所有者，请在 Etherscan 上手动调用这些函数：');
    console.log(`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.payment}#writeContract`);

  } catch (error) {
    console.error('❌ 检查配置时出现错误:', error);
  }
}

// 运行修复检查
fixPaymentManagerConfig().then(() => {
  console.log('\n🎉 配置检查完成!');
}).catch(console.error);