// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../zeta/ZetaCrossChainPayment.sol";

/**
 * @title ConfigureZetaPayment
 * @notice 配置ZetaChain跨链支付合约的脚本
 */
contract ConfigureZetaPayment is Script {
    
    // 目标链配置
    struct ChainConfig {
        uint256 chainId;
        string name;
        address targetContract;
        uint256 minAmount;
        uint256 maxAmount;
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address zetaPaymentAddress = vm.envAddress("ZETA_PAYMENT_ADDRESS");
        
        console.log("Configuring ZetaCrossChainPayment at:", zetaPaymentAddress);
        
        ZetaCrossChainPayment zetaPayment = ZetaCrossChainPayment(payable(zetaPaymentAddress));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 配置支持的链
        _configureChains(zetaPayment);
        
        // 配置币种（如果需要添加新币种）
        _configureCurrencies(zetaPayment);
        
        // 配置中继器
        _configureRelayers(zetaPayment);
        
        vm.stopBroadcast();
        
        console.log("✅ Configuration completed");
    }
    
    function _configureChains(ZetaCrossChainPayment zetaPayment) internal {
        console.log("\n=== Configuring Chains ===");
        
        ChainConfig[] memory chains = new ChainConfig[](5);
        
        // Ethereum主网
        chains[0] = ChainConfig({
            chainId: 1,
            name: "Ethereum",
            targetContract: vm.envOr("ETHEREUM_TARGET_CONTRACT", address(0)),
            minAmount: 0.001 ether,
            maxAmount: 100 ether
        });
        
        // BSC主网
        chains[1] = ChainConfig({
            chainId: 56,
            name: "BSC",
            targetContract: vm.envOr("BSC_TARGET_CONTRACT", address(0)),
            minAmount: 0.001 ether,
            maxAmount: 100 ether
        });
        
        // Polygon主网
        chains[2] = ChainConfig({
            chainId: 137,
            name: "Polygon",
            targetContract: vm.envOr("POLYGON_TARGET_CONTRACT", address(0)),
            minAmount: 0.001 ether,
            maxAmount: 100 ether
        });
        
        // Base主网
        chains[3] = ChainConfig({
            chainId: 8453,
            name: "Base",
            targetContract: vm.envOr("BASE_TARGET_CONTRACT", address(0)),
            minAmount: 0.001 ether,
            maxAmount: 100 ether
        });
        
        // Sepolia测试网
        chains[4] = ChainConfig({
            chainId: 11155111,
            name: "Sepolia",
            targetContract: vm.envOr("SEPOLIA_TARGET_CONTRACT", address(0)),
            minAmount: 0.001 ether,
            maxAmount: 100 ether
        });
        
        for (uint256 i = 0; i < chains.length; i++) {
            ChainConfig memory chain = chains[i];
            
            zetaPayment.configureChain(
                chain.chainId,
                true, // supported
                chain.targetContract,
                chain.minAmount,
                chain.maxAmount
            );
            
            console.log("Configured chain:", chain.name);
            console.log("  Chain ID:", chain.chainId);
            console.log("  Target Contract:", chain.targetContract);
            console.log("  Min Amount:", chain.minAmount);
            console.log("  Max Amount:", chain.maxAmount);
        }
    }
    
    function _configureCurrencies(ZetaCrossChainPayment zetaPayment) internal {
        console.log("\n=== Configuring Currencies ===");
        
        string[] memory currencies = new string[](6);
        currencies[0] = "ETH";
        currencies[1] = "BTC";
        currencies[2] = "USDC";
        currencies[3] = "USDT";
        currencies[4] = "BNB";
        currencies[5] = "MATIC";
        
        for (uint256 i = 0; i < currencies.length; i++) {
            zetaPayment.configureCurrency(currencies[i], true);
            console.log("Configured currency:", currencies[i]);
        }
    }
    
    function _configureRelayers(ZetaCrossChainPayment zetaPayment) internal {
        console.log("\n=== Configuring Relayers ===");
        
        // 配置授权的中继器地址
        address[] memory relayers = new address[](2);
        relayers[0] = vm.envOr("RELAYER_1", address(0));
        relayers[1] = vm.envOr("RELAYER_2", address(0));
        
        for (uint256 i = 0; i < relayers.length; i++) {
            if (relayers[i] != address(0)) {
                zetaPayment.authorizeRelayer(relayers[i], true);
                console.log("Authorized relayer:", relayers[i]);
            }
        }
    }
}