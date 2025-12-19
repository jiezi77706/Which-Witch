# 合约测试与部署完整指南

## 📋 合约架构概览

### 部署网络分布
- **Sepolia 测试网**: WorkRegistry, CreationRightsNFT, VotingSystem
- **ZetaChain Athens**: ZetaCrossChainPayment

### 核心功能
1. **作品管理** (WorkRegistry)
2. **NFT铸造交易** (CreationRightsNFT) 
3. **社区投票** (VotingSystem)
4. **跨链支付** (ZetaCrossChainPayment)

## 🔧 环境准备

### 1. 安装依赖
```bash
# 安装 Foundry (如果未安装)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 或使用 Node.js 部署脚本
npm install ethers hardhat @openzeppelin/contracts
```

### 2. 环境变量配置
```bash
# .env 文件
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
ZETASCAN_API_KEY=your_zetascan_key

# 测试网 RPC URLs
SEPOLIA_RPC=https://sepolia.infura.io/v3/${INFURA_API_KEY}
ZETA_TESTNET_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# ZetaChain 合约地址 (Athens 测试网)
ZETA_CONNECTOR=0x239e96c8f17C85c30100AC26F635Ea15f23E9c67
```

## 🚀 部署流程

### 第一步: 部署到 Sepolia 测试网

#### 1. 部署 WorkRegistry
```bash
forge create --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/WorkRegistry.sol:WorkRegistry
```

#### 2. 部署 CreationRightsNFT
```bash
forge create --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/CreationRightsNFT.sol:CreationRightsNFT \
  --constructor-args <WORK_REGISTRY_ADDRESS>
```

#### 3. 部署 VotingSystem
```bash
forge create --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verify \
  src/VotingSystem.sol:VotingSystem \
  --constructor-args <WORK_REGISTRY_ADDRESS>
```

### 第二步: 部署到 ZetaChain Athens

#### 部署 ZetaCrossChainPayment
```bash
forge create --rpc-url $ZETA_TESTNET_RPC \
  --private-key $PRIVATE_KEY \
  --verify \
  src/ZetaCrossChainPayment.sol:ZetaCrossChainPayment \
  --constructor-args $ZETA_CONNECTOR
```

### 第三步: 合约配置

#### 1. 授权合约交互
```javascript
// 在 WorkRegistry 中授权其他合约
await workRegistry.authorizeContract(creationRightsNFTAddress, true);
await workRegistry.authorizeContract(votingSystemAddress, true);
```

#### 2. 配置跨链支付
```javascript
// 在 ZetaCrossChainPayment 中配置支持的链
await zetaPayment.configureChain(
  11155111, // Sepolia Chain ID
  true,     // supported
  "0x0000000000000000000000000000000000000000", // target contract
  ethers.utils.parseEther("0.001"), // min amount
  ethers.utils.parseEther("100")    // max amount
);
```

## 🧪 功能测试清单

### A. 基础功能测试

#### 1. WorkRegistry 测试
```javascript
// 测试创建原创作品
const tx1 = await workRegistry.createWork(
  "ipfs://metadata-uri",
  ethers.utils.parseEther("0.1"), // license fee
  true, // allow remix
  0     // parent work id (0 for original)
);

// 测试创建衍生作品
const tx2 = await workRegistry.createWork(
  "ipfs://derivative-metadata",
  ethers.utils.parseEther("0.05"),
  true,
  1 // parent work id
);

// 验证作品信息
const work = await workRegistry.getWork(1);
console.log("Work creator:", work.creator);
console.log("Creation type:", work.creationType);
```

#### 2. CreationRightsNFT 测试
```javascript
// 测试 NFT 铸造
const mintTx = await creationRightsNFT.mintWorkNFT(1);
const tokenId = await creationRightsNFT.getWorkNFTId(1);

// 测试 NFT 市场功能
await creationRightsNFT.listNFT(tokenId, ethers.utils.parseEther("1"));
await creationRightsNFT.buyNFT(tokenId, { value: ethers.utils.parseEther("1") });
```

#### 3. VotingSystem 测试
```javascript
// 测试创建投票
const votingTx = await votingSystem.createVoting(
  1, // work id
  "Choose character design",
  "Vote for your favorite character design",
  0, // VotingType.CHARACTER_DESIGN
  ["Design A", "Design B", "Design C"],
  86400, // 1 day duration
  ethers.utils.parseEther("0.01") // min stake
);

// 测试参与投票
await votingSystem.vote(1, 0, { value: ethers.utils.parseEther("0.1") });

// 测试结束投票和提取质押
await votingSystem.endVoting(1);
await votingSystem.withdrawStake(1);
```

