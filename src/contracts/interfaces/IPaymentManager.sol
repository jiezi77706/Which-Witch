// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPaymentManager {
    function processPayment(uint256 workId) external payable;
    function tipCreator(address creator) external payable;
    function distributeRevenue(
        uint256 workId,
        address directCreator,
        address[] memory ancestors
    ) external payable;
    function withdraw() external;
    function getBalance(address creator) external view returns (uint256);
    function getCreatorRevenue(address creator) external view returns (uint256);
}