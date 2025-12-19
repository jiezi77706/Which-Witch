# WhichWitch 合约系统重新设计

## 概述

根据需求重新设计了简洁但功能完整的合约系统，专注于三大核心功能：
1. **跨链支付集成** - 使用ZetaChain实现跨链打赏、授权费、NFT购买
2. **创作权交易** - 通过ERC721 NFT实现创作权的交易
3. **创作互动** - 投票系统，粉丝通过质押代币参与

## 合约架构

### 1. WhichWitchCore.sol - 核心合约
**功能**：
- ✅ 作品管理（创建、查询）
- ✅ 创作类型判断（原创、作者延续、授权衍生）
- ✅ NFT铸造（ERC721，1个NFT = 1个作品的创作权）
- ✅ 支付处理（打赏、授权费、NFT购买）
- ✅ 投票系统（创作者发起，粉丝质押代币投票）

**关键特性**：
- 自动判断创作类型（对应数据库的creation_type）
- 原作者二创自己的作品不需要支付授权费
- NFT代表创作权，可以交易转移
- 投票需要质押代币，投票结束后可提取

### 2. CrossChainPaymentManager.sol - 跨链支付管理器
**功能**：
- ✅ 跨链打赏
- ✅ 跨链授权费支付
- ✅ 跨链NFT购买
- ✅ ZetaChain集成

**关键特性**：
- 支持多链（Ethereum, BSC, Polygon, Base, ZetaChain）
- 自动计算平台费用（2.5%）
- 同链直接处理，跨链通过ZetaChain中继

### 3. WhichWitchToken.sol - 平台代币
**功能**：
- ✅ ERC20标准代币
- ✅ 用于投票质押
- ✅ 可铸造和销毁

**代币经济**：
- 总供应量：10亿 WWT
- 初始供应：1亿 WWT
- 用途：投票质押、治理（未来扩展）

## 数据流程

### 创作流程

```
1. 用户创建原创作品
   ↓
   createWork(metadataURI, licenseFee, allowRemix, 0)
   ↓
   作品记录创建（CreationType.ORIGINAL）
   ↓
   可选：mintWorkNFT(workId) 铸造创作权NFT

2. 原作者延续创作
   ↓
   createWork(metadataURI, licenseFee, allowRemix, parentWorkId)
   ↓
   检测：creator == parentWork.creator
   ↓
   作品记录创建（CreationType.AUTHOR_CONTINUATION）
   ↓
   无需支付授权费 ✅

3. 他人二创
   ↓
   createWork(metadataURI, licenseFee, allowRemix, parentWorkId) + 支付授权费
   ↓
   检测：creator != parentWork.creator
   ↓
   支付授权费给原作者
   ↓
   作品记录创建（CreationType.AUTHORIZED_DERIVATIVE）
```

### 跨链支付流程

```
用户在链A发起支付
   ↓
   CrossChainPaymentManager.initiateCrossChainTip/LicenseFee/NFTPurchase
   ↓
   创建支付记录
   ↓
   计算平台费用（2.5%）
   ↓
   构建跨链消息
   ↓
   通过ZetaChain发送到链B
   ↓
   链B的CrossChainPaymentManager接收消息
   ↓
   执行支付给接收者
   ↓
   完成 ✅
```

### 投票流程

```
1. 创作者发起投票
   ↓
   createVoting(workId, title, options, duration)
   ↓
   验证：只有作品创作者可以发起
   ↓
   投票创建（状态：active）

2. 粉丝投票
   ↓
   approve WWT代币给合约
   ↓
   vote(votingId, optionId, stakeAmount)
   ↓
   转移质押代币到合约
   ↓
   记录投票
   ↓
   累计选项票数

3. 投票结束
   ↓
   endVoting(votingId)
   ↓
   投票状态：inactive
   ↓
   用户可以提取质押代币
   ↓
   claimStakedTokens(votingId)
```

## 合约部署顺序

### 1. 部署WhichWitchToken
```solidity
WhichWitchToken token = new WhichWitchToken();
```

### 2. 部署WhichWitchCore
```solidity
WhichWitchCore core = new WhichWitchCore(address(token));
```

### 3. 部署CrossChainPaymentManager
```solidity
CrossChainPaymentManager payment = new CrossChainPaymentManager(zetaConnectorAddress);
```

### 4. 配置跨链支付
```solidity
// 配置支持的链和目标合约
payment.configureChain(1, true, ethereumCoreAddress);    // Ethereum
payment.configureChain(56, true, bscCoreAddress);        // BSC
payment.configureChain(137, true, polygonCoreAddress);   // Polygon
payment.configureChain(8453, true, baseCoreAddress);     // Base
```

## 测试场景

### 场景1：原创作品创建和NFT铸造
```javascript
// 1. 创建原创作品
const tx1 = await core.createWork(
  "ipfs://metadata1",
  ethers.parseEther("0.1"), // 授权费 0.1 ETH
  true,                      // 允许二创
  0                          // 无父作品
);

// 2. 铸造NFT
const tx2 = await core.mintWorkNFT(1);

// 验证
const work = await core.getWork(1);
assert(work.creationType === 0); // ORIGINAL
assert(work.isNFTMinted === true);
```

### 场景2：原作者延续创作（无需支付费用）
```javascript
// 原作者创建延续作品
const tx = await core.createWork(
  "ipfs://metadata2",
  ethers.parseEther("0.05"),
  true,
  1  // 父作品ID
);

// 验证
const work = await core.getWork(2);
assert(work.creationType === 1); // AUTHOR_CONTINUATION
assert(work.parentWorkId === 1);
```

