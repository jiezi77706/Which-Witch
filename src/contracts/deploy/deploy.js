// Hardhat部署脚本示例
// 使用方法: npx hardhat run scripts/deploy.js --network base-sepolia

const hre = require("hardhat");

async function main() {
  console.log("开始部署 WhichWitch v2.0 合约系统...");

  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 配置参数
  const config = {
    platformWallet: deployer.address, // 在生产环境中应该使用多签钱包
    nftCollection: {
      name: "WhichWitch Creation NFT",
      symbol: "WWCNFT"
    }
  };

  console.log("\n=== 第一步：部署基础合约 ===");

  // 1. 部署 PaymentManager
  console.log("部署 PaymentManager...");
  const PaymentManager = await hre.ethers.getContractFactory("PaymentManager");
  const paymentManager = await PaymentManager.deploy(config.platformWallet);
  await paymentManager.waitForDeployment();
  console.log("PaymentManager 部署到:", await paymentManager.getAddress());

  // 2. 部署 CreationManager
  console.log("部署 CreationManager...");
  const CreationManager = await hre.ethers.getContractFactory("CreationManager");
  const creationManager = await CreationManager.deploy(await paymentManager.getAddress());
  await creationManager.waitForDeployment();
  console.log("CreationManager 部署到:", await creationManager.getAddress());

  // 3. 部署 AuthorizationManager
  console.log("部署 AuthorizationManager...");
  const AuthorizationManager = await hre.ethers.getContractFactory("AuthorizationManager");
  const authorizationManager = await AuthorizationManager.deploy(
    await creationManager.getAddress(),
    await paymentManager.getAddress()
  );
  await authorizationManager.waitForDeployment();
  console.log("AuthorizationManager 部署到:", await authorizationManager.getAddress());

  console.log("\n=== 第二步：部署NFT相关合约 ===");

  // 4. 部署 NFTManager
  console.log("部署 NFTManager...");
  const NFTManager = await hre.ethers.getContractFactory("NFTManager");
  const nftManager = await NFTManager.deploy(
    config.nftCollection.name,
    config.nftCollection.symbol
  );
  await nftManager.waitForDeployment();
  console.log("NFTManager 部署到:", await nftManager.getAddress());

  // 5. 部署 RoyaltyManager
  console.log("部署 RoyaltyManager...");
  const RoyaltyManager = await hre.ethers.getContractFactory("RoyaltyManager");
  const royaltyManager = await RoyaltyManager.deploy(
    await creationManager.getAddress(),
    config.platformWallet
  );
  await royaltyManager.waitForDeployment();
  console.log("RoyaltyManager 部署到:", await royaltyManager.getAddress());

  // 6. 部署 NFTMarketplace
  console.log("部署 NFTMarketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy(
    await nftManager.getAddress(),
    await royaltyManager.getAddress(),
    config.platformWallet
  );
  await nftMarketplace.waitForDeployment();
  console.log("NFTMarketplace 部署到:", await nftMarketplace.getAddress());

  console.log("\n=== 第三步：配置合约关系 ===");

  // 配置 CreationManager
  console.log("配置 CreationManager...");
  await creationManager.setAuthorizationManager(await authorizationManager.getAddress());
  await creationManager.setNFTManager(await nftManager.getAddress());

  // 配置 PaymentManager
  console.log("配置 PaymentManager...");
  await paymentManager.setAuthorizationManager(await authorizationManager.getAddress());
  await paymentManager.setRoyaltyManager(await royaltyManager.getAddress());

  // 配置 NFTManager
  console.log("配置 NFTManager...");
  await nftManager.setCreationManager(await creationManager.getAddress());
  await nftManager.setRoyaltyManager(await royaltyManager.getAddress());

  // 配置 RoyaltyManager
  console.log("配置 RoyaltyManager...");
  await royaltyManager.setPaymentManager(await paymentManager.getAddress());

  console.log("\n=== 部署完成 ===");
  console.log("合约地址汇总:");
  console.log("CreationManager:", await creationManager.getAddress());
  console.log("PaymentManager:", await paymentManager.getAddress());
  console.log("AuthorizationManager:", await authorizationManager.getAddress());
  console.log("NFTManager:", await nftManager.getAddress());
  console.log("RoyaltyManager:", await royaltyManager.getAddress());
  console.log("NFTMarketplace:", await nftMarketplace.getAddress());

  console.log("\n=== 环境变量配置 ===");
  console.log("请将以下地址添加到 .env.local 文件:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=${await creationManager.getAddress()}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=${await paymentManager.getAddress()}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=${await authorizationManager.getAddress()}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MANAGER=${await nftManager.getAddress()}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_ROYALTY_MANAGER=${await royaltyManager.getAddress()}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS_NFT_MARKETPLACE=${await nftMarketplace.getAddress()}`);

  console.log("\n部署成功! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });