// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ICreationManager.sol";
import "./interfaces/IAuthorizationManager.sol";

/**
 * @title PaymentManager
 * @dev Handles payments, tips, and revenue distribution
 */
contract PaymentManager {
    mapping(address => uint256) public balances;
    
    ICreationManager public creationManager;
    IAuthorizationManager public authorizationManager;
    address public platformWallet;
    
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 350; // 3.5%
    uint256 public constant BASIS_POINTS = 10000;

    event PaymentProcessed(
        uint256 indexed workId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event RevenueDistributed(
        uint256 indexed workId,
        address indexed directCreator,
        address[] ancestors,
        uint256 totalAmount,
        uint256 timestamp
    );

    event Withdrawal(
        address indexed creator,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );

    constructor(
        address _creationManager,
        address _authorizationManager,
        address _platformWallet
    ) {
        creationManager = ICreationManager(_creationManager);
        authorizationManager = IAuthorizationManager(_authorizationManager);
        platformWallet = _platformWallet;
    }

    /**
     * @dev Process payment for work authorization
     */
    function processPayment(uint256 workId) external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        // Get work info and ancestor chain
        ICreationManager.Work memory work = creationManager.getWork(workId);
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        // Distribute revenue
        _distributeRevenue(workId, work.creator, ancestors, msg.value);
        
        emit PaymentProcessed(workId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Send tip directly to a creator
     */
    function tipCreator(address creator) external payable {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(creator != address(0), "Invalid creator address");
        
        balances[creator] += msg.value;
        
        emit TipSent(msg.sender, creator, msg.value, block.timestamp);
    }

    /**
     * @dev Distribute revenue across the creation chain
     */
    function distributeRevenue(
        uint256 workId,
        address directCreator,
        address[] memory ancestors
    ) external payable {
        require(msg.value > 0, "Revenue amount must be greater than 0");
        _distributeRevenue(workId, directCreator, ancestors, msg.value);
    }

    /**
     * @dev Internal function to distribute revenue
     */
    function _distributeRevenue(
        uint256 workId,
        address directCreator,
        address[] memory ancestors,
        uint256 totalAmount
    ) internal {
        if (ancestors.length == 1) {
            // Original work - 100% to creator
            balances[directCreator] += totalAmount;
        } else if (ancestors.length == 2) {
            // First derivative - 40% direct, 40% original, 20% middle (none)
            uint256 directShare = (totalAmount * 4000) / BASIS_POINTS; // 40%
            uint256 originalShare = (totalAmount * 4000) / BASIS_POINTS; // 40%
            uint256 remaining = totalAmount - directShare - originalShare; // 20%
            
            balances[ancestors[0]] += directShare; // Direct creator
            balances[ancestors[1]] += originalShare; // Original creator
            balances[platformWallet] += remaining; // No middle ancestors
        } else {
            // Multiple derivatives
            uint256 directShare = (totalAmount * 4000) / BASIS_POINTS; // 40%
            uint256 originalShare = (totalAmount * 4000) / BASIS_POINTS; // 40%
            uint256 middleShare = (totalAmount * 2000) / BASIS_POINTS; // 20%
            
            balances[ancestors[0]] += directShare; // Direct creator
            balances[ancestors[ancestors.length - 1]] += originalShare; // Original creator
            
            // Distribute middle share among middle ancestors
            if (ancestors.length > 2) {
                uint256 middleCount = ancestors.length - 2;
                uint256 perMiddle = middleShare / middleCount;
                
                for (uint256 i = 1; i < ancestors.length - 1; i++) {
                    balances[ancestors[i]] += perMiddle;
                }
            }
        }
        
        emit RevenueDistributed(workId, directCreator, ancestors, totalAmount, block.timestamp);
    }

    /**
     * @dev Withdraw creator balance with platform fee
     */
    function withdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        uint256 fee = (balance * PLATFORM_FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 withdrawAmount = balance - fee;
        
        balances[msg.sender] = 0;
        
        // Transfer to creator
        (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
        require(success, "Withdrawal failed");
        
        // Transfer fee to platform
        (bool feeSuccess, ) = payable(platformWallet).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");
        
        emit Withdrawal(msg.sender, withdrawAmount, fee, block.timestamp);
    }

    /**
     * @dev Platform owner can withdraw accumulated fees
     */
    function withdrawPlatformFees() external {
        require(msg.sender == platformWallet, "Only platform wallet can withdraw fees");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(platformWallet).call{value: balance}("");
        require(success, "Platform fee withdrawal failed");
    }

    /**
     * @dev Get creator balance
     */
    function getBalance(address creator) external view returns (uint256) {
        return balances[creator];
    }

    /**
     * @dev Get creator revenue (alias for getBalance)
     */
    function getCreatorRevenue(address creator) external view returns (uint256) {
        return balances[creator];
    }
}