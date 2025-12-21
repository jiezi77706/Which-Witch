const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying WhichWitch Smart Contracts...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const balance = await deployer.getBalance();
  console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');
  
  // Platform wallet address (replace with actual address)
  const platformWallet = deployer.address; // Use deployer as platform wallet for now
  
  // Deploy contracts in dependency order
  console.log('\n1. Deploying CreationManager...');
  const CreationManager = await ethers.getContractFactory('CreationManager');
  const creationManager = await CreationManager.deploy(
    ethers.constants.AddressZero, // Will be updated after AuthorizationManager deployment
    ethers.constants.AddressZero  // Will be updated after PaymentManager deployment
  );
  await creationManager.deployed();
  console.log('CreationManager deployed to:', creationManager.address);
  
  console.log('\n2. Deploying PaymentManager...');
  const PaymentManager = await ethers.getContractFactory('PaymentManager');
  const paymentManager = await PaymentManager.deploy(
    creationManager.address,
    ethers.constants.AddressZero, // Will be updated after AuthorizationManager deployment
    platformWallet
  );
  await paymentManager.deployed();
  console.log('PaymentManager deployed to:', paymentManager.address);
  
  console.log('\n3. Deploying AuthorizationManager...');
  const AuthorizationManager = await ethers.getContractFactory('AuthorizationManager');
  const authorizationManager = await AuthorizationManager.deploy(
    creationManager.address,
    paymentManager.address
  );
  await authorizationManager.deployed();
  console.log('AuthorizationManager deployed to:', authorizationManager.address);
  
  console.log('\n4. Deploying NFTManager...');
  const NFTManager = await ethers.getContractFactory('NFTManager');
  const nftManager = await NFTManager.deploy(
    creationManager.address,
    deployer.address // Initial owner
  );
  await nftManager.deployed();
  console.log('NFTManager deployed to:', nftManager.address);
  
  console.log('\n5. Deploying RoyaltyManager...');
  const RoyaltyManager = await ethers.getContractFactory('RoyaltyManager');
  const royaltyManager = await RoyaltyManager.deploy(
    creationManager.address,
    nftManager.address
  );
  await royaltyManager.deployed();
  console.log('RoyaltyManager deployed to:', royaltyManager.address);
  
  console.log('\n6. Deploying NFTMarketplace...');
  const NFTMarketplace = await ethers.getContractFactory('NFTMarketplace');
  const nftMarketplace = await NFTMarketplace.deploy(
    nftManager.address,
    creationManager.address,
    royaltyManager.address,
    platformWallet
  );
  await nftMarketplace.deployed();
  console.log('NFTMarketplace deployed to:', nftMarketplace.address);
  
  // Update CreationManager with correct addresses
  console.log('\n7. Updating CreationManager references...');
  // Note: This would require setter functions in the actual contract
  // For now, redeploy with correct addresses
  
  console.log('\n8. Deploying ZetaPaymentManager (for cross-chain support)...');
  // Note: This requires ZetaChain testnet deployment
  console.log('ZetaPaymentManager should be deployed on ZetaChain testnet separately');
  
  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      CreationManager: creationManager.address,
      PaymentManager: paymentManager.address,
      AuthorizationManager: authorizationManager.address,
      NFTManager: nftManager.address,
      RoyaltyManager: royaltyManager.address,
      NFTMarketplace: nftMarketplace.address,
    },
    timestamp: new Date().toISOString(),
  };
  
  console.log('\n=== DEPLOYMENT COMPLETE ===');
  console.log('Deployment Info:', JSON.stringify(deploymentInfo, null, 2));
  
  console.log('\n=== ENVIRONMENT VARIABLES ===');
  console.log('Add these to your .env.local file:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=${creationManager.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=${paymentManager.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=${authorizationManager.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MANAGER=${nftManager.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_ROYALTY_MANAGER=${royaltyManager.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MARKETPLACE=${nftMarketplace.address}`);
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });