// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IAuthorizationManager.sol";
import "./interfaces/IPaymentManager.sol";

/**
 * @title CreationManager
 * @dev Manages the registration and tracking of original and derivative works
 */
contract CreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId; // 0 for original works
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }

    mapping(uint256 => Work) public works;
    mapping(address => uint256[]) public creatorWorks;
    mapping(uint256 => uint256[]) public derivatives; // parentId => childIds[]
    
    uint256 public nextWorkId = 1;
    
    IAuthorizationManager public authorizationManager;
    IPaymentManager public paymentManager;

    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        uint256 licenseFee,
        bool derivativeAllowed,
        string metadataURI,
        uint256 timestamp
    );

    constructor(address _authorizationManager, address _paymentManager) {
        authorizationManager = IAuthorizationManager(_authorizationManager);
        paymentManager = IPaymentManager(_paymentManager);
    }

    /**
     * @dev Register an original work
     */
    function registerOriginalWork(
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: 0,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        
        emit WorkRegistered(
            workId,
            msg.sender,
            licenseFee,
            derivativeAllowed,
            metadataURI,
            block.timestamp
        );
    }

    /**
     * @dev Register a derivative work
     */
    function registerDerivativeWork(
        uint256 parentId,
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        require(works[parentId].exists, "Parent work does not exist");
        require(works[parentId].derivativeAllowed, "Derivatives not allowed");
        require(
            authorizationManager.hasAuthorization(msg.sender, parentId),
            "No authorization for parent work"
        );
        
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: parentId,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        derivatives[parentId].push(workId);
        
        emit WorkRegistered(
            workId,
            msg.sender,
            licenseFee,
            derivativeAllowed,
            metadataURI,
            block.timestamp
        );
    }

    /**
     * @dev Get work information
     */
    function getWork(uint256 workId) external view returns (Work memory) {
        require(works[workId].exists, "Work does not exist");
        return works[workId];
    }

    /**
     * @dev Get all works by a creator
     */
    function getWorksByCreator(address creator) external view returns (uint256[] memory) {
        return creatorWorks[creator];
    }

    /**
     * @dev Get all derivatives of a work
     */
    function getDerivatives(uint256 parentId) external view returns (uint256[] memory) {
        return derivatives[parentId];
    }

    /**
     * @dev Get the ancestor chain for revenue distribution
     */
    function getAncestorChain(uint256 workId) external view returns (address[] memory) {
        require(works[workId].exists, "Work does not exist");
        
        // Count ancestors
        uint256 count = 0;
        uint256 currentId = workId;
        while (works[currentId].parentId != 0) {
            currentId = works[currentId].parentId;
            count++;
        }
        
        // Build ancestor array
        address[] memory ancestors = new address[](count + 1);
        currentId = workId;
        for (uint256 i = 0; i <= count; i++) {
            ancestors[i] = works[currentId].creator;
            if (works[currentId].parentId == 0) break;
            currentId = works[currentId].parentId;
        }
        
        return ancestors;
    }
}