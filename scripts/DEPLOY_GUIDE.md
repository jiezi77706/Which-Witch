# 智能合约自动部署指南

## 🔑 获取私钥

### 从 MetaMask 获取私钥：
1. 打开 MetaMask
2. 点击右上角的三个点 → 账户详情
3. 点击"导出私钥"
4. 输入密码
5. 复制私钥（以 0x 开头的 64 位字符串）

⚠️ **安全提醒**：
- 不要使用主钱包的私钥
- 建议创建一个专门用于部署的新钱包
- 私钥不要提交到 Git 仓库

## 💰 准备资金

确保部署钱包有至少 **0.02 ETH** 在 Sepolia 测试网：
- 可以从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试 ETH
- 或者从其他钱包转入

## 🚀 部署方法

### 方法 1：命令行直接设置（推荐）
```bash
PRIVATE_KEY=0x你的私钥 node scripts/deploy-contracts.js
```

### 方法 2：使用 .env 文件
1. 复制示例文件：
   ```bash
   cp scripts/.env.example scripts/.env
   ```

2. 编辑 `scripts/.env` 文件，填入你的私钥：
   ```
   PRIVATE_KEY=0x你的私钥
   ```

3. 运行部署：
   ```bash
   node scripts/deploy-contracts.js
   ```

### 方法 3：导出环境变量
```bash
export PRIVATE_KEY=0x你的私钥
node scripts/deploy-contracts.js
```

## 📋 部署过程

脚本会自动执行以下步骤：
1. ✅ 编译三个智能合约
2. ✅ 部署 CreationManager
3. ✅ 部署 PaymentManager  
4. ✅ 部署 AuthorizationManager
5. ✅ 配置合约间关联
6. ✅ 验证配置正确性
7. ✅ 保存部署信息

## 📝 部署完成后

1. **复制新的合约地址**到 `.env.local` 文件：
   ```bash
   NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=新地址
   NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=新地址
   NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=新地址
   ```

2. **重启应用程序**：
   ```bash
   npm run dev
   ```

3. **测试功能**：
   - 二创支付授权费
   - 作品打赏功能

## 🔍 验证部署

运行诊断脚本确认配置正确：
```bash
node scripts/testing/diagnose-contract-issues.js
```

应该看到所有地址匹配为 `true`。

## ❌ 常见问题

### 1. "余额不足"
- 确保钱包有至少 0.02 ETH
- 检查是否连接到 Sepolia 测试网

### 2. "私钥格式错误"
- 私钥必须以 `0x` 开头
- 私钥长度为 66 个字符（包含 0x）

### 3. "网络连接错误"
- 检查网络连接
- 确认 RPC URL 可访问

## 🆘 需要帮助？

如果遇到问题，请提供：
- 错误信息截图
- 钱包地址
- 网络状态