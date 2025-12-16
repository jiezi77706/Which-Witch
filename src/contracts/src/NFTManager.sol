// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NFTManager
 * @notice ERC721 NFT合约，代表作品创作权
 * @dev 每个NFT代表一个作品的创作权，可以购买和售卖
 */
contract NFTManager is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Custom errors
    error WorkNotFound(uint256 workId);
    error NFTAlreadyMinted(uint256 workId);
    error NotWorkCreator(address caller, uint256 workId);
    error InvalidCreationManager();
    error InvalidRoyaltyManager();

    // State variables
    mapping(uint256 => uint256) public workToTokenId; // workId => tokenId
    mapping(uint256 => uint256) public tokenIdToWork; // tokenId => workId
    mapping(uint256 => bool) public workNFTMinted; // workId => minted status
    
    address public creationManager;
    address public royaltyManager;
    uint256 private _nextTokenId = 1;

    // Events
    event WorkNFTMinted(
        uint256 indexed workId,
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        uint256 timestamp
    );

    event CreationManagerSet(address indexed creationManager);
    event RoyaltyManagerSet(address indexed royaltyManager);

    /**
     * @notice Constructor
     * @param _name NFT collection name
     * @param _symbol NFT collection symbol
     */
    constructor(string memory _name, string memory _symbol) 
        ERC721(_name, _symbol) 
        Ownable(msg.sender) 
    {}

    /**
     * @notice 设置CreationManager合约地址
     * @param _creationManager CreationManager合约地址
     */
    function setCreationManager(address _creationManager) external onlyOwner {
        if (_creationManager == address(0)) revert InvalidCreationManager();
        creationManager = _creationManager;
        emit CreationManagerSet(_creationManager);
    }

    /**
     * @notice 设置RoyaltyManager合约地址
     * @param _royaltyManager RoyaltyManager合约地址
     */
    function setRoyaltyManager(address _royaltyManager) external onlyOwner {
        if (_royaltyManager == address(0)) revert InvalidRoyaltyManager();
        royaltyManager = _royaltyManager;
        emit RoyaltyManagerSet(_royaltyManager);
    }

    /**
     * @notice 为作品铸造NFT
     * @param workId 作品ID
     * @param _tokenURI NFT元数据URI
     * @return tokenId 铸造的NFT ID
     */
    function mintWorkNFT(uint256 workId, string calldata _tokenURI) 
        external 
        nonReentrant 
        returns (uint256 tokenId) 
    {
        // 检查作品是否存在且调用者是创作者
        (bool success, bytes memory data) = creationManager.call(
            abi.encodeWithSignature("getWork(uint256)", workId)
        );
        require(success, "Failed to get work");
        
        (, address creator, , , , , bool exists) = abi.decode(
            data, 
            (uint256, address, uint256, uint256, uint256, bool, bool)
        );
        
        if (!exists) revert WorkNotFound(workId);
        if (creator != msg.sender) revert NotWorkCreator(msg.sender, workId);
        if (workNFTMinted[workId]) revert NFTAlreadyMinted(workId);

        // 铸造NFT
        tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        // 更新映射关系
        workToTokenId[workId] = tokenId;
        tokenIdToWork[tokenId] = workId;
        workNFTMinted[workId] = true;

        emit WorkNFTMinted(workId, tokenId, creator, _tokenURI, block.timestamp);
    }

    /**
     * @notice 获取作品对应的NFT ID
     * @param workId 作品ID
     * @return tokenId NFT ID，如果未铸造则返回0
     */
    function getWorkTokenId(uint256 workId) external view returns (uint256) {
        return workToTokenId[workId];
    }

    /**
     * @notice 获取NFT对应的作品ID
     * @param tokenId NFT ID
     * @return workId 作品ID
     */
    function getTokenWork(uint256 tokenId) external view returns (uint256) {
        return tokenIdToWork[tokenId];
    }

    /**
     * @notice 检查作品是否已铸造NFT
     * @param workId 作品ID
     * @return 是否已铸造
     */
    function isWorkNFTMinted(uint256 workId) external view returns (bool) {
        return workNFTMinted[workId];
    }

    /**
     * @notice 获取CreationManager合约地址
     * @return CreationManager合约地址
     */
    function getCreationManager() external view returns (address) {
        return creationManager;
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}