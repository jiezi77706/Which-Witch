#!/usr/bin/env node

/**
 * 自动化智能合约部署脚本
 * 编译并部署 CreationManager, PaymentManager, AuthorizationManager 到 Sepolia
 */

const { ethers } = require('ethers');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// 网络配置
const SEPOLIA_CONFIG = {
  name: 'Sepolia Testnet',
  chainId: 11155111,
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/JOvPNqQWEtzrh7zeB-5Jg',
  explorerUrl: 'https://sepolia.etherscan.io'
};

// 合约源代码
const contracts = {
  CreationManager: `
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
        address[] memory tempChain = new address[](100);
        uint256 count = 0;
        
        while (currentId != 0 && works[currentId].exists && count < 100) {
            tempChain[count] = works[currentId].creator;
            currentId = works[currentId].parentId;
            count++;
        }
        
        address[] memory chain = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            chain[i] = tempChain[i];
        }
        
        return chain;
    }
}
`,

  PaymentManager: `
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
        
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 0) {
            balances[directCreator] += remainingAmount;
        } else {
            uint256 creatorShare = remainingAmount / 2;
            uint256 ancestorShare = remainingAmount - creatorShare;
            
            balances[directCreator] += creatorShare;
            
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
    
    function getCreatorRevenue(address creator) external view returns (uint256) {
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
    
    function withdrawPlatformFees() external {
        require(msg.sender == platformWallet, "Only platform wallet can withdraw fees");
        uint256 amount = balances[platformWallet];
        require(amount > 0, "No platform fees to withdraw");
        
        balances[platformWallet] = 0;
        payable(platformWallet).transfer(amount);
        
        emit Withdrawal(platformWallet, amount);
    }
}
`,

  AuthorizationManager: `
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
        
        authorizations[msg.sender][workId] = block.timestamp;
        
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
`
};

