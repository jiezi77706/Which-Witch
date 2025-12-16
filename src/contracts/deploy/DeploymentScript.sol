// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeploymentScript
 * @notice 部署脚本示例，展示如何部署和配置整个合约系统
 * @dev 这是一个参考脚本，实际部署时需要根据具体需求调整
 */

/*
部署顺序和配置说明：

这些配置是通过调用智能合约的函数来完成的，不是写在代码里的。
部署完合约后，需要调用每个合约的设置函数来建立合约之间的关系。

实际的部署脚本请参考：
- deploy.js (Hardhat版本)
- Deploy.s.sol (Foundry版本)
- README.md (详细说明)

=== Base链部署 ===

1. 部署基础合约
   - CreationManager(paymentManagerAddress)
   - PaymentManager(platformWallet)
   - AuthorizationManager(creationManagerAddress, paymentManagerAddress)

2. 部署NFT相关合约
   - NFTManager("WhichWitch Creation NFT", "WWCNFT")
   - RoyaltyManager(creationManagerAddress, platformWallet) // 仅处理授权费
   - NFTMarketplace(nftManagerAddress, royaltyManagerAddress, platformWallet) // NFT销售即时到账

3. 配置合约关系 (通过调用合约的设置函数建立合约间的连接)
   - CreationManager.setAuthorizationManager(authorizationManagerAddress) // 让CreationManager知道谁负责授权验证
   - CreationManager.setNFTManager(nftManagerAddress) // 让CreationManager知道NFT合约地址
   - PaymentManager.setAuthorizationManager(authorizationManagerAddress) // 让PaymentManager知道谁会发送授权费
   - PaymentManager.setRoyaltyManager(royaltyManagerAddress) // 让PaymentManager委托版税分配给RoyaltyManager
   - NFTManager.setCreationManager(creationManagerAddress) // 让NFTManager能够查询作品信息
   - NFTManager.setRoyaltyManager(royaltyManagerAddress) // 让NFTManager知道版税管理器
   - RoyaltyManager.setPaymentManager(paymentManagerAddress) // 让RoyaltyManager能接收PaymentManager的委托
   - RoyaltyManager.setNFTMarketplace(nftMarketplaceAddress)

=== ZetaChain部署 ===

4. 部署跨链支付合约
   - ZetaPaymentManager(zetaConnectorAddress)

5. 配置跨链支付
   - ZetaPaymentManager.authorizeRelayer(relayerAddress, true)
   - ZetaPaymentManager.updateChainSupport(chainId, true) // 为每个支持的链

=== 使用流程 ===

A. 作品上传和NFT铸造流程：
   1. 用户调用 CreationManager.registerOriginalWork() 注册作品
   2. 用户调用 NFTManager.mintWorkNFT() 为作品铸造NFT
   3. 用户可以调用 NFTMarketplace.listToken() 上架NFT

B. 二创授权流程：
   1. 用户调用 AuthorizationManager.requestAuthorization() 支付授权费
   2. 授权费通过 PaymentManager 分配给创作者链
   3. 用户调用 CreationManager.registerDerivativeWork() 注册二创作品

C. NFT交易流程：
   1. 买家调用 NFTMarketplace.buyToken() 购买NFT
   2. 版税即时分配给卖家和创作者链，不存储在合约中
   3. 平台收取2.5%交易费
   4. NFT所有权转移给买家



D. 跨链支付流程：
   1. 用户在任意链调用 ZetaPaymentManager.initiateAuthorizationPayment() 或其他支付方法
   2. ZetaChain处理跨链消息传递
   3. 目标链接收支付并执行相应操作

=== 合约地址配置示例 ===

// Base链合约地址
const BASE_CONTRACTS = {
    creationManager: "0x...",
    paymentManager: "0x...",
    authorizationManager: "0x...",
    nftManager: "0x...",
    royaltyManager: "0x...",
    nftMarketplace: "0x..."
};

// ZetaChain合约地址
const ZETA_CONTRACTS = {
    zetaPaymentManager: "0x..."
};

// 平台配置
const PLATFORM_CONFIG = {
    platformWallet: "0x...", // 平台钱包地址
    zetaConnector: "0x...",  // ZetaChain连接器地址
    supportedChains: [1, 56, 137, 8453], // 支持的链ID
    platformFees: {
        nftTrading: 250,     // 2.5% NFT交易费 (即时收取)
        withdrawal: 350      // 3.5% 提现手续费 (授权费和打赏)
    }
};

=== 权限管理 ===

1. 合约所有者权限：
   - NFTManager: 设置CreationManager和RoyaltyManager地址
   - ZetaPaymentManager: 管理支持的链、授权中继器

2. 平台钱包权限：
   - PaymentManager: 更新平台钱包地址
   - NFTMarketplace: 更新平台钱包地址
   - RoyaltyManager: 紧急提取功能

3. 合约间调用权限：
   - 只有AuthorizationManager可以调用PaymentManager.distributeRevenue()
   - 只有授权的中继器可以调用ZetaPaymentManager.processPaymentConfirmation()

=== 安全考虑 ===

1. 重入攻击防护：所有涉及ETH转账的函数都使用ReentrancyGuard
2. 权限控制：关键函数都有适当的权限检查
3. 输入验证：所有外部输入都进行验证
4. 紧急机制：提供紧急提取和暂停功能
5. 升级机制：合约地址可以在部署后设置，支持系统升级

=== Gas优化 ===

1. 使用自定义错误而不是require字符串
2. 批量操作减少交易次数
3. 合理的数据结构设计
4. 事件日志用于链下查询

=== 监控和维护 ===

1. 事件监听：监听所有重要事件用于链下处理
2. 余额监控：定期检查合约余额和用户余额
3. 跨链状态：监控跨链支付状态
4. 异常处理：处理失败的跨链支付和异常情况

*/

contract DeploymentReference {
    // 这个合约仅用于文档目的，不需要实际部署
    // 实际部署请使用Hardhat、Foundry或其他部署工具
    
    string public constant DEPLOYMENT_GUIDE = "See comments above for deployment instructions";
}