import { network } from "hardhat";

async function main() {
  console.log("--------------------------------------------------");
  console.log("🛰️ Connecting to Redbelly Network Testnet...");
  
  const { ethers } = await network.create();
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying contracts with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account Balance: ${ethers.formatEther(balance)} RBNT`);
  console.log("--------------------------------------------------\n");

  const feeData = await ethers.provider.getFeeData();
  const networkMaxFee = feeData.maxFeePerGas || feeData.gasPrice;
  
  console.log(`⛽ Current Network Max Fee Cap: ${ethers.formatUnits(networkMaxFee, "gwei")} gwei`);

  // Pointing directly to your permanently live verifier from the previous run
  const verifierAddress = "0x110ffFAf769fC80B308A28Cf0c0bA9CDd1A199d2";
  console.log(`🔗 Linking existing MockEligibilityVerifier at: ${verifierAddress}\n`);

  // Maxed out to 3 Million gas to completely eliminate execution constraints.
  // This requires ~729 RBNT upfront cushion which your 754 RBNT covers perfectly.
  const tokenGasSettings = {
    gasLimit: 3000000, 
    maxFeePerGas: networkMaxFee,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.parseUnits("1.5", "gwei")
  };

  // Deploy SybilProofToken linked directly to your verified address
  console.log("🎬 Deploying SybilProofToken live...");
  const TokenFactory = await ethers.getContractFactory("SybilProofToken");
  
  const token = await TokenFactory.deploy(
    "SybilProof Anti-Bot Token",
    "SPAB",
    verifierAddress,
    tokenGasSettings
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ SybilProofToken successfully deployed to: ${tokenAddress}\n`);

  console.log("--------------------------------------------------");
  console.log("🎉 All contracts successfully deployed to Redbelly Testnet!");
  console.log(`Verifier Address: ${verifierAddress}`);
  console.log(`Token Address:    ${tokenAddress}`);
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});