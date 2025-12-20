# ZetaChain 跨链支付快速开始

> 🚀 在 5 分钟内为 WhichWitch 平台添加跨链支付功能

## 🎯 功能概述

通过集成 ZetaChain，用户可以：
- 从任意链（Ethereum、BSC、Polygon）向任意链支付
- 使用原生代币（ETH、BNB、MATIC）进行跨链打赏
- 无需桥接资产，一键完成跨链支付
- 支持打赏、授权费、NFT 购买等多种支付场景

## ⚡ 快速部署

### 1. 环境准备

```bash
# 1. 确保已安装 Node.js 18+
node --version

# 2. 安装 Foundry (智能合约工具)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加你的私钥
```

### 2. 一键部署

```bash
# 运行自动化部署脚本
node scripts/setup-zetachain.js
```

这个脚本会自动：
- ✅ 编译智能合约
- ✅ 部署到 ZetaChain 测试网
- ✅ 配置支持的链和代币
- ✅ 更新环境变量
- ✅ 运行测试验证

### 3. 测试功能

```bash
# 测试合约功能
node scripts/test-cross-chain-payment.js

# 启动开发服务器
npm run dev
```

## 🔧 手动部署（可选）

如果自动化脚本失败，可以手动执行：

```bash
# 1. 编译合约
cd src/contracts
forge build

# 2. 部署合约
forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --private-key $PRIVATE_KEY \
  --broadcast

# 3. 配置合约
ZETA_PAYMENT_ADDRESS=0x你的合约地址 \
forge script script/ConfigureZetaPayment.s.sol:ConfigureZetaPayment \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## 🎨 前端集成

### 1. 添加跨链支付按钮

在任意组件中使用：

```tsx
import { CrossChainTipButton } from '@/components/whichwitch/cross-chain-tip-button'

<CrossChainTipButton
  workId={work.id}
  creatorAddress={work.creator}
  creatorName={work.creatorName}
/>
```

### 2. 使用 Hook

```tsx
import { useCrossChainPayment } from '@/lib/web3/hooks/useCrossChainPayment'

function MyComponent() {
  const { initiateCrossChainPayment, isLoading, paymentStatus } = useCrossChainPayment({
    onSuccess: (paymentId) => console.log('支付成功:', paymentId),
    onError: (error) => console.error('支付失败:', error)
  })

  const handleTip = async () => {
    await initiateCrossChainPayment({
      recipient: '0x...',
      workId: BigInt(123),
      targetChainId: 11155111, // Sepolia
      amount: '0.01',
      paymentType: 'tip'
    })
  }

  return (
    <button onClick={handleTip} disabled={isLoading}>
      {isLoading ? '处理中...' : '跨链打赏'}
    </button>
  )
}
```

## 🌐 网络配置

### MetaMask 添加 ZetaChain

```javascript
// 网络参数
{
  chainId: '0x1B59', // 7001
  chainName: 'ZetaChain Athens Testnet',
  rpcUrls: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
  nativeCurrency: {
    name: 'ZETA',
    symbol: 'ZETA',
    decimals: 18
  },
  blockExplorerUrls: ['https://zetachain-athens-3.blockscout.com']
}
```

### 获取测试代币

- **ZetaChain ZETA**: https://labs.zetachain.com/get-zeta
- **Sepolia ETH**: https://sepoliafaucet.com/
- **Polygon Mumbai**: https://faucet.polygon.technology/

## 📊 支持的链和代币

| 链 | Chain ID | 代币 | ZRC-20 地址 |
|---|---|---|---|
| Ethereum | 1 | ETH | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` |
| BSC | 56 | BNB | `0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb` |
| Polygon | 137 | MATIC | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` |
| Base | 8453 | ETH | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` |
| Sepolia | 11155111 | ETH | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` |

## 🧪 测试场景

### 场景 1: 跨链打赏

```
用户在 Polygon 上用 MATIC → 给 Sepolia 上的创作者打赏
```

1. 用户连接 ZetaChain 网络
2. 选择目标链：Sepolia
3. 输入打赏金额：0.01 MATIC
4. 确认交易
5. 等待跨链处理（1-3分钟）
6. Sepolia 上的创作者收到 ETH

### 场景 2: 跨链授权费

```
用户在 BSC 上用 BNB → 支付授权费到 Ethereum
```

1. 用户请求使用作品授权
2. 选择支付链：BSC
3. 支付授权费：0.005 BNB
4. 跨链转账到 Ethereum
5. 自动分配给创作者链

### 场景 3: 跨链 NFT 购买

```
用户在任意链 → 购买 Sepolia 上的 NFT
```

1. 用户浏览 NFT 市场
2. 选择支付方式：任意支持的链
3. 确认购买
4. 跨链支付处理
5. NFT 转移 + 收益分配

## 🔍 调试和监控

### 查看合约状态

```bash
# 检查合约所有者
cast call $ZETA_PAYMENT_CONTRACT "owner()" \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 检查支持的链
cast call $ZETA_PAYMENT_CONTRACT "supportedChains(uint256)" 11155111 \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 查询支付记录
cast call $ZETA_PAYMENT_CONTRACT "getPayment(uint256)" 1 \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

### 监控交易

- **ZetaChain 浏览器**: https://zetachain-athens-3.blockscout.com
- **Sepolia 浏览器**: https://sepolia.etherscan.io
- **实时日志**: 在浏览器控制台查看交易状态

## 🚨 常见问题

### Q: 部署失败 "insufficient funds"
**A**: 确保钱包有足够的 ZETA 代币，访问水龙头获取测试币

### Q: 跨链支付卡住不动
**A**: 检查目标链是否拥堵，通常 1-3 分钟内完成

### Q: MetaMask 无法连接 ZetaChain
**A**: 手动添加网络，确保 RPC URL 正确

### Q: 前端显示"合约未部署"
**A**: 检查 `.env.local` 中的合约地址是否正确

## 📚 更多资源

- **详细指南**: [docs/ZETACHAIN_INTEGRATION_GUIDE.md](docs/ZETACHAIN_INTEGRATION_GUIDE.md)
- **ZetaChain 文档**: https://docs.zetachain.com
- **示例代码**: `components/whichwitch/cross-chain-*`
- **测试脚本**: `scripts/test-cross-chain-payment.js`

## 🎉 完成！

现在你的 WhichWitch 平台已经支持跨链支付了！用户可以从任意链向任意链支付，大大提升了平台的可用性和用户体验。

---

**需要帮助？** 查看详细指南或在 GitHub Issues 中提问。