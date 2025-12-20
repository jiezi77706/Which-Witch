# 跨链支付集成指南

## 概述

本指南介绍如何在现有的支付按钮（如打赏按钮和授权申请按钮）中集成跨链支付功能，让用户可以使用不同区块链网络的测试币进行支付。

## 功能特点

- ✅ **多链支持**: 支持 Sepolia、BSC Testnet、Polygon Mumbai、ZetaChain Athens
- ✅ **测试币友好**: 完全使用测试币，无实际价值损失
- ✅ **自动转换**: 跨链支付自动转换为 Sepolia ETH
- ✅ **统一接口**: 一个组件支持多种支付类型
- ✅ **费用透明**: 清晰显示跨链费用和网络费用
- ✅ **状态跟踪**: 实时跟踪支付状态

## 支持的测试网络

| 网络 | 链 ID | 代币 | 水龙头 | 用途 |
|------|-------|------|--------|------|
| Sepolia | 11155111 | ETH | [获取](https://sepoliafaucet.com) | 目标链（创作者收款） |
| BSC Testnet | 97 | BNB | [获取](https://testnet.binance.org/faucet-smart) | 支付链 |
| Polygon Mumbai | 80001 | MATIC | [获取](https://faucet.polygon.technology) | 支付链 |
| ZetaChain Athens | 7001 | ZETA | [获取](https://labs.zetachain.com/get-zeta) | 跨链协议 |

## 快速开始

### 1. 基本用法

```tsx
import { UniversalPaymentButton } from '@/components/whichwitch/universal-payment-button'

// 打赏按钮
<UniversalPaymentButton
  workId={work.id}
  creatorAddress={work.creator}
  creatorName={work.creatorName}
  paymentType="tip"
  fixedAmount="0.01"
/>

// 授权申请按钮
<UniversalPaymentButton
  workId={work.id}
  creatorAddress={work.creator}
  creatorName={work.creatorName}
  paymentType="license"
  fixedAmount={work.licenseFee}
/>
```

### 2. 仅跨链支付

```tsx
import { CrossChainOnlyButton } from '@/components/whichwitch/universal-payment-button'

<CrossChainOnlyButton
  workId={work.id}
  creatorAddress={work.creator}
  paymentType="tip"
/>
```

### 3. 支付状态跟踪

```tsx
import { PaymentStatusIndicator } from '@/components/whichwitch/universal-payment-button'

<PaymentStatusIndicator
  paymentId={paymentId}
  paymentType="license"
/>
```

## 组件 API

### UniversalPaymentButton

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| workId | number | ✅ | 作品 ID |
| creatorAddress | string | ✅ | 创作者钱包地址 |
| creatorName | string | ❌ | 创作者名称 |
| workTitle | string | ❌ | 作品标题 |
| paymentType | 'tip' \| 'license' \| 'nft' | ✅ | 支付类型 |
| fixedAmount | string | ❌ | 固定金额（ETH） |
| showDropdown | boolean | ❌ | 是否显示下拉菜单（默认 true） |
| size | 'sm' \| 'default' \| 'lg' | ❌ | 按钮大小 |
| variant | 'default' \| 'outline' \| 'secondary' | ❌ | 按钮样式 |
| className | string | ❌ | 自定义样式类 |

## 支付流程

### 直接支付（Sepolia）
1. 用户在 Sepolia 网络
2. 点击支付按钮
3. 直接调用相应的合约函数
4. 立即完成支付

### 跨链支付
1. 用户在其他测试网络（BSC、Polygon 等）
2. 点击支付按钮，选择跨链支付
3. 系统计算跨链费用
4. 用户确认支付
5. 通过跨链协议转换为 Sepolia ETH
6. 创作者在 Sepolia 收到款项

## 费用结构

### 直接支付（Sepolia）
- 支付金额: 用户设定
- 网络费用: ~0.001 ETH
- 跨链费用: 0
- **创作者收到**: 支付金额

### 跨链支付
- 支付金额: 用户设定
- 跨链费用: 1.5% - 2.5%（根据源链不同）
- 网络费用: 0.001 - 0.003 ETH
- **创作者收到**: 支付金额 - 跨链费用

## 测试步骤

### 1. 准备测试环境

1. 安装 MetaMask 钱包
2. 添加测试网络到钱包
3. 从水龙头获取测试币

### 2. 测试直接支付

1. 切换到 Sepolia 网络
2. 确保有足够的 Sepolia ETH
3. 点击支付按钮
4. 选择"直接支付"
5. 确认交易

### 3. 测试跨链支付

1. 切换到其他测试网络（如 BSC Testnet）
2. 确保有足够的测试币
3. 点击支付按钮
4. 选择"跨链支付"
5. 查看费用预估
6. 确认交易
7. 等待跨链转换完成（1-5分钟）

## 集成到现有项目

### 替换现有按钮

```tsx
// 原有的打赏按钮
<Button onClick={handleTip}>
  <Zap className="h-4 w-4 mr-1" />
  打赏
</Button>

// 替换为通用支付按钮
<UniversalPaymentButton
  workId={work.id}
  creatorAddress={work.creator}
  paymentType="tip"
  fixedAmount="0.01"
/>
```

### 授权申请集成

```tsx
// 在 license-selector-modal.tsx 中添加支付选项
<UniversalPaymentButton
  workId={workId}
  creatorAddress={creatorAddress}
  paymentType="license"
  fixedAmount={licenseFee}
  onSuccess={(paymentId) => {
    // 处理支付成功
    handleLicenseGranted(paymentId)
  }}
/>
```

## 故障排除

### 常见问题

1. **"不支持的网络"**
   - 确保钱包连接到支持的测试网络
   - 检查链 ID 是否正确

2. **"余额不足"**
   - 从相应的水龙头获取测试币
   - 确保余额足够支付金额 + 网络费用

3. **"跨链支付失败"**
   - 检查网络连接
   - 确保有足够的 gas 费用
   - 重试支付

4. **"支付状态查询失败"**
   - 跨链支付可能需要更长时间
   - 检查区块浏览器确认交易状态

### 调试模式

```tsx
// 启用调试日志
localStorage.setItem('crosschain-debug', 'true')

// 查看详细错误信息
console.log('CrossChain Payment Debug:', error)
```

## 演示页面

访问以下页面体验功能：

- `/payment-integration-demo` - 完整的集成演示
- `/test-crosschain-payment` - 测试环境和工具

## 技术实现

### 核心服务

- `TestnetCrossChainService` - 测试网跨链支付服务
- `UniversalPaymentButton` - 通用支付按钮组件
- `MultiChainPaymentModal` - 多链支付模态框

### 支持的合约

- 打赏: 直接转账或调用 `processPayment`
- 授权: 调用 `requestAuthorization`
- NFT: 调用 NFT 铸造合约（开发中）

## 注意事项

⚠️ **重要提醒**:
- 这是测试环境，所有代币都是测试币，没有实际价值
- 跨链支付可能需要 1-5 分钟完成
- 测试网络可能不稳定，请耐心等待
- 不要在主网使用测试代码

## 下一步计划

- [ ] 支持更多测试网络
- [ ] 优化跨链费用
- [ ] 添加支付历史记录
- [ ] 实现 NFT 购买功能
- [ ] 添加支付失败重试机制

## 获取帮助

如果遇到问题，请：

1. 查看浏览器控制台错误信息
2. 检查网络连接和钱包状态
3. 确认测试币余额充足
4. 参考故障排除部分

---

*最后更新: 2024年12月*