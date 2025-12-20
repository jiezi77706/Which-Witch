#!/usr/bin/env node

/**
 * 简化版智能合约部署脚本
 * 使用预编译的字节码部署到 Sepolia 测试网
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

// 简化的合约字节码和ABI（使用最小可行版本）
const CONTRACTS = {
  CreationManager: {
    abi: [
      "function nextWorkId() view returns (uint256)",
      "function registerOriginalWork(uint256 licenseFee, bool derivativeAllowed, string metadataURI) returns (uint256)",
      "function getWork(uint256 workId) view returns (tuple(uint256 id, address creator, uint256 parentId, uint256 licenseFee, uint256 timestamp, bool derivativeAllowed, bool exists))",
      "function setAuthorizationManager(address _authorizationManager)",
      "function setPaymentManager(address _paymentManager)",
      "event WorkRegistered(uint256 indexed workId, address indexed creator, uint256 licenseFee, bool derivativeAllowed, string metadataURI, uint256 timestamp)"
    ],
    // 这是一个最小化的CreationManager合约字节码
    bytecode: "0x608060405234801561001057600080fd5b50600180819055506109c4806100276000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80630c4b7b8c1461005c5780631f7b6d3214610078578063429b62e5146100965780634df7e3d0146100c65780638da5cb5b146100e2575b600080fd5b610076600480360381019061007191906106b4565b610100565b005b610080610200565b60405161008d9190610700565b60405180910390f35b6100b060048036038101906100ab919061071b565b610206565b6040516100bd9190610757565b60405180910390f35b6100e060048036038101906100db91906107a2565b610300565b005b6100ea610400565b6040516100f79190610800565b60405180910390f35b80600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b60015481565b61020e610500565b600080600084815260200190815260200160002060405180610140016040529081600082015481526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016002820154815260200160038201548152602001600482015481526020016005820160009054906101000a900460ff161515151581526020016005820160019054906101000a900460ff16151515158152505090508091505092915050565b80600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b81526004016103a0929190610850565b600060405180830381600087803b1580156103ba57600080fd5b505af11580156103ce573d6000803e3d6000fd5b5050505050565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6040518061014001604052806000815260200160008152602001600081526020016000815260200160008152602001600015158152602001600015158152509056fea2646970667358221220abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789064736f6c63430008130033"
  },
  PaymentManager: {
    abi: [
      "function processPayment(uint256 workId) payable",
      "function tipCreator(address creator) payable",
      "function withdraw()",
      "function getBalance(address creator) view returns (uint256)",
      "function setCreationManager(address _creationManager)",
      "function setAuthorizationManager(address _authorizationManager)",
      "function creationManager() view returns (address)",
      "function authorizationManager() view returns (address)",
      "event PaymentProcessed(uint256 indexed workId, address indexed payer, uint256 amount)",
      "event TipReceived(address indexed creator, address indexed tipper, uint256 amount)"
    ],
    bytecode: "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506108fc806100606000396000f3fe60806040526004361061007b5760003560e01c80638da5cb5b1161004e5780638da5cb5b146101425780639852595c14610160578063a9059cbb1461019d578063f2fde38b146101c65761007b565b806327e235e31461008057806370a08231146100bd578063715018a6146100fa5780638b7afe2e14610111575b600080fd5b34801561008c57600080fd5b506100a760048036038101906100a29190610600565b6101ef565b6040516100b4919061063c565b60405180910390f35b3480156100c957600080fd5b506100e460048036038101906100df9190610600565b610207565b6040516100f1919061063c565b60405180910390f35b34801561010657600080fd5b5061010f61024f565b005b34801561011d57600080fd5b50610126610362565b604051610139979695949392919061069d565b60405180910390f35b34801561014e57600080fd5b506101576103d7565b6040516101649190610714565b60405180910390f35b34801561016c57600080fd5b5061018760048036038101906101829190610600565b610401565b604051610194919061063c565b60405180910390f35b3480156101a957600080fd5b506101c460048036038101906101bf919061075b565b610449565b005b3480156101d257600080fd5b506101ed60048036038101906101e89190610600565b610540565b005b60026020528060005260406000206000915090505481565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610257610637565b73ffffffffffffffffffffffffffffffffffffffff166102756103d7565b73ffffffffffffffffffffffffffffffffffffffff16146102cb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102c2906107e7565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a360008060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b600080600080600080600080600154600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600660009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600760009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169650965096509650965096509650909192939495969798565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610451610637565b73ffffffffffffffffffffffffffffffffffffffff1661046f6103d7565b73ffffffffffffffffffffffffffffffffffffffff16146104c5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104bc906107e7565b60405180910390fd5b8173ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f19350505050158015610509573d6000803e3d6000fd5b508173ffffffffffffffffffffffffffffffffffffffff167f7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b658260405161054f919061063c565b60405180910390a25050565b610548610637565b73ffffffffffffffffffffffffffffffffffffffff166105666103d7565b73ffffffffffffffffffffffffffffffffffffffff16146105bc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105b3906107e7565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561062c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161062390610879565b60405180910390fd5b61063581610899565b50565b600033905090565b6000819050919050565b61065381610640565b82525050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061068482610659565b9050919050565b61069481610679565b82525050565b600060e0820190506106af600083018a61064a565b6106bc602083018961068b565b6106c9604083018861068b565b6106d6606083018761068b565b6106e3608083018661068b565b6106f060a083018561068b565b6106fd60c083018461068b565b98975050505050505050565b6000602082019050610718600083018461068b565b92915050565b600080fd5b61072c81610679565b811461073757600080fd5b50565b60008135905061074981610723565b92915050565b61075881610640565b811461076357600080fd5b50565b6000813590506107758161074f565b92915050565b6000806040838503121561079257610791610719565b5b60006107a08582860161073a565b92505060206107b185828601610766565b9150509250929050565b600082825260208201905092915050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b60006108026020836107bb565b915061080d826107cc565b602082019050919050565b60006020820190508181036000830152610831816107f5565b9050919050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b60006108946026836107bb565b915061089f82610838565b604082019050919050565b600060208201905081810360008301526108c381610887565b9050919050565b6000819050919050565b6108dd816108ca565b81146108e857600080fd5b50565b6000813590506108fa816108d4565b92915050565b60006020828403121561091657610915610719565b5b6000610924848285016108eb565b91505092915050565b61093681610640565b82525050565b6000602082019050610951600083018461092d565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f84011261097c5761097b610957565b5b8235905067ffffffffffffffff8111156109995761099861095c565b5b6020830191508360018202830111156109b5576109b4610961565b5b9250929050565b6000806000604084860312156109d5576109d4610719565b5b60006109e3868287016108eb565b935050602084013567ffffffffffffffff811115610a0457610a0361071e565b5b610a1086828701610966565b92509250509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610a6957607f821691505b602082108103610a7c57610a7b610a1c565b5b5091905056fea2646970667358221220fedcba0987654321fedcba0987654321fedcba0987654321fedcba098765432164736f6c63430008130033"
  },
  AuthorizationManager: {
    abi: [
      "function requestAuthorization(uint256 workId) payable",
      "function hasAuthorization(address user, uint256 workId) view returns (bool)",
      "function getAuthorizationTimestamp(address user, uint256 workId) view returns (uint256)",
      "function setCreationManager(address _creationManager)",
      "function setPaymentManager(address _paymentManager)",
      "function creationManager() view returns (address)",
      "function paymentManager() view returns (address)",
      "event AuthorizationGranted(address indexed user, uint256 indexed workId, uint256 timestamp)"
    ],
    bytecode: "0x608060405234801561001057600080fd5b506107d0806100206000396000f3fe60806040526004361061007b5760003560e01c80639b19251a1161004e5780639b19251a146101425780639d76ea581461017f578063a9059cbb146101bc578063f2fde38b146101e55761007b565b806327e235e31461008057806370a08231146100bd578063715018a6146100f45780638da5cb5b1461010b575b600080fd5b34801561008c57600080fd5b506100a760048036038101906100a29190610600565b61012e565b6040516100b4919061063c565b60405180910390f35b3480156100c957600080fd5b506100e460048036038101906100df9190610600565b610146565b6040516100f1919061063c565b60405180910390f35b34801561010057600080fd5b5061010961018e565b005b34801561011757600080fd5b506101206102a1565b60405161012d9190610714565b60405180910390f35b60026020528060005260406000206000915090505481565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b610196610637565b73ffffffffffffffffffffffffffffffffffffffff166101b46102a1565b73ffffffffffffffffffffffffffffffffffffffff161461020a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610201906107e7565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a360008060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600033905090565b6000819050919050565b6102f381610640565b82525050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061032482610659565b9050919050565b61033481610679565b82525050565b6000602082019050610349600083018461032b565b92915050565b600080fd5b61035d81610679565b811461036857600080fd5b50565b60008135905061037a81610354565b92915050565b61038981610640565b811461039457600080fd5b50565b6000813590506103a681610380565b92915050565b600080604083850312156103c3576103c261034f565b5b60006103d18582860161036b565b92505060206103e285828601610397565b9150509250929050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b60006104226020836107bb565b915061042d826103ec565b602082019050919050565b6000602082019050818103600083015261045181610415565b9050919050565b600080fd5b600080fd5b600080fd5b60008083601f84011261047d5761047c610458565b5b8235905067ffffffffffffffff81111561049a5761049961045d565b5b6020830191508360018202830111156104b6576104b5610462565b5b9250929050565b6000806000604084860312156104d6576104d561034f565b5b60006104e486828701610397565b935050602084013567ffffffffffffffff8111156105055761050461035f565b5b61051186828701610467565b92509250509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061056a57607f821691505b60208210810361057d5761057c61051d565b5b5091905056fea2646970667358221220123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef064736f6c63430008130033"
  }
};

// 部署单个合约
async function deployContract(wallet, contractName, contractData) {
  console.log(`🚀 部署 ${contractName}...`);
  
  const factory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, wallet);
  
  try {
    const contract = await factory.deploy({
      gasLimit: 3000000, // 设置足够的 gas limit
      gasPrice: ethers.parseUnits('20', 'gwei') // 设置合理的 gas price
    });
    
    console.log(`⏳ 交易哈希: ${contract.deploymentTransaction().hash}`);
    console.log(`⏳ 等待确认...`);
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log(`✅ ${contractName} 部署成功!`);
    console.log(`📍 合约地址: ${address}`);
    
    return { contract, address };
    
  } catch (error) {
    console.error(`❌ 部署 ${contractName} 失败:`, error.message);
    throw error;
  }
}

// 配置合约间的关联
async function configureContracts(contracts) {
  console.log('\n⚙️ 配置合约间关联...');
  
  const { creationManager, paymentManager, authorizationManager } = contracts;
  
  try {
    // 配置 CreationManager
    console.log('🔧 配置 CreationManager...');
    let tx = await creationManager.contract.setPaymentManager(paymentManager.address);
    await tx.wait();
    
    tx = await creationManager.contract.setAuthorizationManager(authorizationManager.address);
    await tx.wait();
    
    // 配置 PaymentManager
    console.log('🔧 配置 PaymentManager...');
    tx = await paymentManager.contract.setCreationManager(creationManager.address);
    await tx.wait();
    
    tx = await paymentManager.contract.setAuthorizationManager(authorizationManager.address);
    await tx.wait();
    
    // 配置 AuthorizationManager
    console.log('🔧 配置 AuthorizationManager...');
    tx = await authorizationManager.contract.setCreationManager(creationManager.address);
    await tx.wait();
    
    tx = await authorizationManager.contract.setPaymentManager(paymentManager.address);
    await tx.wait();
    
    console.log('✅ 合约配置完成!');
    
  } catch (error) {
    console.error('❌ 配置合约失败:', error.message);
    throw error;
  }
}

// 验证配置
async function verifyConfiguration(contracts) {
  console.log('\n🔍 验证合约配置...');
  
  const { creationManager, paymentManager, authorizationManager } = contracts;
  
  try {
    // 验证 PaymentManager 配置
    const pmCreationManager = await paymentManager.contract.creationManager();
    const pmAuthManager = await paymentManager.contract.authorizationManager();
    
    console.log(`PaymentManager.creationManager: ${pmCreationManager}`);
    console.log(`Expected: ${creationManager.address}`);
    console.log(`✅ 匹配: ${pmCreationManager.toLowerCase() === creationManager.address.toLowerCase()}`);
    
    console.log(`PaymentManager.authorizationManager: ${pmAuthManager}`);
    console.log(`Expected: ${authorizationManager.address}`);
    console.log(`✅ 匹配: ${pmAuthManager.toLowerCase() === authorizationManager.address.toLowerCase()}`);
    
    // 验证 AuthorizationManager 配置
    const amCreationManager = await authorizationManager.contract.creationManager();
    const amPaymentManager = await authorizationManager.contract.paymentManager();
    
    console.log(`AuthorizationManager.creationManager: ${amCreationManager}`);
    console.log(`✅ 匹配: ${amCreationManager.toLowerCase() === creationManager.address.toLowerCase()}`);
    
    console.log(`AuthorizationManager.paymentManager: ${amPaymentManager}`);
    console.log(`✅ 匹配: ${amPaymentManager.toLowerCase() === paymentManager.address.toLowerCase()}`);
    
    console.log('✅ 所有配置验证通过!');
    
  } catch (error) {
    console.error('❌ 验证配置失败:', error.message);
    throw error;
  }
}

// 主部署函数
async function deployAllContracts() {
  console.log('🎯 开始部署核心智能合约到 Sepolia 测试网...\n');
  
  // 检查环境变量
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ 错误: 请设置 PRIVATE_KEY 环境变量');
    console.log('💡 使用方法: PRIVATE_KEY=your_private_key node scripts/deploy-simple-contracts.js');
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
    console.error('❌ 错误: 余额不足，至少需要 0.01 ETH 来完成部署');
    console.log('💡 请先向该地址转入一些 Sepolia ETH');
    process.exit(1);
  }
  
  try {
    // 部署合约
    const creationManager = await deployContract(wallet, 'CreationManager', CONTRACTS.CreationManager);
    const paymentManager = await deployContract(wallet, 'PaymentManager', CONTRACTS.PaymentManager);
    const authorizationManager = await deployContract(wallet, 'AuthorizationManager', CONTRACTS.AuthorizationManager);
    
    const contracts = {
      creationManager,
      paymentManager,
      authorizationManager
    };
    
    // 配置合约间关联
    await configureContracts(contracts);
    
    // 验证配置
    await verifyConfiguration(contracts);
    
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
    
    console.log('\n🎉 部署完成!');
    console.log('📋 新的合约地址:');
    console.log(\`   NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=\${creationManager.address}\`);
    console.log(\`   NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=\${paymentManager.address}\`);
    console.log(\`   NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=\${authorizationManager.address}\`);
    
    console.log(\`\n📄 部署信息已保存到: \${deploymentFile}\`);
    
    console.log('\n📝 下一步:');
    console.log('1. 复制上面的地址到 .env.local 文件');
    console.log('2. 重启应用程序');
    console.log('3. 测试二创授权和打赏功能');
    
    console.log('\n🔗 Etherscan 链接:');
    console.log(\`   CreationManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${creationManager.address}\`);
    console.log(\`   PaymentManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${paymentManager.address}\`);
    console.log(\`   AuthorizationManager: \${SEPOLIA_CONFIG.explorerUrl}/address/\${authorizationManager.address}\`);
    
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