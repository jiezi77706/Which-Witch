// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../zeta/ZetaCrossChainPayment.sol";

/**
 * @title DeployZetaPayment
 * @notice 部署ZetaChain跨链支付合约的脚本
 */
contract DeployZetaPayment is Script {
    
    // ZetaChain网络配置
    struct NetworkConfig {
        address zetaConnector;
        string name;
    }
    
    // 网络配置映射
    mapping(uint256 => NetworkConfig) public networkConfigs;
    
    function setUp() public {
        // ZetaChain Athens测试网配置
        networkConfigs[7001] = NetworkConfig({
            zetaConnector: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0, // 测试网连接器地址
            name: "ZetaChain Athens Testnet"
        });
        
        // ZetaChain主网配置
        networkConfigs[7000] = NetworkConfig({
            zetaConnector: 0x0000000000000000000000000000000000000000, // 主网连接器地址（需要更新）
            name: "ZetaChain Mainnet"
        });
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;
        
        NetworkConfig memory config = networkConfigs[chainId];
        require(config.zetaConnector != address(0), "Unsupported network");
        
        console.log("Deploying to network:", config.name);
        console.log("Chain ID:", chainId);
        console.log("ZetaConnector:", config.zetaConnector);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 部署ZetaCrossChainPayment合约
        ZetaCrossChainPayment zetaPayment = new ZetaCrossChainPayment(config.zetaConnector);
        
        vm.stopBroadcast();
        
        console.log("ZetaCrossChainPayment deployed at:", address(zetaPayment));
        
        // 验证部署
        _verifyDeployment(zetaPayment, config);
        
        // 输出部署信息
        _outputDeploymentInfo(zetaPayment, config);
    }
    
    function _verifyDeployment(ZetaCrossChainPayment zetaPayment, NetworkConfig memory config) internal view {
        console.log("\n=== Deployment Verification ===");
        
        // 验证基本配置
        require(zetaPayment.owner() != address(0), "Owner not set");
        require(zetaPayment.zetaConnector() == config.zetaConnector, "ZetaConnector mismatch");
        require(zetaPayment.platformFeeRate() == 250, "Platform fee rate incorrect");
        
        // 验证支持的链
        require(zetaPayment.supportedChains(1), "Ethereum not supported");
        require(zetaPayment.supportedChains(56), "BSC not supported");
        require(zetaPayment.supportedChains(137), "Polygon not supported");
        require(zetaPayment.supportedChains(8453), "Base not supported");
        require(zetaPayment.supportedChains(11155111), "Sepolia not supported");
        
        // 验证支持的币种
        require(zetaPayment.isCurrencySupported("ETH"), "ETH not supported");
        require(zetaPayment.isCurrencySupported("BTC"), "BTC not supported");
        require(zetaPayment.isCurrencySupported("USDC"), "USDC not supported");
        
        console.log("✅ All verifications passed");
    }
    
    function _outputDeploymentInfo(ZetaCrossChainPayment zetaPayment, NetworkConfig memory config) internal view {
        console.log("\n=== Deployment Information ===");
        console.log("Contract Address:", address(zetaPayment));
        console.log("Owner:", zetaPayment.owner());
        console.log("ZetaConnector:", zetaPayment.zetaConnector());
        console.log("Platform Fee Rate:", zetaPayment.platformFeeRate(), "basis points");
        console.log("Next Payment ID:", zetaPayment.nextPaymentId());
        
        console.log("\n=== Supported Chains ===");
        console.log("Ethereum (1): Supported");
        console.log("BSC (56): Supported");
        console.log("Polygon (137): Supported");
        console.log("Base (8453): Supported");
        console.log("Sepolia (11155111): Supported");
        
        console.log("\n=== Supported Currencies ===");
        console.log("ETH, BTC, USDC, USDT, BNB, MATIC");
        
        console.log("\n=== Next Steps ===");
        console.log("1. Configure target contracts for each chain");
        console.log("2. Set up relayers for cross-chain messaging");
        console.log("3. Test cross-chain payments");
        console.log("4. Verify contract on block explorer");
    }
}