import hre from "hardhat";
import { fork } from "node:child_process";

async function main() {
  // Hardhat 3 dynamic extension lookup to safely fetch the ethers provider
  const ethersProvider = hre.ethers || hre.extensions?.ethers;
  
  if (!ethersProvider) {
    throw new Error("❌ Hardhat Ethers plugin could not be resolved in the current runtime context.");
  }

  // Wake up the local blockchain simulation
  await ethersProvider.getSigners();
  
  console.log("🚀 Hardhat Environment Initialized. Launching Security Suite...\n");

  // Spawns Node's native test runner to execute our file safely
  const testProcess = fork("test/token.test.js", {
    execArgv: ["--test"]
  });

  testProcess.on("exit", (code) => {
    process.exit(code);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});