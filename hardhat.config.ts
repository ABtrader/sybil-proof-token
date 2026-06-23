import * as dotenv from "dotenv";
import * as ethersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import readlineSync from "readline-sync";

dotenv.config();

let DEPLOYER_KEY = process.env.REDBELLY_PRIVATE_KEY;

// If .env is empty and we are running the deploy script, prompt the terminal securely
if (!DEPLOYER_KEY && process.argv.includes("scripts/deploy.js")) {
  console.log("\n🔒 SECURITY PROTOCOL ACTIVE");
  DEPLOYER_KEY = readlineSync.question("🔑 Paste your AUTHORIZED main wallet private key (characters will be hidden): ", {
    hideEchoBack: true // This keeps your key completely invisible on screen while pasting
  });
  console.log("✅ Key loaded into temporary memory.\n");
}

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24"
  },
  networks: {
    hardhat: {
      type: "edr-simulated"
    },
    redbellyTestnet: {
      type: "http",
      url: "https://governors.testnet.redbelly.network",
      chainId: 153,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : []
    }
  },
  plugins: [
    ethersPlugin.default || ethersPlugin,
    hardhatNodeTestRunner
  ]
};

export default config;