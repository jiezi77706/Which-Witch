# 🎉 合约集成完成指南

## 📋 已部署合约地址

### Sepolia 测试网 (2024-12-19)
```
WorkRegistry:        0xe683b6970593fa5c2277779fda61a815e86fbbb8
VotingSystem:        0xa473bbc7fb3d3f715e92b6b4fb311bd116bc59a5
CreationRightsNFT:   0xeb3663709c5609c581d73acf79c9af931ee5cdc5
```

### 区块链浏览器链接
- [WorkRegistry](https://sepolia.etherscan.io/address/0xe683b6970593fa5c2277779fda61a815e86fbbb8)
- [VotingSystem](https://sepolia.etherscan.io/address/0xa473bbc7fb3d3f715e92b6b4fb311bd116bc59a5)
- [CreationRightsNFT](https://sepolia.etherscan.io/address/0xeb3663709c5609c581d73acf79c9af931ee5cdc5)

## ✅ 已完成的集成工作

### 1. 环境配置 ✅
- [x] 更新 `.env.example` 文件
- [x] 添加新的合约地址
- [x] 配置网络参数

### 2. 合约配置 ✅
- [x] 创建 `lib/contracts/config.ts` 配置文件
- [x] 定义合约地址常量
- [x] 配置网络信息

### 3. ABI文件 ✅
- [x] `WorkRegistry.json` - 作品注册ABI
- [x] `CreationRightsNFT.json` - NFT合约ABI
- [x] `VotingSystem.json` - 投票系统ABI
- [x] `ZetaCrossChainPayment.json` - 跨链支付ABI

### 4. 服务层 ✅
- [x] `workRegistry.service.ts` - 作品管理服务
- [x] `creationRightsNFT.service.ts` - NFT服务
- [x] `votingSystem.service.ts` - 投票服务

### 5. React Hooks ✅
- [x] `useContracts()` - 统一合约访问
- [x] `useWorkRegistry()` - 作品管理hook
- [x] `useCreationRightsNFT()` - NFT hook
- [x] `useVotingSystem()` - 投票hook

## 🚀 前端使用示例

### 1. 创建作品
```typescript
import { useWorkRegistry } from '@/lib/hooks/useContracts';

function CreateWorkComponent() {
  const workRegistry = useWorkRegistry();

  const handleCreateWork = async () => {
    try {
      const workId = await workRegistry?.createWork({
        metadataURI: 'ipfs://your-metadata-uri',
        licenseFee: '0.1', // ETH
        allowRemix: true,
        parentWorkId: 0, // 0 for original work
      });
      
      console.log('Work created with ID:', workId);
    } catch (error) {
      console.error('Failed to create work:', error);
    }
  };

  return <button onClick={handleCreateWork}>Create Work</button>;
}
```

### 2. 铸造NFT
```typescript
import { useCreationRightsNFT } from '@/lib/hooks/useContracts';

function MintNFTComponent({ workId }: { workId: number }) {
  const nftContract = useCreationRightsNFT();

  const handleMintNFT = async () => {
    try {
      const tokenId = await nftContract?.mintWorkNFT(workId);
      console.log('NFT minted with token ID:', tokenId);
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  };

  return <button onClick={handleMintNFT}>Mint NFT</button>;
}
```

### 3. 创建投票
```typescript
import { useVotingSystem, VotingType } from '@/lib/hooks/useContracts';

function CreateVotingComponent({ workId }: { workId: number }) {
  const votingSystem = useVotingSystem();

  const handleCreateVoting = async () => {
    try {
      const votingId = await votingSystem?.createVoting({
        workId,
        title: 'Choose Character Design',
        description: 'Vote for your favorite character design',
        votingType: VotingType.CHARACTER_DESIGN,
        options: ['Design A', 'Design B', 'Design C'],
        duration: 86400, // 1 day in seconds
        minStakeAmount: '0.01', // ETH
      });
      
      console.log('Voting created with ID:', votingId);
    } catch (error) {
      console.error('Failed to create voting:', error);
    }
  };

  return <button onClick={handleCreateVoting}>Create Voting</button>;
}
```

### 4. 参与投票
```typescript
import { useVotingSystem } from '@/lib/hooks/useContracts';

function VoteComponent({ votingId }: { votingId: number }) {
  const votingSystem = useVotingSystem();

  const handleVote = async (optionId: number) => {
    try {
      const txHash = await votingSystem?.vote(votingId, optionId, '0.01');
      console.log('Vote cast, transaction:', txHash);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleVote(0)}>Vote Option A</button>
      <button onClick={() => handleVote(1)}>Vote Option B</button>
      <button onClick={() => handleVote(2)}>Vote Option C</button>
    </div>
  );
}
```

### 5. 查询作品信息
```typescript
import { useWorkRegistry } from '@/lib/hooks/useContracts';
import { useEffect, useState } from 'react';

function WorkInfoComponent({ workId }: { workId: number }) {
  const workRegistry = useWorkRegistry();
  const [work, setWork] = useState(null);

  useEffect(() => {
    const fetchWork = async () => {
      if (workRegistry) {
        const workInfo = await workRegistry.getWork(workId);
        setWork(workInfo);
      }
    };
    
    fetchWork();
  }, [workRegistry, workId]);

  if (!work) return <div>Loading...</div>;

  return (
    <div>
      <h3>Work #{work.id}</h3>
      <p>Creator: {work.creator}</p>
      <p>License Fee: {work.licenseFee} ETH</p>
      <p>Allow Remix: {work.allowRemix ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## 🔧 后续配置步骤

### 1. 合约授权配置
需要在WorkRegistry中授权其他合约：

```bash
# 授权CreationRightsNFT合约
cast send 0xe683b6970593fa5c2277779fda61a815e86fbbb8 \
  "authorizeContract(address,bool)" \
  0xeb3663709c5609c581d73acf79c9af931ee5cdc5 true \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY

# 授权VotingSystem合约
cast send 0xe683b6970593fa5c2277779fda61a815e86fbbb8 \
  "authorizeContract(address,bool)" \
  0xa473bbc7fb3d3f715e92b6b4fb311bd116bc59a5 true \
  --rpc-url $SEPOLIA_RPC \
  --private-key $PRIVATE_KEY
```

### 2. 更新环境变量
复制 `.env.example` 到 `.env.local` 并填入实际值：

```bash
cp .env.example .env.local
```

编辑 `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS_WORK_REGISTRY=0xe683b6970593fa5c2277779fda61a815e86fbbb8
NEXT_PUBLIC_CONTRACT_ADDRESS_VOTING_SYSTEM=0xa473bbc7fb3d3f715e92b6b4fb311bd116bc59a5
NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION_RIGHTS_NFT=0xeb3663709c5609c581d73acf79c9af931ee5cdc5

NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 3. 测试合约连接
```typescript
import { useContracts } from '@/lib/hooks/useContracts';

function TestConnection() {
  const { contracts, isConnected } = useContracts();

  const testConnection = async () => {
    if (!contracts) {
      console.log('Contracts not initialized');
      return;
    }

    try {
      // 测试WorkRegistry
      const totalWorks = await contracts.workRegistry.getTotalWorks();
      console.log('Total works:', totalWorks);

      // 测试CreationRightsNFT
      const hasNFT = await contracts.creationRightsNFT.hasWorkNFT(1);
      console.log('Work 1 has NFT:', hasNFT);

      console.log('✅ All contracts connected successfully!');
    } catch (error) {
      console.error('❌ Contract connection failed:', error);
    }
  };

  return (
    <div>
      <p>Wallet Connected: {isConnected ? 'Yes' : 'No'}</p>
      <button onClick={testConnection}>Test Contract Connection</button>
    </div>
  );
}
```

## 📊 功能映射表

| 前端功能 | 合约方法 | 服务层方法 |
|---------|---------|-----------|
| 创建作品 | `createWork()` | `workRegistry.createWork()` |
| 查看作品 | `getWork()` | `workRegistry.getWork()` |
| 铸造NFT | `mintWorkNFT()` | `creationRightsNFT.mintWorkNFT()` |
| 挂售NFT | `listNFT()` | `creationRightsNFT.listNFT()` |
| 购买NFT | `buyNFT()` | `creationRightsNFT.buyNFT()` |
| 创建投票 | `createVoting()` | `votingSystem.createVoting()` |
| 参与投票 | `vote()` | `votingSystem.vote()` |
| 结束投票 | `endVoting()` | `votingSystem.endVoting()` |
| 提取质押 | `withdrawStake()` | `votingSystem.withdrawStake()` |

## 🎯 下一步工作

### 立即可做
- [ ] 运行合约授权配置脚本
- [ ] 更新 `.env.local` 文件
- [ ] 测试合约连接
- [ ] 集成到现有UI组件

### 短期任务
- [ ] 添加错误处理和用户提示
- [ ] 实现交易状态跟踪
- [ ] 添加Gas估算功能
- [ ] 优化用户体验

### 长期优化
- [ ] 部署ZetaChain跨链支付合约
- [ ] 实现跨链功能
- [ ] 添加合约事件监听
- [ ] 实现实时数据更新

---

**🎉 合约集成已完成！现在可以在前端调用所有智能合约功能了！**