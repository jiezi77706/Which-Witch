# WhichWitch 模块化合约系统

## 概述

根据需求重新设计了模块化的合约系统，将功能分离到不同的合约中，并按网络进行部署：

- **Sepolia网络**: 核心功能合约（作品管理、NFT、投票）
- **ZetaChain网络**: 跨链支付合约

## 合约架构

### Sepolia网络合约

#### 1. WorkRegistry.sol - 作品注册管理
**功能**：
- ✅ 作品创建和管理
- ✅ 创作类型自动判断（原创/作者延续/授权衍生）
- ✅ 作品信息查询
- ✅ 衍生作品关系管理
- ✅ 合约授权管理

**核心特性**：
- 纯粹的数据管理，不包含支付逻辑
- 自动判断创作关系类型
- 为其他合约提供作品验证接口

#### 2. CreationRightsNFT.sol - 创作权NFT
**功能**：
- ✅ ERC721 NFT铸造（1个NFT = 1个作品创作权）
- ✅ NFT市场功能（挂售、购买、取消）
- ✅ 创作权转移
- ✅ 平台费用管理

**核心特性**：
- 只有作品创作者可以铸造NFT
- 内置简单的NFT市场
- 自动平台费用计算（2.5%）
- 转移时自动取消挂售

#### 3. VotingSystem.sol - 投票系统
**功能**：
- ✅ 作品相关投票创建（仅创作者）
- ✅ Sepolia ETH质押投票
- ✅ 多种投票类型支持
- ✅ 质押提取功能
- ✅ 批量操作支持

**核心特性**：
- 质押Sepolia ETH参与投票
- 投票结束后可提取质押
- 支持批量提取多个投票的质押
- 灵活的投票时长和最小质押配置

### ZetaChain网络合约

#### 4. ZetaCrossChainPayment.sol - 跨链支付
**功能**：
- ✅ 跨链打赏
- ✅ 跨链授权费支付
- ✅ 跨链NFT购买
- ✅ 多币种支持（ETH, BTC, USDC, USDT, BNB, MATIC）
- ✅ 多链支持（Ethereum, BSC, Polygon, Base, Sepolia）

**核心特性**：
- 使用ZetaChain的跨链能力
- 支持多种加密货币
- 自动平台费用计算
- 灵活的链配置管理

## 部署方案

### Sepolia网络部署顺序

```javascript
// 1. 部署WorkRegistry
const workRegistry = await WorkRegistry.deploy();

// 2. 部署CreationRightsNFT
const creationRightsNFT = await CreationRightsNFT.deploy(workRegistry.address);

// 3. 部署VotingSystem
const votingSystem = await VotingSystem.deploy(workRegistry.address);

// 4. 授权合约访问WorkRegistry
await workRegistry.authorizeContract(creationRightsNFT.address, true);
await workRegistry.authorizeContract(votingSystem.address, true);
```

### ZetaChain网络部署

```javascript
// 部署跨链支付合约
const zetaPayment = await ZetaCrossChainPayment.deploy(zetaConnectorAddress);

// 配置目标链合约地址（如果需要）
await zetaPayment.configureChain(11155111, true, sepoliaReceiverAddress, minAmount, maxAmount);
```

## 功能流程

### 1. 作品创建流程

```
用户 → WorkRegistry.createWork()
  ↓
  自动判断创作类型
  ↓
  如果是衍生作品 → 需要通过ZetaChain支付授权费
  ↓
  作品记录创建完成
  ↓
  可选：CreationRightsNFT.mintWorkNFT() 铸造创作权NFT
```

### 2. 跨链支付流程

```
用户在任意链 → ZetaCrossChainPayment.initiateCrossChainTip/LicenseFee/NFTPurchase()
  ↓
  ZetaChain处理跨链消息
  ↓
  目标链接收支付
  ↓
  资金转给接收者
```

### 3. 投票流程

```
作品创作者 → VotingSystem.createVoting()
  ↓
  粉丝质押Sepolia ETH → VotingSystem.vote()
  ↓
  投票结束 → VotingSystem.endVoting()
  ↓
  用户提取质押 → VotingSystem.withdrawStake()
```

### 4. NFT交易流程

```
创作者铸造NFT → CreationRightsNFT.mintWorkNFT()
  ↓
  挂售NFT → CreationRightsNFT.listNFT()
  ↓
  买家购买 → CreationRightsNFT.buyNFT()
  ↓
  创作权转移完成
```

## 关键设计决策

### 1. 模块化分离
- **作品管理** 与 **支付逻辑** 分离
- **NFT功能** 与 **投票功能** 独立
- **跨链支付** 单独部署在ZetaChain

### 2. 网络分工
- **Sepolia**: 核心业务逻辑，使用Sepolia ETH质押
- **ZetaChain**: 跨链支付，支持多币种

### 3. 权限管理
- WorkRegistry作为权威数据源
- 其他合约通过接口验证权限
- 灵活的合约授权机制

### 4. 费用结构
- 平台费率：2.5%
- 支持多币种费用收取
- 分别在不同网络管理费用

