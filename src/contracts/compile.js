const fs = require('fs');
const path = require('path');
const solc = require('solc');

// 读取合约源码
function readContract(contractPath) {
  const fullPath = path.resolve(__dirname, contractPath);
  return fs.readFileSync(fullPath, 'utf8');
}

// 编译合约
function compileContract() {
  console.log('📦 Compiling ZetaCrossChainPayment contract...');

  // 读取主合约
  const contractSource = readContract('zeta/ZetaCrossChainPayment.sol');

  // 构建输入对象
  const input = {
    language: 'Solidity',
    sources: {
      'ZetaCrossChainPayment.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  // 编译
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // 检查编译错误
  if (output.errors) {
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error('❌ Compilation error:', error.formattedMessage);
      } else {
        console.warn('⚠️ Compilation warning:', error.formattedMessage);
      }
    });
  }

  // 获取编译结果
  const contract = output.contracts['ZetaCrossChainPayment.sol']['ZetaCrossChainPayment'];
  
  if (!contract) {
    throw new Error('Contract compilation failed');
  }

  // 创建build目录
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }

  // 保存ABI
  const abi = contract.abi;
  fs.writeFileSync(
    path.join(buildDir, 'ZetaCrossChainPayment.abi.json'),
    JSON.stringify(abi, null, 2)
  );

  // 保存字节码
  const bytecode = contract.evm.bytecode.object;
  fs.writeFileSync(
    path.join(buildDir, 'ZetaCrossChainPayment.bin'),
    bytecode
  );

  // 保存完整的编译输出
  fs.writeFileSync(
    path.join(buildDir, 'ZetaCrossChainPayment.json'),
    JSON.stringify({
      contractName: 'ZetaCrossChainPayment',
      abi: abi,
      bytecode: '0x' + bytecode,
      deployedBytecode: '0x' + contract.evm.deployedBytecode.object,
      compiler: {
        name: 'solc',
        version: solc.version()
      }
    }, null, 2)
  );

  console.log('✅ Compilation successful!');
  console.log(`📁 ABI saved to: build/ZetaCrossChainPayment.abi.json`);
  console.log(`📁 Bytecode saved to: build/ZetaCrossChainPayment.bin`);
  console.log(`📁 Full output saved to: build/ZetaCrossChainPayment.json`);

  return {
    abi,
    bytecode: '0x' + bytecode
  };
}

// 更新部署脚本
function updateDeployScript(abi, bytecode) {
  const deployScriptPath = path.join(__dirname, 'deploy.js');
  let deployScript = fs.readFileSync(deployScriptPath, 'utf8');

  // 替换ABI
  deployScript = deployScript.replace(
    /const contractABI = \[[\s\S]*?\];/,
    `const contractABI = ${JSON.stringify(abi, null, 2)};`
  );

  // 替换字节码
  deployScript = deployScript.replace(
    /const contractBytecode = "0x";/,
    `const contractBytecode = "${bytecode}";`
  );

  fs.writeFileSync(deployScriptPath, deployScript);
  console.log('✅ Deploy script updated with compiled contract data');
}

// 主函数
async function main() {
  try {
    const { abi, bytecode } = compileContract();
    updateDeployScript(abi, bytecode);
    
    console.log('\n🎉 Ready for deployment!');
    console.log('📋 Next steps:');
    console.log('   1. Set PRIVATE_KEY environment variable');
    console.log('   2. Run: npm run deploy:testnet');
    console.log('   3. Configure the deployed contract');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { compileContract, updateDeployScript };