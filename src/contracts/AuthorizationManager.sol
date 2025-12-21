// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ICreationManager.sol";
import "./interfaces/IPaymentManager.sol";

/**
 * @title AuthorizationManager
 * @dev Manages authorization requests for creating derivative works
 */
contract AuthorizationManager {
    mapping(address => mapping(uint256 => uint256)) public authorizations; // user => workId => timestamp
    
    ICreationManager public creationManager;
    IPaymentManager public paymentManager;

    event AuthorizationRequested(
        address indexed user,
        uint256 indexed workId,
        uint256 amount,
        uint256 timestamp
    );

    event AuthorizationGranted(
        address indexed user,
        uint256 indexed workId,
        uint256 timestamp
    );

    constructor(address _creationManager, address _paymentManager) {
        creationManager = ICreationManager(_creationManager);
        paymentManager = IPaymentManager(_paymentManager);
    }

    /**
     * @dev Request authorization to create a derivative work
     */
    function requestAuthorization(uint256 workId) external payable {
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        require(work.derivativeAllowed, "Derivatives not allowed for this work");
        require(msg.value >= work.licenseFee, "Insufficient payment");
        
        // Grant authorization immediately
        authorizations[msg.sender][workId] = block.timestamp;
        
        emit AuthorizationRequested(msg.sender, workId, msg.value, block.timestamp);
        emit AuthorizationGranted(msg.sender, workId, block.timestamp);
        
        // Distribute payment if any
        if (msg.value > 0) {
            address[] memory ancestors = creationManager.getAncestorChain(workId);
            paymentManager.distributeRevenue{value: msg.value}(
                workId,
                work.creator,
                ancestors
            );
        }
    }

    /**
     * @dev Check if user has authorization for a work
     */
    function hasAuthorization(address user, uint256 workId) external view returns (bool) {
        return authorizations[user][workId] > 0;
    }

    /**
     * @dev Get authorization timestamp
     */
    function getAuthorizationTimestamp(address user, uint256 workId) external view returns (uint256) {
        return authorizations[user][workId];
    }
}