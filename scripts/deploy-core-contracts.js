#!/usr/bin/env node

/**
 * 部署核心智能合约到 Sepolia 测试网
 * 包括：CreationManager, PaymentManager, AuthorizationManager
 */

const { ethers } = require('ethers');
const fs = require('fs');

// 网络配置
const SEPOLIA_CONFIG = {
  name: 'Sepolia Testnet',
  chainId: 11155111,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg',
  explorerUrl: 'https://sepolia.etherscan.io'
};

// 合约源代码
const CREATION_MANAGER_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    mapping(uint256 => Work) public works;
    mapping(address => uint256[]) public creatorWorks;
    mapping(uint256 => uint256[]) public derivatives;
    
    uint256 public nextWorkId = 1;
    address public authorizationManager;
    address public paymentManager;
    
    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        uint256 licenseFee,
        bool derivativeAllowed,
        string metadataURI,
        uint256 timestamp
    );
    
    function setAuthorizationManager(address _authorizationManager) external {
        authorizationManager = _authorizationManager;
    }
    
    function setPaymentManager(address _paymentManager) external {
        paymentManager = _paymentManager;
    }
    
    function registerOriginalWork(
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: 0,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        
        emit WorkRegistered(workId, msg.sender, licenseFee, derivativeAllowed, metadataURI, block.timestamp);
    }
    
    function registerDerivativeWork(
        uint256 parentId,
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        require(works[parentId].exists, "Parent work does not exist");
        require(works[parentId].derivativeAllowed, "Derivatives not allowed for parent work");
        
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: parentId,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        derivatives[parentId].push(workId);
        
        emit WorkRegistered(workId, msg.sender, licenseFee, derivativeAllowed, metadataURI, block.timestamp);
    }
    
    function getWork(uint256 workId) external view returns (Work memory) {
        return works[workId];
    }
    
    function getWorksByCreator(address creator) external view returns (uint256[] memory) {
        return creatorWorks[creator];
    }
    
    function getDerivatives(uint256 parentId) external view returns (uint256[] memory) {
        return derivatives[parentId];
    }
    
    function getAncestorChain(uint256 workId) external view returns (address[] memory) {
        uint256 currentId = workId;
        address[] memory tempChain = new address[](100); // 临时数组
        uint256 count = 0;
        
        while (currentId != 0 && works[currentId].exists && count < 100) {
            tempChain[count] = works[currentId].creator;
            currentId = works[currentId].parentId;
            count++;
        }
        
        // 创建正确大小的数组
        address[] memory chain = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            chain[i] = tempChain[i];
        }
        
        return chain;
    }
}
`;

const PAYMENT_MANAGER_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    function getWork(uint256 workId) external view returns (Work memory);
    function getAncestorChain(uint256 workId) external view returns (address[] memory);
}

contract PaymentManager {
    ICreationManager public creationManager;
    address public authorizationManager;
    address public platformWallet;
    
    mapping(address => uint256) public balances;
    mapping(uint256 => uint256) public totalRevenue;
    
    uint256 public constant PLATFORM_FEE_RATE = 500; // 5%
    uint256 public constant BASIS_POINTS = 10000;
    
    event PaymentProcessed(uint256 indexed workId, address indexed payer, uint256 amount);
    event TipReceived(address indexed creator, address indexed tipper, uint256 amount);
    event RevenueDistributed(uint256 indexed workId, address indexed creator, uint256 amount);
    event Withdrawal(address indexed creator, uint256 amount);
    
    constructor() {
        platformWallet = msg.sender;
    }
    
    function setCreationManager(address _creationManager) external {
        creationManager = ICreationManager(_creationManager);
    }
    
    function setAuthorizationManager(address _authorizationManager) external {
        authorizationManager = _authorizationManager;
    }
    
    function processPayment(uint256 workId) external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(address(creationManager) != address(0), "CreationManager not set");
        
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        
        // 分配收益
        _distributeRevenue(workId, work.creator, msg.value);
        
        emit PaymentProcessed(workId, msg.sender, msg.value);
    }
    
    function tipCreator(address creator) external payable {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(creator != address(0), "Invalid creator address");
        
        uint256 platformFee = (msg.value * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 creatorAmount = msg.value - platformFee;
        
        balances[creator] += creatorAmount;
        balances[platformWallet] += platformFee;
        
        emit TipReceived(creator, msg.sender, msg.value);
    }
    
    function _distributeRevenue(uint256 workId, address directCreator, uint256 amount) internal {
        uint256 platformFee = (amount * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 remainingAmount = amount - platformFee;
        
        // 获取祖先链
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 0) {
            // 没有祖先，全部给直接创作者
            balances[directCreator] += remainingAmount;
        } else {
            // 有祖先，按比例分配
            uint256 creatorShare = remainingAmount / 2; // 50% 给直接创作者
            uint256 ancestorShare = remainingAmount - creatorShare; // 50% 给祖先们
            
            balances[directCreator] += creatorShare;
            
            // 祖先们平分剩余部分
            uint256 perAncestor = ancestorShare / ancestors.length;
            for (uint256 i = 0; i < ancestors.length; i++) {
                balances[ancestors[i]] += perAncestor;
            }
        }
        
        balances[platformWallet] += platformFee;
        totalRevenue[workId] += amount;
        
        emit RevenueDistributed(workId, directCreator, amount);
    }
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, amount);
    }
    
    function getBalance(address creator) external view returns (uint256) {
        return balances[creator];
    }
    
    function getTotalRevenue(uint256 workId) external view returns (uint256) {
        return totalRevenue[workId];
    }
    
    function calculateDistribution(uint256 workId, uint256 amount) external view returns (
        uint256 platformFee,
        uint256 creatorAmount,
        uint256 ancestorAmount
    ) {
        platformFee = (amount * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 remainingAmount = amount - platformFee;
        
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 0) {
            creatorAmount = remainingAmount;
            ancestorAmount = 0;
        } else {
            creatorAmount = remainingAmount / 2;
            ancestorAmount = remainingAmount - creatorAmount;
        }
    }
}
`;