## 测试场景

### 场景1：原创作品创建和NFT铸造
```javascript
// Sepolia网络
const tx1 = await workRegistry.createWork(
  "ipfs://metadata1",
  ethers.parseEther("0.1"), // 授权费
  true,                      // 允许二创
  0                          // 无父作品
);

const tx2 = await creationRightsNFT.mintWorkNFT(1);
```

### 场景2：跨链打赏
```javascript
// ZetaChain网络
const tx = await zetaPayment.initiateCrossChainTip(
  creatorAddress,
  1,        // workId
  11155111, // Sepolia
  "ETH",    // 币种
  { value: ethers.parseEther("0.5") }
);
```

### 场景3：质押投票
```javascript
// Sepolia网络
// 1. 创作者发起投票
const tx1 = await votingSystem.createVoting(
  1,  // workId
  "Choose character design",
  "Description",
  0,  // VotingType.CHARACTER_DESIGN
  ["Design A", "Design B"],
  86400, // 24小时
  ethers.parseEther("0.01") // 最小质押
);

// 2. 用户质押投票
const tx2 = await votingSystem.vote(1, 0, {
  value: ethers.parseEther("0.1") // 质押0.1 Sepolia ETH
});

// 3. 投票结束后提取质押
await votingSystem.withdrawStake(1);
```

### 场景4：NFT市场交易
```javascript
// Sepolia网络
// 1. 挂售NFT
await creationRightsNFT.listNFT(1, ethers.parseEther("1.0"));

// 2. 购买NFT
await creationRightsNFT.buyNFT(1, {
  value: ethers.parseEther("1.0")
});
```

## 与数据库集成

### 事件监听配置
```javascript
// 监听作品创建事件
workRegistry.on("WorkCreated", async (workId, creator, creationType, parentWorkId, metadataURI) => {
  await saveWorkToDatabase({
    workId,
    creatorAddress: creator,
    creationType,
    parentWorkId,
    metadataURI
  });
});

// 监听投票创建事件
votingSystem.on("VotingCreated", async (votingId, workId, creator, title, votingType, endTime) => {
  await saveVotingToDatabase({
    votingId,
    workId,
    creatorAddress: creator,
    title,
    votingType,
    endTime
  });
});

// 监听跨链支付事件
zetaPayment.on("CrossChainPaymentInitiated", async (paymentId, sender, recipient, amount, paymentType) => {
  await savePaymentToDatabase({
    paymentId,
    sender,
    recipient,
    amount,
    paymentType
  });
});
```

## 安全特性

### 1. 权限控制
- 只有作品创作者可以铸造NFT
- 只有作品创作者可以发起投票
- 合约间通过接口验证权限

### 2. 重入保护
- 所有涉及ETH转账的函数使用`nonReentrant`
- 状态更新在转账之前完成

### 3. 输入验证
- 地址非零检查
- 金额范围验证
- 参数有效性检查

### 4. 费用保护
- 平台费率上限限制
- 多余ETH自动退还
- 分币种费用管理

## Gas优化

### 1. 存储优化
- 使用映射而非数组存储
- 批量操作支持
- 事件记录关键信息

### 2. 计算优化
- 预计算常用值
- 避免重复查询
- 优化循环逻辑

## 部署配置

### Sepolia网络配置
```json
{
  "network": "sepolia",
  "contracts": {
    "WorkRegistry": "0x...",
    "CreationRightsNFT": "0x...",
    "VotingSystem": "0x..."
  },
  "settings": {
    "platformFeeRate": 250,
    "minVotingDuration": 3600,
    "maxVotingDuration": 2592000
  }
}
```

### ZetaChain网络配置
```json
{
  "network": "zetachain",
  "contracts": {
    "ZetaCrossChainPayment": "0x..."
  },
  "supportedChains": {
    "1": "ethereum",
    "56": "bsc", 
    "137": "polygon",
    "8453": "base",
    "11155111": "sepolia"
  },
  "supportedCurrencies": ["ETH", "BTC", "USDC", "USDT", "BNB", "MATIC"]
}
```

## 未来扩展

### 1. 新功能模块
- 版税分配合约
- 治理投票合约
- 流动性挖矿合约

### 2. 跨链扩展
- 支持更多区块链网络
- 集成更多跨链协议
- 支持更多加密货币

### 3. 高级功能
- NFT分片所有权
- 动态版税调整
- 社区治理机制

## 总结

新的模块化合约系统具有以下优势：

- ✅ **清晰分工**: 每个合约职责单一，易于维护
- ✅ **网络优化**: 根据功能特点选择最适合的网络
- ✅ **成本效率**: Sepolia测试网降低开发成本
- ✅ **跨链能力**: ZetaChain提供强大的跨链支付能力
- ✅ **可扩展性**: 模块化设计便于后续功能扩展
- ✅ **安全可靠**: 每个模块独立安全验证

这个设计既满足了功能需求，又保持了系统的简洁性和可维护性，非常适合快速开发和部署。