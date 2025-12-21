// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface INFTManager {
    function mintWorkNFT(uint256 workId, string memory tokenURI) external returns (uint256 tokenId);
    function getWorkTokenId(uint256 workId) external view returns (uint256);
    function getTokenWork(uint256 tokenId) external view returns (uint256);
    function isWorkNFTMinted(uint256 workId) external view returns (bool);
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}