// 调试合约余额问题
// 检查PaymentManager合约的状态

const { ethers } = require('ethers');

// 合约地址和ABI
const PAYMENT_CONTRACT_ADDRESS = '0xd2c2EC069425FF06ea1EE639507fc6a1c2Bb9c5f';
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg';

// PaymentManager ABI（简化版，只包含需要的函数）
const PAYMENT_ABI = [
  'function balances(address) view returns (uint256)',
  'function getBalance(address) view returns (uint256)',
  'function totalRevenue() view returns (uint256)',
  'function creationManager() view returns (address)',
  'event PaymentProcessed(uint256 indexed workId, address indexed payer, uint256 amount, uint256 timestamp)',
  'event RevenueDistributed(uint256 indexed workId, address indexed directCreator, address indexed originalCreator, address[] ancestors, uint256 totalAmount, uint256 timestamp)',
  'event Withdrawal(address indexed creator, uint256 amount, uint256 fee, uint256 timestamp)'
];

async function debugContractBalance() {
  console.log('🔍 调试PaymentManager合约余额...\n');
  
  // 连接到网络
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PAYMENT_ABI, provider);
  
  console.log('📍 合约地址:', PAYMENT_CONTRACT_ADDRESS);
  console.log('🌐 网络:', await provider.getNetwork());
  
  try {
    // 1. 检查合约是否存在
    const code = await provider.getCode(PAYMENT_CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ 合约不存在或未部署');
      return;
    }
    console.log('✅ 合约已部署');
    
    // 2. 检查合约配置
    try {
      const creationManager = await contract.creationManager();
      console.log('🔗 CreationManager地址:', creationManager);
    } catch (e) {
      console.log('⚠️ 无法读取creationManager地址:', e.message);
    }
    
    // 3. 检查总收益
    try {
      const totalRevenue = await contract.totalRevenue();
      console.log('💰 合约总收益:', ethers.formatEther(totalRevenue), 'ETH');
    } catch (e) {
      console.log('⚠️ 无法读取totalRevenue:', e.message);
    }
    
    // 4. 检查一些测试地址的余额
    const testAddresses = [
      '0x1234567890123456789012345678901234567890', // 测试地址
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat默认地址
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat地址2
    ];
    
    console.log('\n📊 检查测试地址余额:');
    for (const address of testAddresses) {
      try {
        const balance = await contract.balances(address);
        console.log(`${address}: ${ethers.formatEther(balance)} ETH`);
      } catch (e) {
        console.log(`${address}: 读取失败 - ${e.message}`);
      }
    }
    
    // 5. 查询最近的事件
    console.log('\n📜 查询最近的支付事件:');
    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // 最近10000个区块
      
      console.log(`从区块 ${fromBlock} 到 ${currentBlock} 查询事件...`);
      
      // 查询PaymentProcessed事件
      const paymentEvents = await contract.queryFilter(
        contract.filters.PaymentProcessed(),
        fromBlock,
        currentBlock
      );
      console.log(`💸 找到 ${paymentEvents.length} 个支付事件`);
      
      paymentEvents.slice(-5).forEach((event, index) => {
        console.log(`  ${index + 1}. 作品ID: ${event.args[0]}, 支付者: ${event.args[1]}, 金额: ${ethers.formatEther(event.args[2])} ETH`);
      });
      
      // 查询RevenueDistributed事件
      const revenueEvents = await contract.queryFilter(
        contract.filters.RevenueDistributed(),
        fromBlock,
        currentBlock
      );
      console.log(`📈 找到 ${revenueEvents.length} 个收益分配事件`);
      
      revenueEvents.slice(-5).forEach((event, index) => {
        console.log(`  ${index + 1}. 作品ID: ${event.args[0]}, 直接创作者: ${event.args[1]}, 金额: ${ethers.formatEther(event.args[4])} ETH`);
      });
      
      // 查询Withdrawal事件
      const withdrawalEvents = await contract.queryFilter(
        contract.filters.Withdrawal(),
        fromBlock,
        currentBlock
      );
      console.log(`💳 找到 ${withdrawalEvents.length} 个提现事件`);
      
    } catch (e) {
      console.log('⚠️ 查询事件失败:', e.message);
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
  }
}

// 运行调试
debugContractBalance().catch(console.error);