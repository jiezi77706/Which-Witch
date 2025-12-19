# ZetaChain合约部署指南

## 前置要求

### 1. 安装Foundry
```bash
# 安装Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 验证安装
forge --version
cast --version
anvil --version
```

### 2. 获取测试资金
- 访问 [ZetaChain Athens测试网水龙头](https://labs.zetachain.com/get-zeta)
- 获取测试ZETA代币用于部署和测试

### 3. 准备环境变量
```bash
cd src/contracts
cp .env.example .env
# 编辑.env文件，填入你的私钥和API密钥
```

## 快速部署

### 1. 安装依赖
```bash
make install
```

### 2. 编译合约
```bash
make build
```

### 3. 运行测试
```bash
make test
```

### 4. 部署到ZetaChain测试网
```bash
make deploy-zeta-testnet
```

### 5. 配置合约
```bash
# 设置合约地址环境变量
export ZETA_PAYMENT_ADDRESS=0x你的合约地址

# 运行配置脚本
make configure
```

## 详细部署步骤

### 步骤1: 环境准备

1. **克隆项目并进入合约目录**
```bash
cd src/contracts
```

2. **安装Foundry依赖**
```bash
make install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
vim .env
```

必需的环境变量：
- `PRIVATE_KEY`: 你的钱包私钥
- `ZETA_TESTNET_RPC_URL`: ZetaChain测试网RPC
- `ZETASCAN_API_KEY`: ZetaScan API密钥（用于验证）

### 步骤2: 编译和测试

1. **编译合约**
```bash
make build
```

2. **运行测试**
```bash
make test
```

3. **查看测试覆盖率**
```bash
make test-coverage
```

4. **生成Gas报告**
```bash
make gas-report
```

### 步骤3: 模拟部署

在实际部署前，先模拟部署以检查是否有问题：
```bash
make simulate-deploy
```

### 步骤4: 部署合约

1. **部署到ZetaChain测试网**
```bash
make deploy-zeta-testnet
```

部署成功后，你会看到类似输出：
```
=== Deployment Information ===
Contract Address: 0x1234567890123456789012345678901234567890
Owner: 0xYourAddress
ZetaConnector: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Platform Fee Rate: 250 basis points
```

2. **记录合约地址**
```bash
export ZETA_PAYMENT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 步骤5: 配置合约

1. **运行配置脚本**
```bash
make configure
```

这将配置：
- 支持的区块链网络
- 支持的加密货币
- 授权的中继器地址

### 步骤6: 验证合约

1. **在区块浏览器上验证**
```bash
make verify
```

## 网络配置

### ZetaChain Athens测试网
- **Chain ID**: 7001
- **RPC URL**: https://zetachain-athens-evm.blockpi.network/v1/rpc/public
- **Block Explorer**: https://zetachain-athens-3.blockscout.com/
- **水龙头**: https://labs.zetachain.com/get-zeta

### ZetaChain主网
- **Chain ID**: 7000
- **RPC URL**: https://zetachain-evm.blockpi.network/v1/rpc/public
- **Block Explorer**: https://zetachain.blockscout.com/

## 支持的目标链

合约默认支持以下链的跨链支付：

| 链名称 | Chain ID | 网络类型 |
|--------|----------|----------|
| Ethereum | 1 | 主网 |
| BSC | 56 | 主网 |
| Polygon | 137 | 主网 |
| Base | 8453 | 主网 |
| Sepolia | 11155111 | 测试网 |

## 支持的加密货币

- ETH (Ethereum)
- BTC (Bitcoin)
- USDC (USD Coin)
- USDT (Tether)
- BNB (Binance Coin)
- MATIC (Polygon)

## 合约功能测试

### 1. 测试跨链打赏
```bash
# 使用cast命令测试
cast send $ZETA_PAYMENT_ADDRESS \
  "initiateCrossChainTip(address,uint256,uint256,string)" \
  0x接收者地址 \
  123 \
  11155111 \
  "ETH" \
  --value 0.1ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $ZETA_TESTNET_RPC_URL
```

### 2. 测试授权费支付
```bash
cast send $ZETA_PAYMENT_ADDRESS \
  "initiateCrossChainLicenseFee(address,uint256,uint256,string)" \
  0x接收者地址 \
  456 \
  11155111 \
  "ETH" \
  --value 0.05ether \
  --private-key $PRIVATE_KEY \
  --rpc-url $ZETA_TESTNET_RPC_URL
```

### 3. 查询支付记录
```bash
cast call $ZETA_PAYMENT_ADDRESS \
  "getPayment(uint256)" \
  1 \
  --rpc-url $ZETA_TESTNET_RPC_URL
```

## 故障排除

### 常见问题

1. **部署失败: "insufficient funds"**
   - 确保钱包有足够的ZETA代币
   - 访问水龙头获取测试代币

2. **验证失败**
   - 检查ZETASCAN_API_KEY是否正确
   - 确保合约地址正确

3. **RPC连接失败**
   - 检查网络连接
   - 尝试使用其他RPC端点

4. **私钥错误**
   - 确保私钥格式正确（不包含0x前缀）
   - 检查私钥对应的地址是否有足够余额

### 调试命令

1. **检查环境变量**
```bash
make check-env
```

2. **查看详细日志**
```bash
forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
  --rpc-url $ZETA_TESTNET_RPC_URL \
  -vvvv
```

3. **检查合约状态**
```bash
# 检查合约owner
cast call $ZETA_PAYMENT_ADDRESS "owner()" --rpc-url $ZETA_TESTNET_RPC_URL

# 检查平台费率
cast call $ZETA_PAYMENT_ADDRESS "platformFeeRate()" --rpc-url $ZETA_TESTNET_RPC_URL

# 检查支持的链
cast call $ZETA_PAYMENT_ADDRESS "supportedChains(uint256)" 11155111 --rpc-url $ZETA_TESTNET_RPC_URL
```

## 安全注意事项

1. **私钥安全**
   - 永远不要将私钥提交到代码仓库
   - 使用环境变量或安全的密钥管理工具

2. **测试网部署**
   - 先在测试网充分测试
   - 确认所有功能正常后再部署到主网

3. **合约验证**
   - 部署后立即验证合约源码
   - 确保合约参数配置正确

4. **权限管理**
   - 仔细配置合约owner权限
   - 谨慎授权中继器地址

## 下一步

部署完成后，你可以：

1. **集成前端**: 在前端应用中集成合约调用
2. **配置中继器**: 设置跨链消息中继服务
3. **监控合约**: 设置合约事件监听和告警
4. **部署其他合约**: 部署Sepolia网络上的其他合约

## 相关资源

- [ZetaChain官方文档](https://docs.zetachain.com/)
- [Foundry文档](https://book.getfoundry.sh/)
- [OpenZeppelin合约库](https://docs.openzeppelin.com/contracts/)
- [ZetaChain测试网水龙头](https://labs.zetachain.com/get-zeta)