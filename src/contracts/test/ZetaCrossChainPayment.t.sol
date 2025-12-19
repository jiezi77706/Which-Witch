// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZetaCrossChainPayment.sol";

contract ZetaCrossChainPaymentTest is Test {
    ZetaCrossChainPayment public zetaPayment;
    
    address public owner = address(0x1);
    address public zetaConnector = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public relayer = address(0x5);
    
    uint256 public constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 public constant ETHEREUM_CHAIN_ID = 1;
    
    event CrossChainPaymentInitiated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint8 paymentType,
        uint256 workId,
        uint256 sourceChainId,
        uint256 targetChainId,
        string sourceCurrency
    );
    
    function setUp() public {
        vm.prank(owner);
        zetaPayment = new ZetaCrossChainPayment(zetaConnector);
        
        // 配置测试环境
        vm.prank(owner);
        zetaPayment.authorizeRelayer(relayer, true);
        
        // 给测试用户一些ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }
    
    function testDeployment() public {
        assertEq(zetaPayment.owner(), owner);
        assertEq(zetaPayment.zetaConnector(), zetaConnector);
        assertEq(zetaPayment.platformFeeRate(), 250);
        assertEq(zetaPayment.nextPaymentId(), 1);
        
        // 验证默认支持的链
        assertTrue(zetaPayment.supportedChains(1)); // Ethereum
        assertTrue(zetaPayment.supportedChains(56)); // BSC
        assertTrue(zetaPayment.supportedChains(137)); // Polygon
        assertTrue(zetaPayment.supportedChains(8453)); // Base
        assertTrue(zetaPayment.supportedChains(11155111)); // Sepolia
        
        // 验证默认支持的币种
        assertTrue(zetaPayment.isCurrencySupported("ETH"));
        assertTrue(zetaPayment.isCurrencySupported("BTC"));
        assertTrue(zetaPayment.isCurrencySupported("USDC"));
    }
    
    function testCrossChainTip() public {
        uint256 tipAmount = 1 ether;
        uint256 workId = 123;
        
        vm.expectEmit(true, true, true, true);
        emit CrossChainPaymentInitiated(
            1, // paymentId
            user1, // sender
            user2, // recipient
            tipAmount, // amount
            0, // PaymentType.TIP
            workId, // workId
            block.chainid, // sourceChainId
            SEPOLIA_CHAIN_ID, // targetChainId
            "ETH" // sourceCurrency
        );
        
        vm.prank(user1);
        uint256 paymentId = zetaPayment.initiateCrossChainTip{value: tipAmount}(
            user2,
            workId,
            SEPOLIA_CHAIN_ID,
            "ETH"
        );
        
        assertEq(paymentId, 1);
        
        // 验证支付记录
        (
            uint256 storedPaymentId,
            address sender,
            address recipient,
            uint256 amount,
            uint8 paymentType,
            uint256 storedWorkId,
            uint256 sourceChainId,
            uint256 targetChainId,
            string memory sourceCurrency,
            bool completed,
            uint256 timestamp
        ) = zetaPayment.getPayment(paymentId);
        
        assertEq(storedPaymentId, paymentId);
        assertEq(sender, user1);
        assertEq(recipient, user2);
        assertEq(amount, tipAmount);
        assertEq(paymentType, 0); // TIP
        assertEq(storedWorkId, workId);
        assertEq(sourceChainId, block.chainid);
        assertEq(targetChainId, SEPOLIA_CHAIN_ID);
        assertEq(sourceCurrency, "ETH");
        assertTrue(completed); // Should be completed for same chain
        assertGt(timestamp, 0);
    }
    
    function testCrossChainLicenseFee() public {
        uint256 feeAmount = 0.1 ether;
        uint256 workId = 456;
        
        vm.prank(user1);
        uint256 paymentId = zetaPayment.initiateCrossChainLicenseFee{value: feeAmount}(
            user2,
            workId,
            ETHEREUM_CHAIN_ID,
            "ETH"
        );
        
        assertEq(paymentId, 1);
        
        // 验证支付记录
        (,,,uint8 paymentType,,,,,,) = zetaPayment.getPayment(paymentId);
        assertEq(paymentType, 1); // LICENSE_FEE
    }
    
    function testCrossChainNFTPurchase() public {
        uint256 purchaseAmount = 2 ether;
        uint256 workId = 789;
        
        vm.prank(user1);
        uint256 paymentId = zetaPayment.initiateCrossChainNFTPurchase{value: purchaseAmount}(
            user2,
            workId,
            ETHEREUM_CHAIN_ID,
            "ETH"
        );
        
        assertEq(paymentId, 1);
        
        // 验证支付记录
        (,,,uint8 paymentType,,,,,,) = zetaPayment.getPayment(paymentId);
        assertEq(paymentType, 2); // NFT_PURCHASE
    }
    
    function testPlatformFeeCalculation() public {
        uint256 paymentAmount = 1 ether;
        uint256 expectedPlatformFee = (paymentAmount * 250) / 10000; // 2.5%
        
        uint256 initialBalance = zetaPayment.getPlatformBalance("ETH");
        
        vm.prank(user1);
        zetaPayment.initiateCrossChainTip{value: paymentAmount}(
            user2,
            123,
            SEPOLIA_CHAIN_ID,
            "ETH"
        );
        
        uint256 finalBalance = zetaPayment.getPlatformBalance("ETH");
        assertEq(finalBalance - initialBalance, expectedPlatformFee);
    }
    
    function testOnCrossChainCall() public {
        uint256 amount = 1 ether;
        uint256 workId = 123;
        
        bytes memory message = abi.encode(
            1, // paymentId
            user1, // sender
            user2, // recipient
            amount, // amount
            0, // PaymentType.TIP
            workId, // workId
            "ETH" // sourceCurrency
        );
        
        uint256 initialBalance = user2.balance;
        
        vm.prank(relayer);
        zetaPayment.onCrossChainCall{value: amount}(
            ETHEREUM_CHAIN_ID,
            address(0x123),
            message
        );
        
        assertEq(user2.balance - initialBalance, amount);
    }
    
    function testConfigureChain() public {
        uint256 newChainId = 999;
        address targetContract = address(0x123);
        uint256 minAmount = 0.01 ether;
        uint256 maxAmount = 50 ether;
        
        vm.prank(owner);
        zetaPayment.configureChain(
            newChainId,
            true,
            targetContract,
            minAmount,
            maxAmount
        );
        
        (
            bool supported,
            address storedTargetContract,
            uint256 storedMinAmount,
            uint256 storedMaxAmount
        ) = zetaPayment.getChainInfo(newChainId);
        
        assertTrue(supported);
        assertEq(storedTargetContract, targetContract);
        assertEq(storedMinAmount, minAmount);
        assertEq(storedMaxAmount, maxAmount);
    }
    
    function testConfigureCurrency() public {
        string memory newCurrency = "DOGE";
        
        assertFalse(zetaPayment.isCurrencySupported(newCurrency));
        
        vm.prank(owner);
        zetaPayment.configureCurrency(newCurrency, true);
        
        assertTrue(zetaPayment.isCurrencySupported(newCurrency));
    }
    
    function testWithdrawPlatformFees() public {
        // 先产生一些平台费用
        vm.prank(user1);
        zetaPayment.initiateCrossChainTip{value: 1 ether}(
            user2,
            123,
            SEPOLIA_CHAIN_ID,
            "ETH"
        );
        
        uint256 platformBalance = zetaPayment.getPlatformBalance("ETH");
        assertGt(platformBalance, 0);
        
        uint256 ownerInitialBalance = owner.balance;
        
        vm.prank(owner);
        zetaPayment.withdrawPlatformFees("ETH");
        
        assertEq(zetaPayment.getPlatformBalance("ETH"), 0);
        assertEq(owner.balance - ownerInitialBalance, platformBalance);
    }
    
    function testFailUnauthorizedRelayer() public {
        bytes memory message = abi.encode(
            1, user1, user2, 1 ether, 0, 123, "ETH"
        );
        
        vm.prank(user1); // 未授权的地址
        zetaPayment.onCrossChainCall{value: 1 ether}(
            ETHEREUM_CHAIN_ID,
            address(0x123),
            message
        );
    }
    
    function testFailUnsupportedChain() public {
        vm.prank(user1);
        zetaPayment.initiateCrossChainTip{value: 1 ether}(
            user2,
            123,
            999999, // 不支持的链ID
            "ETH"
        );
    }
    
    function testFailUnsupportedCurrency() public {
        vm.prank(user1);
        zetaPayment.initiateCrossChainTip{value: 1 ether}(
            user2,
            123,
            SEPOLIA_CHAIN_ID,
            "INVALID" // 不支持的币种
        );
    }
    
    function testFailInsufficientAmount() public {
        vm.prank(user1);
        zetaPayment.initiateCrossChainTip{value: 0}( // 金额为0
            user2,
            123,
            SEPOLIA_CHAIN_ID,
            "ETH"
        );
    }
}