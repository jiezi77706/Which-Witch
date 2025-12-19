// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WorkRegistry
 * @notice 作品注册管理合约 - 部署在Sepolia
 * @dev 只负责作品的创建和管理，不包含支付、投票、NFT功能
 */
contract WorkRegistry is Ownable, ReentrancyGuard {
    
    // ============================================
    // 数据结构
    // ============================================
    
    // 创作类型枚举（对应数据库的creation_type）
    enum CreationType {
        ORIGINAL,              // 原创
        AUTHOR_CONTINUATION,   // 原作者延续
        AUTHORIZED_DERIVATIVE, // 授权衍生
        UNAUTHORIZED_DERIVATIVE // 未授权衍生
    }
    
    // 作品信息
    struct Work {
        uint256 workId;
        address creator;
        CreationType creationType;
        uint256 parentWorkId; // 父作品ID，0表示原创
        string metadataURI;
        uint256 licenseFee;   // 二创授权费（wei）
        bool allowRemix;
        uint256 createdAt;
        bool isActive;
    }
    
    // ============================================
    // 状态变量
    // ============================================
    
    // 作品存储
    mapping(uint256 => Work) public works;
    mapping(uint256 => uint256[]) public workDerivatives; // workId => 衍生作品ID数组
    mapping(address => uint256[]) public creatorWorks; // creator => 作品ID数组
    
    // 计数器
    uint256 public nextWorkId = 1;
    uint256 public totalWorks = 0;
    
    // 授权的合约地址（NFT合约、投票合约等）
    mapping(address => bool) public authorizedContracts;
    
    // ============================================
    // 事件
    // ============================================
    
    event WorkCreated(
        uint256 indexed workId,
        address indexed creator,
        CreationType creationType,
        uint256 parentWorkId,
        string metadataURI,
        uint256 licenseFee,
        bool allowRemix
    );
    
    event WorkUpdated(
        uint256 indexed workId,
        string metadataURI,
        uint256 licenseFee,
        bool allowRemix
    );
    
    event ContractAuthorized(
        address indexed contractAddress,
        bool authorized
    );
    
    // ============================================
    // 修饰符
    // ============================================
    
    modifier onlyAuthorizedContract() {
        require(authorizedContracts[msg.sender], "Not authorized contract");
        _;
    }
    
    modifier workExists(uint256 workId) {
        require(works[workId].creator != address(0), "Work does not exist");
        _;
    }
    
    modifier onlyWorkCreator(uint256 workId) {
        require(works[workId].creator == msg.sender, "Not work creator");
        _;
    }
    
    // ============================================
    // 构造函数
    // ============================================
    
    constructor() Ownable(msg.sender) {
    }
    
    // ============================================
    // 作品管理功能
    // ============================================
    
    /**
     * @notice 创建作品
     * @param metadataURI 作品元数据URI
     * @param licenseFee 二创授权费（wei）
     * @param allowRemix 是否允许二创
     * @param parentWorkId 父作品ID（0表示原创）
     */
    function createWork(
        string memory metadataURI,
        uint256 licenseFee,
        bool allowRemix,
        uint256 parentWorkId
    ) external returns (uint256 workId) {
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        
        workId = nextWorkId++;
        CreationType creationType = CreationType.ORIGINAL;
        
        // 判断创作类型
        if (parentWorkId > 0) {
            require(works[parentWorkId].creator != address(0), "Parent work not found");
            require(works[parentWorkId].allowRemix, "Parent work does not allow remix");
            
            if (works[parentWorkId].creator == msg.sender) {
                creationType = CreationType.AUTHOR_CONTINUATION;
            } else {
                creationType = CreationType.AUTHORIZED_DERIVATIVE;
            }
            
            // 添加到衍生作品列表
            workDerivatives[parentWorkId].push(workId);
        }
        
        // 创建作品记录
        works[workId] = Work({
            workId: workId,
            creator: msg.sender,
            creationType: creationType,
            parentWorkId: parentWorkId,
            metadataURI: metadataURI,
            licenseFee: licenseFee,
            allowRemix: allowRemix,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // 添加到创作者作品列表
        creatorWorks[msg.sender].push(workId);
        totalWorks++;
        
        emit WorkCreated(
            workId,
            msg.sender,
            creationType,
            parentWorkId,
            metadataURI,
            licenseFee,
            allowRemix
        );
    }
    
    // ============================================
    // 查询功能
    // ============================================
    
    /**
     * @notice 获取作品信息
     */
    function getWork(uint256 workId) external view returns (
        uint256 id,
        address creator,
        CreationType creationType,
        uint256 parentWorkId,
        string memory metadataURI,
        uint256 licenseFee,
        bool allowRemix,
        uint256 createdAt,
        bool isActive
    ) {
        Work storage work = works[workId];
        return (
            work.workId,
            work.creator,
            work.creationType,
            work.parentWorkId,
            work.metadataURI,
            work.licenseFee,
            work.allowRemix,
            work.createdAt,
            work.isActive
        );
    }
    
    /**
     * @notice 获取作品的衍生作品列表
     */
    function getWorkDerivatives(uint256 workId) external view returns (uint256[] memory) {
        return workDerivatives[workId];
    }
    
    /**
     * @notice 获取创作者的作品列表
     */
    function getCreatorWorks(address creator) external view returns (uint256[] memory) {
        return creatorWorks[creator];
    }
    
    /**
     * @notice 检查是否为作品创作者
     */
    function isWorkCreator(uint256 workId, address user) external view returns (bool) {
        return works[workId].creator == user;
    }
    
    /**
     * @notice 获取作品的授权费
     */
    function getWorkLicenseFee(uint256 workId) external view returns (uint256) {
        return works[workId].licenseFee;
    }
    
    /**
     * @notice 检查作品是否允许二创
     */
    function isRemixAllowed(uint256 workId) external view returns (bool) {
        return works[workId].allowRemix;
    }
    
    // ============================================
    // 授权合约管理
    // ============================================
    
    /**
     * @notice 授权合约（仅owner）
     * @param contractAddress 合约地址
     * @param authorized 是否授权
     */
    function authorizeContract(address contractAddress, bool authorized) 
        external 
        onlyOwner 
    {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = authorized;
        
        emit ContractAuthorized(contractAddress, authorized);
    }
    
    /**
     * @notice 验证作品创作者（供其他合约调用）
     */
    function validateWorkCreator(uint256 workId, address user) 
        external 
        view 
        onlyAuthorizedContract 
        returns (bool) 
    {
        return works[workId].creator == user;
    }
}