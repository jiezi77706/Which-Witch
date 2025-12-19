// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWorkRegistry {
    function validateWorkCreator(uint256 workId, address user) external view returns (bool);
    function getWork(uint256 workId) external view returns (
        uint256 id,
        address creator,
        uint8 creationType,
        uint256 parentWorkId,
        string memory metadataURI,
        uint256 licenseFee,
        bool allowRemix,
        uint256 createdAt,
        bool isActive
    );
}

/**
 * @title CreationRightsNFT
 * @notice 创作权NFT合约 - 部署在Sepolia
 * @dev ERC721 NFT代表作品的创作权，可以交易转移
 */
contract CreationRightsNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    // ============================================
    // 状态变量
    // ============================================
    
    // WorkRegistry合约地址
    IWorkRegistry public workRegistry;
    
    // NFT相关映射
    mapping(uint256 => uint256) public nftToWork; // NFT tokenId => workId
    mapping(uint256 => uint256) public workToNFT; // workId => NFT tokenId
    mapping(uint256 => bool) public workHasNFT;   // workId => 是否已铸造NFT
    
    // 市场相关
    mapping(uint256 => uint256) public nftPrices; // tokenId => 价格
    mapping(uint256 => bool) public nftForSale;   // tokenId => 是否在售
    
    // 计数器
    uint256 public nextTokenId = 1;
    
    // 平台费率（基点，10000 = 100%）
    uint256 public platformFeeRate = 250; // 2.5%
    
    // 平台收益
    uint256 public platformBalance;
    
    // ============================================
    // 事件
    // ============================================
    
    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed workId,
        address indexed creator
    );
    
    event NFTListed(
        uint256 indexed tokenId,
        uint256 indexed workId,
        address indexed seller,
        uint256 price
    );
    
    event NFTSold(
        uint256 indexed tokenId,
        uint256 indexed workId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    // ============================================
    // 构造函数
    // ============================================
    
    constructor(address _workRegistry) 
        ERC721("WhichWitch Creation Rights", "WWCR") 
        Ownable(msg.sender)
    {
        require(_workRegistry != address(0), "Invalid work registry");
        workRegistry = IWorkRegistry(_workRegistry);
    }
    
    // ============================================
    // NFT铸造功能
    // ============================================
    
    /**
     * @notice 铸造作品NFT（仅作品创作者）
     * @param workId 作品ID
     */
    function mintWorkNFT(uint256 workId) external nonReentrant returns (uint256 tokenId) {
        // 验证作品创作者
        require(
            workRegistry.validateWorkCreator(workId, msg.sender),
            "Not work creator"
        );
        
        // 检查是否已铸造
        require(!workHasNFT[workId], "NFT already minted for this work");
        
        // 获取作品信息
        (,,,, string memory metadataURI,,,, bool isActive) = workRegistry.getWork(workId);
        require(isActive, "Work is not active");
        
        // 铸造NFT
        tokenId = nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // 建立映射关系
        nftToWork[tokenId] = workId;
        workToNFT[workId] = tokenId;
        workHasNFT[workId] = true;
        
        emit NFTMinted(tokenId, workId, msg.sender);
    }
    
    // ============================================
    // NFT市场功能
    // ============================================
    
    /**
     * @notice 挂售NFT
     * @param tokenId NFT ID
     * @param price 售价（wei）
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        require(_ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(price > 0, "Price must be greater than 0");
        require(!nftForSale[tokenId], "NFT already listed");
        
        nftPrices[tokenId] = price;
        nftForSale[tokenId] = true;
        
        uint256 workId = nftToWork[tokenId];
        emit NFTListed(tokenId, workId, msg.sender, price);
    }
    
    /**
     * @notice 购买NFT
     * @param tokenId NFT ID
     */
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        require(nftForSale[tokenId], "NFT not for sale");
        require(msg.value >= nftPrices[tokenId], "Insufficient payment");
        require(_ownerOf(tokenId) != msg.sender, "Cannot buy your own NFT");
        
        address seller = _ownerOf(tokenId);
        uint256 price = nftPrices[tokenId];
        uint256 workId = nftToWork[tokenId];
        
        // 计算费用
        uint256 platformFee = (price * platformFeeRate) / 10000;
        uint256 sellerAmount = price - platformFee;
        
        // 更新状态
        nftPrices[tokenId] = 0;
        nftForSale[tokenId] = false;
        platformBalance += platformFee;
        
        // 转移NFT
        _transfer(seller, msg.sender, tokenId);
        
        // 转账给卖家
        (bool success,) = payable(seller).call{value: sellerAmount}("");
        require(success, "Transfer to seller failed");
        
        // 退还多余的ETH
        if (msg.value > price) {
            (bool refundSuccess,) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit NFTSold(tokenId, workId, seller, msg.sender, price);
    }
    
    // ============================================
    // 查询功能
    // ============================================
    
    /**
     * @notice 获取NFT对应的作品ID
     */
    function getNFTWorkId(uint256 tokenId) external view returns (uint256) {
        return nftToWork[tokenId];
    }
    
    /**
     * @notice 获取作品对应的NFT ID
     */
    function getWorkNFTId(uint256 workId) external view returns (uint256) {
        return workToNFT[workId];
    }
    
    /**
     * @notice 检查作品是否已铸造NFT
     */
    function hasWorkNFT(uint256 workId) external view returns (bool) {
        return workHasNFT[workId];
    }
    
    // ============================================
    // 重写函数
    // ============================================
    
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