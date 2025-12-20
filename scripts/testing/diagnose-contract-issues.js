#!/usr/bin/env node

/**
 * 智能合约问题诊断脚本
 * 用于诊断二创授权和打赏功能失败的原因
 */

const { createPublicClient, http, parseEther, formatEther } = require('viem');
const { sepolia } = require('viem/chains');

// 合约地址
const CONTRACT_ADDRESSES = {
  creation: '0x74Cca0302a14d7bcA60389de48B38150584B25F2',
  payment: '0xd2c2EC069425FF06ea1EE639507fc6a1c2Bb9c5f',
  authorization: '0xACB3F1A4dD6D581996e9eD0651975d7C3Bc33b67'
};

// ABI 定义（简化版）
const CreationManagerABI = [
  {
    type: 'function',
    name: 'getWork',
    stateMutability: 'view',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'parentId', type: 'uint256' },
          { name: 'licenseFee', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'derivativeAllowed', type: 'bool' },
          { name: 'exists', type: 'bool' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'nextWorkId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
];

const PaymentManagerABI = [
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
  }
];

const AuthorizationManagerABI = [
  {
    type: 'function',
    name: 'creationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'paymentManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  }
];

// 创建客户端
const client = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg')
});

async function diagnoseContracts() {
  console.log('🔍 开始诊断智能合约问题...\n');

  try {
    // 1. 检查合约间地址配置
    console.log('📋 检查合约间地址配置:');
    
    const paymentCreationManager = await client.readContract({
      address: CONTRACT_ADDRESSES.payment,
      abi: PaymentManagerABI,
      functionName: 'creationManager'
    });
    console.log(`PaymentManager.creationManager: ${paymentCreationManager}`);
    console.log(`Expected CreationManager: ${CONTRACT_ADDRESSES.creation}`);
    console.log(`✅ 地址匹配: ${paymentCreationManager.toLowerCase() === CONTRACT_ADDRESSES.creation.toLowerCase()}`);

    const paymentAuthManager = await client.readContract({
      address: CONTRACT_ADDRESSES.payment,
      abi: PaymentManagerABI,
      functionName: 'authorizationManager'
    });
    console.log(`PaymentManager.authorizationManager: ${paymentAuthManager}`);
    console.log(`Expected AuthorizationManager: ${CONTRACT_ADDRESSES.authorization}`);
    console.log(`✅ 地址匹配: ${paymentAuthManager.toLowerCase() === CONTRACT_ADDRESSES.authorization.toLowerCase()}`);

    const authCreationManager = await client.readContract({
      address: CONTRACT_ADDRESSES.authorization,
      abi: AuthorizationManagerABI,
      functionName: 'creationManager'
    });
    console.log(`AuthorizationManager.creationManager: ${authCreationManager}`);
    console.log(`✅ 地址匹配: ${authCreationManager.toLowerCase() === CONTRACT_ADDRESSES.creation.toLowerCase()}`);

    const authPaymentManager = await client.readContract({
      address: CONTRACT_ADDRESSES.authorization,
      abi: AuthorizationManagerABI,
      functionName: 'paymentManager'
    });
    console.log(`AuthorizationManager.paymentManager: ${authPaymentManager}`);
    console.log(`✅ 地址匹配: ${authPaymentManager.toLowerCase() === CONTRACT_ADDRESSES.payment.toLowerCase()}`);

    console.log('\n');

    // 2. 检查作品信息
    console.log('📝 检查作品信息:');
    
    // 检查 nextWorkId
    const nextWorkId = await client.readContract({
      address: CONTRACT_ADDRESSES.creation,
      abi: CreationManagerABI,
      functionName: 'nextWorkId'
    });
    console.log(`下一个作品 ID: ${nextWorkId}`);
    console.log(`当前已有作品数量: ${Number(nextWorkId) - 1}`);

    // 检查作品 ID 1（二创授权失败的作品）
    try {
      const work1 = await client.readContract({
        address: CONTRACT_ADDRESSES.creation,
        abi: CreationManagerABI,
        functionName: 'getWork',
        args: [1n]
      });
      console.log('\n作品 ID 1 信息:');
      console.log(`- 存在: ${work1.exists}`);
      console.log(`- 创作者: ${work1.creator}`);
      console.log(`- 授权费: ${formatEther(work1.licenseFee)} ETH`);
      console.log(`- 允许二创: ${work1.derivativeAllowed}`);
      console.log(`- 创建时间: ${new Date(Number(work1.timestamp) * 1000).toLocaleString()}`);
    } catch (error) {
      console.log('❌ 作品 ID 1 不存在或读取失败:', error.message);
    }

    // 检查作品 ID 30（打赏失败的作品）
    try {
      const work30 = await client.readContract({
        address: CONTRACT_ADDRESSES.creation,
        abi: CreationManagerABI,
        functionName: 'getWork',
        args: [30n]
      });
      console.log('\n作品 ID 30 信息:');
      console.log(`- 存在: ${work30.exists}`);
      console.log(`- 创作者: ${work30.creator}`);
      console.log(`- 授权费: ${formatEther(work30.licenseFee)} ETH`);
      console.log(`- 允许二创: ${work30.derivativeAllowed}`);
      console.log(`- 创建时间: ${new Date(Number(work30.timestamp) * 1000).toLocaleString()}`);
    } catch (error) {
      console.log('❌ 作品 ID 30 不存在或读取失败:', error.message);
    }

    console.log('\n');

    // 3. 检查合约代码是否存在
    console.log('🔧 检查合约代码:');
    
    const creationCode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.creation
    });
    console.log(`CreationManager 合约代码存在: ${creationCode && creationCode !== '0x'}`);

    const paymentCode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.payment
    });
    console.log(`PaymentManager 合约代码存在: ${paymentCode && paymentCode !== '0x'}`);

    const authCode = await client.getBytecode({
      address: CONTRACT_ADDRESSES.authorization
    });
    console.log(`AuthorizationManager 合约代码存在: ${authCode && authCode !== '0x'}`);

  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error);
  }
}

// 运行诊断
diagnoseContracts().then(() => {
  console.log('\n🎉 诊断完成!');
}).catch(console.error);