### B. 跨链支付测试

#### 1. 同链支付测试 (ZetaChain → ZetaChain)
```javascript
const tipTx = await zetaPayment.initiateCrossChainTipZeta(
  recipientAddress,
  123, // work id
  7001, // ZetaChain Athens chain id
  { value: ethers.utils.parseEther("0.1") }
);
```

#### 2. 跨链支付测试 (ZetaChain → Sepolia)
```javascript
const crossChainTx = await zetaPayment.initiateCrossChainTipZeta(
  recipientAddress,
  123, // work id  
  11155111, // Sepolia chain id
  { value: ethers.utils.parseEther("0.1") }
);
```

#### 3. ZRC20 代币支付测试
```javascript
// 使用 ZRC20 ETH 代币
const zrc20ETH = "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921";
await zetaPayment.initiateCrossChainTip(
  recipientAddress,
  123,
  11155111,
  zrc20ETH,
  ethers.utils.parseEther("0.1")
);
```

## 📊 监控和验证

### 1. 事件监听
```javascript
// 监听跨链支付事件
zetaPayment.on("CrossChainPaymentInitiated", (paymentId, sender, recipient, amount) => {
  console.log(`Payment ${paymentId}: ${amount} from ${sender} to ${recipient}`);
});

zetaPayment.on("CrossChainPaymentCompleted", (paymentId, success, reason) => {
  console.log(`Payment ${paymentId} completed: ${success}, reason: ${reason}`);
});

// 监听投票事件
votingSystem.on("VotingCreated", (votingId, workId, creator, title) => {
  console.log(`New voting ${votingId} created for work ${workId}: ${title}`);
});

votingSystem.on("VoteCast", (votingId, voter, optionId, stakedAmount) => {
  console.log(`Vote cast in ${votingId}: option ${optionId}, stake ${stakedAmount}`);
});
```

### 2. 区块链浏览器验证
- **Sepolia**: https://sepolia.etherscan.io/
- **ZetaChain Athens**: https://athens3.zetachain.com/

### 3. 状态查询脚本
```javascript
// 检查合约状态
async function checkContractStatus() {
  // WorkRegistry 状态
  const totalWorks = await workRegistry.totalWorks();
  console.log(`Total works: ${totalWorks}`);
  
  // NFT 状态
  const nextTokenId = await creationRightsNFT.nextTokenId();
  console.log(`Next NFT token ID: ${nextTokenId}`);
  
  // 投票状态
  const nextVotingId = await votingSystem.nextVotingId();
  console.log(`Next voting ID: ${nextVotingId}`);
  
  // 跨链支付状态
  const nextPaymentId = await zetaPayment.nextPaymentId();
  console.log(`Next payment ID: ${nextPaymentId}`);
  
  // 平台费用
  const platformBalance = await zetaPayment.getPlatformBalance("ETH");
  console.log(`Platform ETH balance: ${ethers.utils.formatEther(platformBalance)}`);
}
```

## ✅ 成功标准

### 部署成功标准
- [ ] 所有合约成功部署到对应网络
- [ ] 合约地址在区块链浏览器中可验证
- [ ] 合约所有者设置正确
- [ ] 合约间授权配置完成

### 功能测试成功标准
- [ ] 可以创建原创作品和衍生作品
- [ ] NFT 铸造和交易功能正常
- [ ] 投票创建、参与、结束流程完整
- [ ] 同链和跨链支付都能成功执行
- [ ] 所有事件正确触发
- [ ] 费用计算和分配准确

### 性能和安全标准
- [ ] Gas 费用在合理范围内
- [ ] 重入攻击防护有效
- [ ] 权限控制正确实施
- [ ] 错误处理机制完善

## 🔧 故障排除

### 常见问题
1. **构造函数错误**: 确保 OpenZeppelin 版本兼容
2. **跨链支付失败**: 检查 ZetaConnector 地址和网络配置
3. **权限错误**: 验证合约授权设置
4. **Gas 不足**: 调整 gas limit 设置

### 调试工具
- 使用 `console.log` 在合约中调试
- 利用 Foundry 的 `forge test -vvv` 详细输出
- 检查交易回执和事件日志

这个指南提供了完整的测试和部署流程，确保合约功能的完整性和可靠性。