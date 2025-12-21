// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IRoyaltyManager {
    function distributeNFTSaleRevenue(
        uint256 tokenId,
        address seller,
        uint256 totalAmount
    ) external payable;

    function calculateRoyalties(uint256 tokenId, uint256 salePrice) 
        external 
        view 
        returns (address[] memory recipients, uint256[] memory amounts);
}