// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ICreationManager.sol";
import "./interfaces/IRoyaltyManager.sol";

/**
 * @title NFTMarketplace
 * @dev Marketplace for trading work NFTs with automatic royalty distribution
 */
contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 timestamp;
    }

    mapping(uint256 => Listing) public listings; // tokenId => Listing
    mapping(address => uint256[]) public sellerListings; // seller => tokenIds[]
    uint256[] public activeListings;
    
    IERC721 public nftContract;
    ICreationManager public creationManager;
    IRoyaltyManager public royaltyManager;
    address public platformWallet;
    
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
    uint256 public constant BASIS_POINTS = 10000;

    event TokenListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 platformFee,
        uint256 timestamp
    );

    event ListingCancelled(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 timestamp
    );

    constructor(
        address _nftContract,
        address _creationManager,
        address _royaltyManager,
        address _platformWallet
    ) {
        nftContract = IERC721(_nftContract);
        creationManager = ICreationManager(_creationManager);
        royaltyManager = IRoyaltyManager(_royaltyManager);
        platformWallet = _platformWallet;
    }

    /**
     * @dev List NFT for sale
     */
    function listToken(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "Token already listed");
        
        // Transfer NFT to marketplace
        nftContract.transferFrom(msg.sender, address(this), tokenId);
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            timestamp: block.timestamp
        });
        
        sellerListings[msg.sender].push(tokenId);
        activeListings.push(tokenId);
        
        emit TokenListed(tokenId, msg.sender, price, block.timestamp);
    }

    /**
     * @dev Buy listed NFT
     */
    function buyToken(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Token not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own token");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Mark as inactive
        listing.active = false;
        _removeFromActiveListings(tokenId);
        
        // Calculate platform fee
        uint256 platformFee = (price * PLATFORM_FEE_PERCENTAGE) / BASIS_POINTS;
        uint256 sellerAmount = price - platformFee;
        
        // Transfer NFT to buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        // Distribute payments with royalties
        royaltyManager.distributeNFTSaleRevenue{value: sellerAmount}(
            tokenId,
            seller,
            sellerAmount
        );
        
        // Transfer platform fee
        (bool feeSuccess, ) = payable(platformWallet).call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        
        // Refund excess payment
        if (msg.value > price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit TokenSold(tokenId, seller, msg.sender, price, platformFee, block.timestamp);
    }

    /**
     * @dev Cancel listing
     */
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Token not listed");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.active = false;
        _removeFromActiveListings(tokenId);
        
        // Return NFT to seller
        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        emit ListingCancelled(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get listing information
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    /**
     * @dev Get all active listings
     */
    function getActiveListings() external view returns (uint256[] memory) {
        // Filter out inactive listings
        uint256 activeCount = 0;
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].active) {
                activeCount++;
            }
        }
        
        uint256[] memory result = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (listings[activeListings[i]].active) {
                result[index] = activeListings[i];
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get listings by seller
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    /**
     * @dev Remove token from active listings array
     */
    function _removeFromActiveListings(uint256 tokenId) internal {
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i] == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }
    }
}