// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICreationManager.sol";

/**
 * @title NFTManager
 * @dev ERC721 contract for minting work ownership NFTs
 */
contract NFTManager is ERC721, ERC721URIStorage, Ownable {
    mapping(uint256 => uint256) public workToToken; // workId => tokenId
    mapping(uint256 => uint256) public tokenToWork; // tokenId => workId
    mapping(uint256 => bool) public workNFTMinted; // workId => minted status
    
    uint256 private _nextTokenId = 1;
    ICreationManager public creationManager;

    event WorkNFTMinted(
        uint256 indexed workId,
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        uint256 timestamp
    );

    constructor(
        address _creationManager,
        address initialOwner
    ) ERC721("WhichWitch Work NFT", "WWNFT") Ownable(initialOwner) {
        creationManager = ICreationManager(_creationManager);
    }

    /**
     * @dev Mint NFT for a work
     */
    function mintWorkNFT(uint256 workId, string memory tokenURI) external returns (uint256 tokenId) {
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        require(work.creator == msg.sender, "Only work creator can mint NFT");
        require(!workNFTMinted[workId], "NFT already minted for this work");
        
        tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        workToToken[workId] = tokenId;
        tokenToWork[tokenId] = workId;
        workNFTMinted[workId] = true;
        
        emit WorkNFTMinted(workId, tokenId, msg.sender, tokenURI, block.timestamp);
    }

    /**
     * @dev Get token ID for a work
     */
    function getWorkTokenId(uint256 workId) external view returns (uint256) {
        require(workNFTMinted[workId], "NFT not minted for this work");
        return workToToken[workId];
    }

    /**
     * @dev Get work ID for a token
     */
    function getTokenWork(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenToWork[tokenId];
    }

    /**
     * @dev Check if NFT is minted for a work
     */
    function isWorkNFTMinted(uint256 workId) external view returns (bool) {
        return workNFTMinted[workId];
    }

    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}