const AUTHORIZATION_MANAGER_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    function getWork(uint256 workId) external view returns (Work memory);
}

interface IPaymentManager {
    function processPayment(uint256 workId) external payable;
}

contract AuthorizationManager {
    ICreationManager public creationManager;
    IPaymentManager public paymentManager;
    
    mapping(address => mapping(uint256 => uint256)) public authorizations;
    
    event AuthorizationGranted(address indexed user, uint256 indexed workId, uint256 timestamp);
    
    constructor() {}
    
    function setCreationManager(address _creationManager) external {
        creationManager = ICreationManager(_creationManager);
    }
    
    function setPaymentManager(address _paymentManager) external {
        paymentManager = IPaymentManager(_paymentManager);
    }
    
    function requestAuthorization(uint256 workId) external payable {
        require(address(creationManager) != address(0), "CreationManager not set");
        require(address(paymentManager) != address(0), "PaymentManager not set");
        
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        require(msg.value >= work.licenseFee, "Insufficient payment for license fee");
        
        // 记录授权
        authorizations[msg.sender][workId] = block.timestamp;
        
        // 处理支付
        paymentManager.processPayment{value: msg.value}(workId);
        
        emit AuthorizationGranted(msg.sender, workId, block.timestamp);
    }
    
    function hasAuthorization(address user, uint256 workId) external view returns (bool) {
        return authorizations[user][workId] > 0;
    }
    
    function getAuthorizationTimestamp(address user, uint256 workId) external view returns (uint256) {
        return authorizations[user][workId];
    }
}
`;

// 编译合约
async function compileContract(source, contractName) {
  console.log(`📝 编译合约: ${contractName}...`);
  
  // 这里使用简化的编译过程，实际项目中应该使用 solc
  // 为了演示，我们直接返回预编译的字节码和ABI
  
  // 注意：这些是示例字节码，实际部署时需要真正编译
  const compilationResult = {
    CreationManager: {
      abi: [
        {
          "type": "function",
          "name": "registerOriginalWork",
          "stateMutability": "nonpayable",
          "inputs": [
            {"name": "licenseFee", "type": "uint256"},
            {"name": "derivativeAllowed", "type": "bool"},
            {"name": "metadataURI", "type": "string"}
          ],
          "outputs": [{"name": "workId", "type": "uint256"}]
        },
        {
          "type": "function",
          "name": "getWork",
          "stateMutability": "view",
          "inputs": [{"name": "workId", "type": "uint256"}],
          "outputs": [
            {
              "type": "tuple",
              "components": [
                {"name": "id", "type": "uint256"},
                {"name": "creator", "type": "address"},
                {"name": "parentId", "type": "uint256"},
                {"name": "licenseFee", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"},
                {"name": "derivativeAllowed", "type": "bool"},
                {"name": "exists", "type": "bool"}
              ]
            }
          ]
        },
        {
          "type": "function",
          "name": "nextWorkId",
          "stateMutability": "view",
          "inputs": [],
          "outputs": [{"type": "uint256"}]
        },
        {
          "type": "function",
          "name": "setAuthorizationManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_authorizationManager", "type": "address"}],
          "outputs": []
        },
        {
          "type": "function",
          "name": "setPaymentManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_paymentManager", "type": "address"}],
          "outputs": []
        }
      ],
      bytecode: "0x608060405234801561001057600080fd5b50600180819055506108a8806100276000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80631234567890abcdef" // 示例字节码
    },
    PaymentManager: {
      abi: [
        {
          "type": "function",
          "name": "processPayment",
          "stateMutability": "payable",
          "inputs": [{"name": "workId", "type": "uint256"}],
          "outputs": []
        },
        {
          "type": "function",
          "name": "setCreationManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_creationManager", "type": "address"}],
          "outputs": []
        },
        {
          "type": "function",
          "name": "setAuthorizationManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_authorizationManager", "type": "address"}],
          "outputs": []
        }
      ],
      bytecode: "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffff" // 示例字节码
    },
    AuthorizationManager: {
      abi: [
        {
          "type": "function",
          "name": "requestAuthorization",
          "stateMutability": "payable",
          "inputs": [{"name": "workId", "type": "uint256"}],
          "outputs": []
        },
        {
          "type": "function",
          "name": "setCreationManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_creationManager", "type": "address"}],
          "outputs": []
        },
        {
          "type": "function",
          "name": "setPaymentManager",
          "stateMutability": "nonpayable",
          "inputs": [{"name": "_paymentManager", "type": "address"}],
          "outputs": []
        }
      ],
      bytecode: "0x608060405234801561001057600080fd5b506107d0806100106000396000f3fe608060405234801561001057600080fd5b50" // 示例字节码
    }
  };
  
  return compilationResult[contractName];
}

// 部署单个合约
async function deployContract(wallet, contractName, abi, bytecode, constructorArgs = []) {
  console.log(`🚀 部署 ${contractName}...`);
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(...constructorArgs);
  
  console.log(`⏳ 交易哈希: ${contract.deploymentTransaction().hash}`);
  console.log(`⏳ 等待确认...`);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log(`✅ ${contractName} 部署成功!`);
  console.log(`📍 合约地址: ${address}`);
  
  return { contract, address };
}

// 配置合约间的关联
async function configureContracts(contracts, wallet) {
  console.log('\n⚙️ 配置合约间关联...');
  
  const { creationManager, paymentManager, authorizationManager } = contracts;
  
  // 配置 CreationManager
  console.log('🔧 配置 CreationManager...');
  await creationManager.contract.setPaymentManager(paymentManager.address);
  await creationManager.contract.setAuthorizationManager(authorizationManager.address);
  
  // 配置 PaymentManager
  console.log('🔧 配置 PaymentManager...');
  await paymentManager.contract.setCreationManager(creationManager.address);
  await paymentManager.contract.setAuthorizationManager(authorizationManager.address);
  
  // 配置 AuthorizationManager
  console.log('🔧 配置 AuthorizationManager...');
  await authorizationManager.contract.setCreationManager(creationManager.address);
  await authorizationManager.contract.setPaymentManager(paymentManager.address);
  
  console.log('✅ 合约配置完成!');
}

// 主部署函数
async function deployAllContracts() {
  console.log('🎯 开始部署核心智能合约到 Sepolia 测试网...\n');
  
  // 检查环境变量
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    process.exit(1);
  }
  
  // 创建 provider 和 wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`👤 部署者地址: ${wallet.address}`);
  
  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 余额: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther('0.01')) {
    console.warn('⚠️ 警告: 余额可能不足以完成部署');
  }
  
  try {
    // 编译合约
    const creationManagerCompiled = await compileContract(CREATION_MANAGER_SOURCE, 'CreationManager');
    const paymentManagerCompiled = await compileContract(PAYMENT_MANAGER_SOURCE, 'PaymentManager');
    const authorizationManagerCompiled = await compileContract(AUTHORIZATION_MANAGER_SOURCE, 'AuthorizationManager');
    
    // 部署合约
    const creationManager = await deployContract(
      wallet, 
      'CreationManager', 
      creationManagerCompiled.abi, 
      creationManagerCompiled.bytecode
    );
    
    const paymentManager = await deployContract(
      wallet, 
      'PaymentManager', 
      paymentManagerCompiled.abi, 
      paymentManagerCompiled.bytecode
    );
    
    const authorizationManager = await deployContract(
      wallet, 
      'AuthorizationManager', 
      authorizationManagerCompiled.abi, 
      authorizationManagerCompiled.bytecode
    );
    
    const contracts = {
      creationManager,
      paymentManager,
      authorizationManager
    };
    
    // 配置合约间关联
    await configureContracts(contracts, wallet);
    
    // 保存部署信息
    const deploymentInfo = {
      network: SEPOLIA_CONFIG.name,
      chainId: SEPOLIA_CONFIG.chainId,
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        CreationManager: creationManager.address,
        PaymentManager: paymentManager.address,
        AuthorizationManager: authorizationManager.address
      },
      explorerUrls: {
        CreationManager: \`\${SEPOLIA_CONFIG.explorerUrl}/address/\${creationManager.address}\`,
        PaymentManager: \`\${SEPOLIA_CONFIG.explorerUrl}/address/\${paymentManager.address}\`,
        AuthorizationManager: \`\${SEPOLIA_CONFIG.explorerUrl}/address/\${authorizationManager.address}\`
      }
    };
    
    // 保存到文件
    const deploymentFile = \`deployment-\${Date.now()}.json\`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n🎉 部署完成!');
    console.log('📋 合约地址:');
    console.log(\`   CreationManager: \${creationManager.address}\`);
    console.log(\`   PaymentManager: \${paymentManager.address}\`);
    console.log(\`   AuthorizationManager: \${authorizationManager.address}\`);
    console.log(\`\n📄 部署信息已保存到: \${deploymentFile}\`);
    
    console.log('\n📝 下一步:');
    console.log('1. 更新 .env.local 文件中的合约地址');
    console.log('2. 在 Etherscan 上验证合约');
    console.log('3. 测试合约功能');
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployAllContracts().catch(console.error);
}

module.exports = { deployAllContracts };