### 场景3：他人二创（需要支付授权费）
```javascript
// 他人创建衍生作品，需要支付授权费
const tx = await core.connect(user2).createWork(
  "ipfs://metadata3",
  ethers.parseEther("0.05"),
  true,
  1,  // 父作品ID
  { value: ethers.parseEther("0.1") } // 支付授权费
);

// 验证
const work = await core.getWork(3);
assert(work.creationType === 2); // AUTHORIZED_DERIVATIVE

// 验证原作者收到授权费
const balance = await core.creatorBalances(originalCreator);
assert(balance > 0);
```

### 场景4：跨链打赏
```javascript
// 在链A发起跨链打赏到链B
const tx = await paymentManager.initiateCrossChainTip(
  creatorAddress,
  1,      // workId
  137,    // Polygon
  { value: ethers.parseEther("0.5") }
);

// 验证支付记录
const payment = await paymentManager.getPayment(1);
assert(payment.paymentType === 0); // TIP
assert(payment.targetChainId === 137);
```

### 场景5：投票系统
```javascript
// 1. 创作者发起投票
const tx1 = await core.createVoting(
  1,  // workId
  "Choose next character design",
  ["Design A", "Design B", "Design C"],
  86400  // 24小时
);

// 2. 粉丝质押代币投票
await token.connect(fan1).approve(core.address, ethers.parseEther("100"));
const tx2 = await core.connect(fan1).vote(
  1,  // votingId
  0,  // optionId (Design A)
  ethers.parseEther("100")
);

// 3. 查询投票结果
const votes = await core.getVotingOptionVotes(1, 0);
assert(votes === ethers.parseEther("100"));

// 4. 投票结束后提取质押代币
await core.connect(creator).endVoting(1);
await core.connect(fan1).claimStakedTokens(1);
```

### 场景6：NFT创作权交易
```javascript
// 1. 创作者铸造NFT
await core.mintWorkNFT(1);

// 2. 买家购买NFT（创作权转移）
const tx = await core.connect(buyer).purchaseNFT(
  1,  // tokenId
  { value: ethers.parseEther("1.0") }
);

// 3. 验证所有权转移
const owner = await core.ownerOf(1);
assert(owner === buyer.address);

// 4. 验证卖家收到款项
const balance = await core.creatorBalances(seller.address);
assert(balance > 0);
```

## 与数据库集成

### 作品创建时
```javascript
// 前端调用合约
const tx = await core.createWork(...);
const receipt = await tx.wait();

// 监听事件
const event = receipt.events.find(e => e.event === 'WorkCreated');
const { workId, creator, creationType, parentWorkId, metadataURI } = event.args;

// 调用后端API保存到数据库
await fetch('/api/works/create', {
  method: 'POST',
  body: JSON.stringify({
    workId,
    creatorAddress: creator,
    creationType, // 对应数据库的creation_type字段
    parentWorkId,
    metadataUri: metadataURI,
    // ... 其他字段
  })
});
```

### 投票创建时
```javascript
// 前端调用合约
const tx = await core.createVoting(...);
const receipt = await tx.wait();

// 监听事件
const event = receipt.events.find(e => e.event === 'VotingCreated');
const { votingId, workId, creator, title, endTime } = event.args;

// 调用后端API保存到数据库
await fetch('/api/voting/create', {
  method: 'POST',
  body: JSON.stringify({
    votingId,
    workId,
    creatorAddress: creator,
    title,
    endTime,
    // ... 其他字段
  })
});
```

## 安全特性

### 1. 重入保护
- 所有涉及ETH转账的函数都使用`nonReentrant`修饰符

### 2. 权限控制
- 只有作品创作者可以铸造NFT
- 只有作品创作者可以发起投票
- 只有合约owner可以修改平台参数

### 3. 输入验证
- 检查地址不为零地址
- 检查金额大于0
- 检查父作品存在
- 检查投票选项有效

### 4. 费用保护
- 平台费率上限10%
- 授权费自动计算和分配
- 多余ETH自动退还

## Gas优化

### 1. 使用映射而非数组
- 快速查询作品、投票信息

### 2. 事件记录关键操作
- 减少链上存储，通过事件查询历史

### 3. 批量操作支持
- 投票结束后用户主动claim代币，而非批量返还

## 未来扩展

### 1. NFT市场功能
- 添加挂单、出价、拍卖功能
- 版税自动分配

### 2. 治理功能
- 使用WWT代币进行平台治理
- 社区提案和投票

### 3. 更多跨链支持
- 集成更多链（Arbitrum, Optimism等）
- 支持更多资产类型

### 4. 高级投票机制
- 二次方投票
- 时间加权投票
- 委托投票

## 总结

新的合约系统：
- ✅ **简洁** - 3个核心合约，易于理解和测试
- ✅ **功能完整** - 覆盖所有核心需求
- ✅ **易于集成** - 与现有数据库结构完美对应
- ✅ **安全可靠** - 使用OpenZeppelin标准库
- ✅ **可扩展** - 预留未来功能扩展空间

核心创新：
1. **自动判断创作类型** - 原作者延续无需支付费用
2. **NFT即创作权** - 通过NFT交易实现创作权转移
3. **质押投票** - 粉丝通过质押代币参与创作决策
4. **跨链支付** - 使用ZetaChain实现无缝跨链体验