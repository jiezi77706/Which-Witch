# 重新部署智能合约指南

## 问题总结

当前的智能合约配置有问题：
- PaymentManager 的 `creationManager` 和 `authorizationManager` 地址都是零地址
- 导致二创授权和打赏功能失败

## 解决方案：重新部署

我已经为你准备了三种部署方式，选择最适合你的：

## 方式 1：自动化部署（推荐）

### 前提条件
- 钱包里有至少 0.02 ETH（Sepolia 测试网）
- 有钱包的私钥

### 步骤
1. **设置私钥环境变量**
   ```bash
   export PRIVATE_KEY=你的私钥
   ```

2. **运行自动化部署脚本**
   ```bash
   cd scripts
   node auto-deploy.js
   ```

3. **更新环境配置**
   脚本会输出新的合约地址，复制到 `.env.local` 文件：
   ```bash
   NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=新地址
   NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=新地址
   NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=新地址
   ```

4. **重启应用**
   ```bash
   npm run dev
   ```

## 方式 2：使用 Remix IDE（最简单）

### 步骤
1. **打开 Remix**
   访问 https://remix.ethereum.org/

2. **创建合约文件**
   参考 `scripts/deploy-with-remix.md` 文件中的完整合约代码

3. **编译和部署**
   - 选择 Solidity 编译器版本 0.8.19
   - 连接 MetaMask 到 Sepolia 测试网
   - 按顺序部署三个合约
   - 配置合约间的关联

4. **更新配置**
   将新的合约地址更新到 `.env.local`

## 方式 3：手动修复（不推荐）

如果你是原合约的所有者，可以尝试手动修复：

1. **访问 Etherscan**
   https://sepolia.etherscan.io/address/0x8c46877629fea27ced23345ab8e9eecb4c302c0c#writeContract

2. **连接钱包并调用函数**
   - `setCreationManager("0x8a4664807dafa6017aa1de55bf974e9515c6efb1")`
   - `setAuthorizationManager("0x5988c2af3eb0d6504fef8c00ed948aa9c3f339f8")`

## 验证部署

无论使用哪种方式，部署完成后运行验证脚本：

```bash
node scripts/testing/diagnose-contract-issues.js
```

应该看到所有地址匹配为 `true`。

## 测试功能

重新部署后，测试以下功能：
1. ✅ 二创支付授权费
2. ✅ 作品打赏功能
3. ✅ 收益分配
4. ✅ 提现功能

## 需要帮助？

如果遇到问题，请提供：
- 使用的部署方式
- 错误信息
- 交易哈希（如果有）
- 钱包地址

## 文件说明

- `scripts/auto-deploy.js` - 自动化部署脚本
- `scripts/deploy-with-remix.md` - Remix 部署详细指南
- `scripts/testing/diagnose-contract-issues.js` - 诊断脚本