// 编译合约
function compileContracts() {
  console.log('📝 编译智能合约...');
  
  const input = {
    language: 'Solidity',
    sources: {},
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };
  
  // 添加合约源代码
  for (const [name, source] of Object.entries(contracts)) {
    input.sources[`${name}.sol`] = {
      content: source
    };
  }
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    const hasErrors = output.errors.some(error => error.severity === 'error');
    if (hasErrors) {
      console.error('❌ 编译错误:');
      output.errors.forEach(error => {
        if (error.severity === 'error') {
          console.error(\`  \${error.formattedMessage}\`);
        }
      });
      throw new Error('合约编译失败');
    } else {
      console.log('⚠️ 编译警告:');
      output.errors.forEach(error => {
        console.log(\`  \${error.formattedMessage}\`);
      });
    }
  }
  
  const compiledContracts = {};
  
  for (const contractName of Object.keys(contracts)) {
    const contractData = output.contracts[\`\${contractName}.sol\`][contractName];
    compiledContracts[contractName] = {
      abi: contractData.abi,
      bytecode: contractData.evm.bytecode.object
    };
    console.log(\`✅ \${contractName} 编译成功\`);
  }
  
  return compiledContracts;
}

// 部署单个合约
async function deployContract(wallet, contractName, contractData) {
  console.log(\`🚀 部署 \${contractName}...\`);
  
  const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, wallet);
  
  try {
    const contract = await factory.deploy({
      gasLimit: 3000000,
      gasPrice: ethers.parseUnits('20', 'gwei')
    });
    
    console.log(\`⏳ 交易哈希: \${contract.deploymentTransaction().hash}\`);
    console.log(\`⏳ 等待确认...\`);
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(\`✅ \${contractName} 部署成功!\`);
    console.log(\`📍 合约地址: \${address}\`);
    
    return { contract, address };
    
  } catch (error) {
    console.error(\`❌ 部署 \${contractName} 失败:\`, error.message);
    throw error;
  }
}

// 配置合约间的关联
async function configureContracts(contracts) {
  console.log('\\n⚙️ 配置合约间关联...');
  
  const { creationManager, paymentManager, authorizationManager } = contracts;
  
  try {
    // 配置 CreationManager
    console.log('🔧 配置 CreationManager...');
    let tx = await creationManager.contract.setPaymentManager(paymentManager.address);
    await tx.wait();
    console.log('  ✅ PaymentManager 地址已设置');
    
    tx = await creationManager.contract.setAuthorizationManager(authorizationManager.address);
    await tx.wait();
    console.log('  ✅ AuthorizationManager 地址已设置');
    
    // 配置 PaymentManager
    console.log('🔧 配置 PaymentManager...');
    tx = await paymentManager.contract.setCreationManager(creationManager.address);
    await tx.wait();
    console.log('  ✅ CreationManager 地址已设置');
    
    tx = await paymentManager.contract.setAuthorizationManager(authorizationManager.address);
    await tx.wait();
    console.log('  ✅ AuthorizationManager 地址已设置');
    
    // 配置 AuthorizationManager
    console.log('🔧 配置 AuthorizationManager...');
    tx = await authorizationManager.contract.setCreationManager(creationManager.address);
    await tx.wait();
    console.log('  ✅ CreationManager 地址已设置');
    
    tx = await authorizationManager.contract.setPaymentManager(paymentManager.address);
    await tx.wait();
    console.log('  ✅ PaymentManager 地址已设置');
    
    console.log('✅ 合约配置完成!');
    
  } catch (error) {
    console.error('❌ 配置合约失败:', error.message);
    throw error;
  }
}

// 验证配置
async function verifyConfiguration(contracts) {
  console.log('\\n🔍 验证合约配置...');
  
  const { creationManager, paymentManager, authorizationManager } = contracts;
  
  try {
    // 验证 PaymentManager 配置
    const pmCreationManager = await paymentManager.contract.creationManager();
    const pmAuthManager = await paymentManager.contract.authorizationManager();
    
    console.log(\`PaymentManager.creationManager: \${pmCreationManager}\`);
    console.log(\`Expected: \${creationManager.address}\`);
    const pmCmMatch = pmCreationManager.toLowerCase() === creationManager.address.toLowerCase();
    console.log(\`✅ 匹配: \${pmCmMatch}\`);
    
    console.log(\`PaymentManager.authorizationManager: \${pmAuthManager}\`);
    console.log(\`Expected: \${authorizationManager.address}\`);
    const pmAmMatch = pmAuthManager.toLowerCase() === authorizationManager.address.toLowerCase();
    console.log(\`✅ 匹配: \${pmAmMatch}\`);
    
    // 验证 AuthorizationManager 配置
    const amCreationManager = await authorizationManager.contract.creationManager();
    const amPaymentManager = await authorizationManager.contract.paymentManager();
    
    console.log(\`AuthorizationManager.creationManager: \${amCreationManager}\`);
    const amCmMatch = amCreationManager.toLowerCase() === creationManager.address.toLowerCase();
    console.log(\`✅ 匹配: \${amCmMatch}\`);
    
    console.log(\`AuthorizationManager.paymentManager: \${amPaymentManager}\`);
    const amPmMatch = amPaymentManager.toLowerCase() === paymentManager.address.toLowerCase();
    console.log(\`✅ 匹配: \${amPmMatch}\`);
    
    if (pmCmMatch && pmAmMatch && amCmMatch && amPmMatch) {
      console.log('✅ 所有配置验证通过!');
      return true;
    } else {
      console.log('❌ 配置验证失败!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证配置失败:', error.message);
    return false;
  }
}

// 主部署函数
async function deployAllContracts() {
  console.log('🎯 开始自动化部署智能合约到 Sepolia 测试网...\\n');
  
  // 检查环境变量
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    console.log('💡 使用方法: PRIVATE_KEY=your_private_key node scripts/auto-deploy.js');
    process.exit(1);
  }
  
  // 创建 provider 和 wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(\`👤 部署者地址: \${wallet.address}\`);
  
  // 检查余额
  const balance = await provider.getBalance(wallet.address);
  console.log(\`💰 余额: \${ethers.formatEther(balance)} ETH\`);
  
  if (balance < ethers.parseEther('0.02')) {
    console.error('❌ 错误: 余额不足，至少需要 0.02 ETH 来完成部署');
    console.log('💡 请先向该地址转入一些 Sepolia ETH');
    process.exit(1);
  }
  
  try {
    // 编译合约
    const compiledContracts = compileContracts();
    
    // 部署合约
    const creationManager = await deployContract(wallet, 'CreationManager', compiledContracts.CreationManager);
    const paymentManager = await deployContract(wallet, 'PaymentManager', compiledContracts.PaymentManager);
    const authorizationManager = await deployContract(wallet, 'AuthorizationManager', compiledContracts.AuthorizationManager);
    
    const contracts = {
      creationManager,
      paymentManager,
      authorizationManager
    };
    
    // 配置合约间关联
    await configureContracts(contracts);
    
    // 验证配置
    const configValid = await verifyConfiguration(contracts);
    
    if (!configValid) {
      throw new Error('合约配置验证失败');
    }
    
    // 保存部署信息
    const deploymentInfo = {
      network: SEPOLIA_CONFIG.name,
      chainId: SEPOLIA_CONFIG.chainId,
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION: creationManager.address,
        NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT: paymentManager.address,
        NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION: authorizationManager.address
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
    
    console.log('\\n🎉 部署完成!');
    console.log('📋 新的合约地址:');
    console.log(\`NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=\${creationManager.address}\`);
    console.log(\`NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=\${paymentManager.address}\`);
    console.log(\`NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=\${authorizationManager.address}\`);
    
    console.log(\`\\n📄 部署信息已保存到: \${deploymentFile}\`);
    
    console.log('\\n📝 下一步:');
    console.log('1. 复制上面的地址到 .env.local 文件');
    console.log('2. 重启应用程序');
    console.log('3. 测试二创授权和打赏功能');
    
    console.log('\\n🔗 Etherscan 链接:');
    console.log(\`CreationManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${creationManager.address}\`);
    console.log(\`PaymentManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${paymentManager.address}\`);
    console.log(\`AuthorizationManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${authorizationManager.address}\`);
    
    return deploymentInfo;
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('💡 请确保钱包有足够的 Sepolia ETH');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('💡 请检查网络连接和 RPC URL');
    }
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  deployAllContracts().catch(console.error);
}

module.exports = { deployAllContracts };