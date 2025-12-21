# WhichWitch Smart Contracts

This directory contains the smart contracts for the WhichWitch platform, implementing a comprehensive on-chain creation tracking and revenue distribution system.

## Contract Architecture

### Core Contracts

1. **CreationManager.sol** - Central registry for original and derivative works
2. **PaymentManager.sol** - Handles payments, tips, and revenue distribution
3. **AuthorizationManager.sol** - Manages authorization requests for derivative creation
4. **NFTManager.sol** - ERC721 contract for work ownership NFTs
5. **NFTMarketplace.sol** - Marketplace for trading work NFTs with royalties
6. **RoyaltyManager.sol** - Unified royalty distribution logic
7. **ZetaPaymentManager.sol** - Cross-chain payment processor (ZetaChain)

### Interfaces

- **ICreationManager.sol** - Interface for creation management
- **IPaymentManager.sol** - Interface for payment operations
- **IAuthorizationManager.sol** - Interface for authorization management
- **INFTManager.sol** - Interface for NFT operations
- **IRoyaltyManager.sol** - Interface for royalty distribution

## Features

### 🔗 On-Chain Creation Tracking
- Register original works with metadata
- Create derivative works with parent-child relationships
- Build transparent creation genealogy
- Track authorization requirements

### 💰 Dual Revenue System

**NFT Sales (Instant Payout):**
- 70% to seller
- 20% to original creator
- 10% to middle ancestors (split)
- 2.5% platform fee

**Authorization Fees & Tips (Contract Storage):**
- 40% to direct creator
- 40% to original creator
- 20% to middle ancestors (split)
- 3.5% withdrawal fee

### 🎨 NFT Integration
- Mint ownership NFTs for works
- Trade NFTs with automatic royalty distribution
- Integrated marketplace with instant payments

### 🌐 Cross-Chain Support
- ZetaChain integration for cross-chain payments
- Support for multiple blockchain networks
- Unified payment experience

## Deployment

### Prerequisites

```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

### Deploy to Testnet

```bash
# Configure your .env file with:
# PRIVATE_KEY=your_private_key
# ALCHEMY_API_KEY=your_alchemy_key

# Deploy to Sepolia testnet
npx hardhat run src/contracts/deploy.js --network sepolia
```

### Environment Variables

After deployment, add these to your `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MANAGER=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_ROYALTY_MANAGER=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MARKETPLACE=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS_ZETA_PAYMENT=0x...
```

## Contract Interactions

### Register Original Work

```solidity
function registerOriginalWork(
    uint256 licenseFee,      // Fee for derivative creation
    bool derivativeAllowed,  // Whether derivatives are allowed
    string memory metadataURI // IPFS metadata URI
) external returns (uint256 workId)
```

### Request Authorization

```solidity
function requestAuthorization(uint256 workId) external payable
```

### Register Derivative Work

```solidity
function registerDerivativeWork(
    uint256 parentId,
    uint256 licenseFee,
    bool derivativeAllowed,
    string memory metadataURI
) external returns (uint256 workId)
```

### Mint NFT

```solidity
function mintWorkNFT(
    uint256 workId,
    string memory tokenURI
) external returns (uint256 tokenId)
```

### List NFT for Sale

```solidity
function listToken(
    uint256 tokenId,
    uint256 price
) external
```

## Revenue Distribution Logic

### Authorization Payments
When a user pays for authorization to create a derivative:

1. **Direct Creator**: 40% of payment
2. **Original Creator**: 40% of payment  
3. **Middle Ancestors**: 20% split among all middle creators
4. **Withdrawal Fee**: 3.5% deducted when withdrawing

### NFT Sales
When an NFT is sold on the marketplace:

1. **Seller**: 70% of sale price (instant)
2. **Original Creator**: 20% of sale price (instant)
3. **Middle Ancestors**: 10% split among middle creators (instant)
4. **Platform Fee**: 2.5% to platform (instant)

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions where appropriate
- **Input Validation**: Comprehensive parameter checking
- **Safe Transfers**: Uses OpenZeppelin's safe transfer patterns

## Testing

```bash
# Run contract tests
npx hardhat test

# Run with coverage
npx hardhat coverage
```

## Verification

After deployment, verify contracts on Etherscan:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor_arg1" "constructor_arg2"
```

## Gas Optimization

The contracts are optimized for gas efficiency:
- Packed structs where possible
- Efficient storage patterns
- Minimal external calls
- Batch operations support

## Upgradability

Current contracts are not upgradeable by design for security and decentralization. Future versions may implement proxy patterns if needed.

## License

MIT License - see LICENSE file for details.