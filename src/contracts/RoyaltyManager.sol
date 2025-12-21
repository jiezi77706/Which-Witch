// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ICreationManager.sol";
import "./interfaces/INFTManager.sol";

/**
 * @title RoyaltyManager
 * @dev Manages royalty distribution for NFT sales
 */
contract RoyaltyManager {
    ICreationManager public creationManager;
    INFTManager public nftManager;
    
    uint256 public constant BASIS_POINTS = 10000;

    event RoyaltyDistributed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 totalAmount,
        address[] recipients,
        uint256[] amounts,
        uint256 timestamp
    );

    constructor(address _creationManager, address _nftManager) {
        creationManager = ICreationManager(_creationManager);
        nftManager = INFTManager(_nftManager);
    }

    /**
     * @dev Distribute NFT sale revenue with instant royalty payments
     * Distribution: 70% seller, 20% original creator, 10% middle ancestors
     */
    function distributeNFTSaleRevenue(
        uint256 tokenId,
        address seller,
        uint256 totalAmount
    ) external payable {
        require(msg.value == totalAmount, "Incorrect payment amount");
        
        // Get work ID from token
        uint256 workId = nftManager.getTokenWork(tokenId);
        
        // Get ancestor chain
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        address[] memory recipients;
        uint256[] memory amounts;
        
        if (ancestors.length == 1) {
            // Original work - 100% to seller (who is also the original creator)
            recipients = new address[](1);
            amounts = new uint256[](1);
            
            recipients[0] = seller;
            amounts[0] = totalAmount;
            
            (bool success, ) = payable(seller).call{value: totalAmount}("");
            require(success, "Payment to seller failed");
            
        } else {
            // Derivative work - distribute royalties
            uint256 sellerShare = (totalAmount * 7000) / BASIS_POINTS; // 70%
            uint256 originalShare = (totalAmount * 2000) / BASIS_POINTS; // 20%
            uint256 middleShare = (totalAmount * 1000) / BASIS_POINTS; // 10%
            
            address originalCreator = ancestors[ancestors.length - 1];
            
            if (ancestors.length == 2) {
                // Direct derivative - no middle ancestors
                recipients = new address[](2);
                amounts = new uint256[](2);
                
                recipients[0] = seller;
                amounts[0] = sellerShare + middleShare; // 80% (70% + 10%)
                recipients[1] = originalCreator;
                amounts[1] = originalShare; // 20%
                
                (bool sellerSuccess, ) = payable(seller).call{value: sellerShare + middleShare}("");
                require(sellerSuccess, "Payment to seller failed");
                
                (bool originalSuccess, ) = payable(originalCreator).call{value: originalShare}("");
                require(originalSuccess, "Payment to original creator failed");
                
            } else {
                // Multiple derivatives - distribute middle share
                uint256 middleCount = ancestors.length - 2;
                uint256 perMiddle = middleShare / middleCount;
                
                recipients = new address[](ancestors.length);
                amounts = new uint256[](ancestors.length);
                
                // Seller
                recipients[0] = seller;
                amounts[0] = sellerShare;
                (bool sellerSuccess, ) = payable(seller).call{value: sellerShare}("");
                require(sellerSuccess, "Payment to seller failed");
                
                // Middle ancestors
                for (uint256 i = 1; i < ancestors.length - 1; i++) {
                    recipients[i] = ancestors[i];
                    amounts[i] = perMiddle;
                    (bool middleSuccess, ) = payable(ancestors[i]).call{value: perMiddle}("");
                    require(middleSuccess, "Payment to middle ancestor failed");
                }
                
                // Original creator
                recipients[ancestors.length - 1] = originalCreator;
                amounts[ancestors.length - 1] = originalShare;
                (bool originalSuccess, ) = payable(originalCreator).call{value: originalShare}("");
                require(originalSuccess, "Payment to original creator failed");
            }
        }
        
        emit RoyaltyDistributed(
            tokenId,
            seller,
            totalAmount,
            recipients,
            amounts,
            block.timestamp
        );
    }

    /**
     * @dev Calculate royalty distribution for a token
     */
    function calculateRoyalties(uint256 tokenId, uint256 salePrice) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory amounts) 
    {
        uint256 workId = nftManager.getTokenWork(tokenId);
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 1) {
            recipients = new address[](1);
            amounts = new uint256[](1);
            recipients[0] = ancestors[0];
            amounts[0] = salePrice;
        } else {
            uint256 sellerShare = (salePrice * 7000) / BASIS_POINTS; // 70%
            uint256 originalShare = (salePrice * 2000) / BASIS_POINTS; // 20%
            uint256 middleShare = (salePrice * 1000) / BASIS_POINTS; // 10%
            
            if (ancestors.length == 2) {
                recipients = new address[](2);
                amounts = new uint256[](2);
                recipients[0] = ancestors[0]; // Current owner gets seller + middle share
                amounts[0] = sellerShare + middleShare;
                recipients[1] = ancestors[1]; // Original creator
                amounts[1] = originalShare;
            } else {
                recipients = new address[](ancestors.length);
                amounts = new uint256[](ancestors.length);
                
                uint256 middleCount = ancestors.length - 2;
                uint256 perMiddle = middleShare / middleCount;
                
                amounts[0] = sellerShare; // Seller
                for (uint256 i = 1; i < ancestors.length - 1; i++) {
                    amounts[i] = perMiddle; // Middle ancestors
                }
                amounts[ancestors.length - 1] = originalShare; // Original creator
                
                recipients = ancestors;
            }
        }
    }
}