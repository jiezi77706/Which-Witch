// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }

    function registerOriginalWork(
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId);

    function registerDerivativeWork(
        uint256 parentId,
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId);

    function getWork(uint256 workId) external view returns (Work memory);
    function getWorksByCreator(address creator) external view returns (uint256[] memory);
    function getDerivatives(uint256 parentId) external view returns (uint256[] memory);
    function getAncestorChain(uint256 workId) external view returns (address[] memory);
}