import test from "node:test";
import assert from "node:assert";
import { network } from "hardhat"; // 👈 Hardhat 3 Official Spec: Import network object!

test("SybilProofToken Security Suite", async (t) => {

  // Natively provisions our isolated local simulation network environment
  const { ethers } = await network.create();

  // Helper context to deploy contracts to a fresh state
  const setupContext = async () => {
    const [owner, verifiedUser, unverifiedUser] = await ethers.getSigners();

    // 1. Deploy our Mock Identity Contract
    const MockFactory = await ethers.getContractFactory("MockEligibilityVerifier");
    const mockVerifier = await MockFactory.deploy();

    // 2. Clear the verified user, block the unverified bot
    await mockVerifier.setPermission(verifiedUser.address, true);
    await mockVerifier.setPermission(unverifiedUser.address, false);

    // 3. Deploy our SybilProofToken contract
    const TokenFactory = await ethers.getContractFactory("SybilProofToken");
    const token = await TokenFactory.deploy(
      "SybilProof Anti-Bot Token",
      "SPAB",
      await mockVerifier.getAddress()
    );

    return { token, mockVerifier, owner, verifiedUser, unverifiedUser };
  };

  await t.test("Should allow a verified wallet to mint tokens successfully", async () => {
    const { token, verifiedUser } = await setupContext();
    const mintAmount = ethers.parseEther("100");

    // Execute the mint
    await token.mint(verifiedUser.address, mintAmount);
    
    // Check if the balance matches perfectly
    const balance = await token.balanceOf(verifiedUser.address);
    assert.strictEqual(balance.toString(), mintAmount.toString());
  });

  await t.test("Should block an unverified wallet from minting", async () => {
    const { token, unverifiedUser } = await setupContext();
    const mintAmount = ethers.parseEther("100");

    // We expect this to fail (revert), so we catch the error and verify it stopped the bot
    await assert.rejects(
      async () => {
        await token.mint(unverifiedUser.address, mintAmount);
      },
      (err) => {
        // Confirms the blockchain threw our custom security error code!
        return err.message.includes("KYC_VerificationFailed");
      }
    );
  });

  await t.test("Should block transfers to an unverified wallet when the gate is active", async () => {
    const { token, verifiedUser, unverifiedUser } = await setupContext();
    const amount = ethers.parseEther("50");

    // Give tokens to our verified user first
    await token.mint(verifiedUser.address, amount);

    // Try to send it to a bot wallet -> Must reject
    await assert.rejects(
      async () => {
        await token.connect(verifiedUser).transfer(unverifiedUser.address, amount);
      },
      (err) => {
        return err.message.includes("KYC_VerificationFailed");
      }
    );
  });

  await t.test("Should successfully process transfers when transfer gate toggle is turned off by owner", async () => {
    const { token, verifiedUser, unverifiedUser } = await setupContext();
    const amount = ethers.parseEther("50");

    // Give tokens to our verified user first
    await token.mint(verifiedUser.address, amount);

    // Turn off the security gate for transfers
    await token.toggleTransferGate(false);

    // Transfer should now process flawlessly!
    await token.connect(verifiedUser).transfer(unverifiedUser.address, amount);
    
    const botBalance = await token.balanceOf(unverifiedUser.address);
    assert.strictEqual(botBalance.toString(), amount.toString());
  });
});