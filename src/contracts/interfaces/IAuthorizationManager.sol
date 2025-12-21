// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAuthorizationManager {
    function requestAuthorization(uint256 workId) external payable;
    function hasAuthorization(address user, uint256 workId) external view returns (bool);
    function getAuthorizationTimestamp(address user, uint256 workId) external view returns (uint256);
}