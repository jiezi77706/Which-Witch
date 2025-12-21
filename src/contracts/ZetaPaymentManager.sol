// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

/**
 * @title ZetaPaymentManager
 * @dev Cross-chain payment processor for WhichWitch platform
 */
contract ZetaPaymentManager is zContract {
    SystemContract public systemContract;
    
    mapping(address => uint256) public balances;
    address public platformWallet;
    
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 350; // 3.5%
    uint256 public constant BASIS_POINTS = 10000;

    event CrossChainPaymentReceived(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 chainId,
        bytes32 indexed txHash
    );

    event CrossChainTipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 sourceChain,
        uint256 timestamp
    );

    event CrossChainWithdrawal(
        address indexed creator,
        uint256 amount,
        uint256 fee,
        uint256 targetChain,
        uint256 timestamp
    );

    modifier onlySystem() {
        require(
            msg.sender == address(systemContract),
            "Only system contract can call this function"
        );
        _;
    }

    constructor(address systemContractAddress, address _platformWallet) {
        systemContract = SystemContract(systemContractAddress);
        platformWallet = _platformWallet;
    }

    /**
     * @dev Handle cross-chain calls from other chains
     */
    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlySystem {
        // Decode message to get recipient and payment type
        (address recipient, uint8 paymentType) = abi.decode(message, (address, uint8));
        
        if (paymentType == 0) {
            // Direct tip
            _processCrossChainTip(context.sender, recipient, amount, context.chainID);
        } else if (paymentType == 1) {
            // Work authorization payment
            _processCrossChainAuthorization(context.sender, recipient, amount, context.chainID);
        }
        
        emit CrossChainPaymentReceived(
            context.sender,
            recipient,
            amount,
            context.chainID,
            context.txHash
        );
    }

    /**
     * @dev Process cross-chain tip
     */
    function _processCrossChainTip(
        address sender,
        address recipient,
        uint256 amount,
        uint256 sourceChain
    ) internal {
        require(recipient != address(0), "Invalid recipient");
        
        balances[recipient] += amount;
        
        emit CrossChainTipSent(sender, recipient, amount, sourceChain, block.timestamp);
    }

    /**
     * @dev Process cross-chain authorization payment
     */
    function _processCrossChainAuthorization(
        address sender,
        address recipient,
        uint256 amount,
        uint256 sourceChain
    ) internal {
        require(recipient != address(0), "Invalid recipient");
        
        // For authorization payments, distribute according to revenue sharing rules
        // This is a simplified version - in production, you'd integrate with CreationManager
        balances[recipient] += amount;
        
        emit CrossChainPaymentReceived(sender, recipient, amount, sourceChain, bytes32(0));
    }

    /**
     * @dev Send cross-chain tip
     */
    function sendCrossChainTip(
        address recipient,
        uint256 targetChain,
        address targetZRC20
    ) external payable {
        require(msg.value > 0, "Must send some value");
        require(recipient != address(0), "Invalid recipient");
        
        // Encode message
        bytes memory message = abi.encode(recipient, uint8(0)); // 0 = tip
        
        // Send cross-chain transaction
        systemContract.onCrossChainCall(
            zContext({
                sender: msg.sender,
                chainID: targetChain,
                txHash: bytes32(0)
            }),
            targetZRC20,
            msg.value,
            message
        );
    }

    /**
     * @dev Withdraw balance with cross-chain support
     */
    function withdrawCrossChain(uint256 targetChain, address targetZRC20) external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        uint256 fee = (balance * PLATFORM_FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 withdrawAmount = balance - fee;
        
        balances[msg.sender] = 0;
        
        // Transfer fee to platform
        balances[platformWallet] += fee;
        
        // Send cross-chain withdrawal
        bytes memory message = abi.encode(msg.sender, uint8(2)); // 2 = withdrawal
        
        systemContract.onCrossChainCall(
            zContext({
                sender: address(this),
                chainID: targetChain,
                txHash: bytes32(0)
            }),
            targetZRC20,
            withdrawAmount,
            message
        );
        
        emit CrossChainWithdrawal(
            msg.sender,
            withdrawAmount,
            fee,
            targetChain,
            block.timestamp
        );
    }

    /**
     * @dev Get balance for an address
     */
    function getBalance(address creator) external view returns (uint256) {
        return balances[creator];
    }

    /**
     * @dev Platform owner can withdraw fees
     */
    function withdrawPlatformFees() external {
        require(msg.sender == platformWallet, "Only platform wallet");
        
        uint256 balance = balances[platformWallet];
        require(balance > 0, "No fees to withdraw");
        
        balances[platformWallet] = 0;
        
        (bool success, ) = payable(platformWallet).call{value: balance}("");
        require(success, "Platform fee withdrawal failed");
    }
}