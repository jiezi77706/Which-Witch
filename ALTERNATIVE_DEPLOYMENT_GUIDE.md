# ZetaChain合约部署 - 备选方案

由于网络问题无法安装Foundry，我们提供两种备选部署方案：

## 方案1: 使用Node.js + ethers.js部署

### 1. 安装依赖
```bash
cd src/contracts
npm install
```

### 2. 编译合约
```bash
# 安装solc编译器
npm install -g solc

# 编译合约
solc --abi --bin --optimize --overwrite -o build/ zeta/ZetaCrossChainPayment.sol
```

### 3. 配置环境变量
```bash
export PRIVATE_KEY="your_private_key_here"
export CONTRACT_ADDRESS="deployed_contract_address" # 配置时需要
```

### 4. 部署合约
```bash
# 部署到测试网
npm run deploy:testnet

# 配置合约
npm run configure:testnet
```

## 方案2: 使用Remix IDE部署

### 1. 打开Remix IDE
访问 https://remix.ethereum.org/

### 2. 创建合约文件
1. 在Remix中创建新文件 `ZetaCrossChainPayment.sol`
2. 复制合约代码到文件中
3. 安装OpenZeppelin依赖

### 3. 编译合约
1. 在Solidity Compiler标签页
2. 选择编译器版本 0.8.20
3. 启用优化器
4. 点击编译

### 4. 部署合约
1. 切换到Deploy & Run标签页
2. 选择环境为 "Injected Provider - MetaMask"
3. 连接到ZetaChain网络
4. 填入构造函数参数（ZetaConnector地址）
5. 点击部署

## 方案3: 等待网络恢复后使用Foundry

如果网络连接恢复，可以继续使用Foundry：

### 1. 重新尝试安装
```bash
# 重新加载环境
source ~/.zshenv

# 或者手动设置PATH
export PATH="$HOME/.foundry/bin:$PATH"

# 重新运行foundryup
foundryup
```

### 2. 验证安装
```bash
forge --version
cast --version
anvil --version
```

### 3. 使用Makefile部署
```bash
cd src/contracts
make install
make build
make test
make deploy-zeta-testnet
```

## ZetaChain网络配置

### MetaMask网络配置
添加ZetaChain Athens测试网到MetaMask：

- **网络名称**: ZetaChain Athens Testnet
- **RPC URL**: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
- **链ID**: 7001
- **货币符号**: ZETA
- **区块浏览器**: https://zetachain-athens-3.blockscout.com/

### 获取测试代币
访问 https://labs.zetachain.com/get-zeta 获取测试ZETA代币

## 合约构造函数参数

部署时需要提供ZetaConnector地址：

- **测试网**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- **主网**: 待确认

## 部署后验证

部署成功后，验证以下配置：

1. **合约owner**: 应该是你的部署地址
2. **ZetaConnector**: 应该是正确的连接器地址
3. **平台费率**: 应该是250（2.5%）
4. **支持的链**: Ethereum, BSC, Polygon, Base, Sepolia
5. **支持的币种**: ETH, BTC, USDC, USDT, BNB, MATIC

## 测试合约功能

### 使用cast命令测试（如果有Foundry）
```bash
# 测试跨链打赏
cast send $CONTRACT_ADDRESS \
  "initiateCrossChainTip(address,uint256,uint256,string)" \
  0x接收者地址 \
  123 \
  11155111 \
  "ETH" \
  --value 0.1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

### 使用ethers.js测试
```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

// 测试跨链打赏
const tx = await contract.initiateCrossChainTip(
  '0x接收者地址',
  123,
  11155111,
  'ETH',
  { value: ethers.parseEther('0.1') }
);

console.log('Transaction hash:', tx.hash);
await tx.wait();
console.log('Transaction confirmed');
```

## 故障排除

### 常见问题

1. **网络连接问题**
   - 检查VPN设置
   - 尝试使用不同的网络
   - 使用手机热点

2. **MetaMask连接问题**
   - 确保选择了正确的网络
   - 检查账户余额
   - 重新连接钱包

3. **合约部署失败**
   - 检查Gas费用设置
   - 确保有足够的ZETA代币
   - 验证构造函数参数

4. **编译错误**
   - 检查Solidity版本
   - 确保导入路径正确
   - 验证OpenZeppelin版本

## 下一步

部署成功后：

1. **记录合约地址**: 保存到环境变量和配置文件
2. **验证合约**: 在区块浏览器上验证源码
3. **配置前端**: 更新前端应用的合约地址
4. **测试功能**: 进行完整的功能测试
5. **部署其他合约**: 继续部署Sepolia网络上的合约

## 联系支持

如果遇到问题：
- 查看ZetaChain官方文档
- 加入ZetaChain Discord社区
- 检查GitHub Issues