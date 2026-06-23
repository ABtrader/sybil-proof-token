// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for Redbelly's Protocol-Level Eligibility SDK Verifier.
 * This tells our contract how to talk to Redbelly's on-chain security system.
 */
interface IRedbellyEligibilityVerifier {
    function hasChainPermission(address account) external view returns (bool);
}

/**
 * @title SybilProofToken
 * @dev An Anti-Bot, KYC-gated ERC-20 standard built for the Redbelly Network.
 */
contract SybilProofToken is ERC20, Ownable {
    
    IRedbellyEligibilityVerifier public eligibilityVerifier;
    bool public transferGateActive;

    // Custom KYC-Specific Errors (Super gas efficient and descriptive!)
    error KYC_VerificationFailed(address account, string reason);
    error KYC_InvalidVerifierAddress();

    // Events to track changes on-chain
    event EligibilityVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event TransferGateToggled(bool indexed isActive);

    /**
     * @param name Name of your new token
     * @param symbol Symbol of your new token
     * @param _eligibilityVerifier Address of Redbelly's identity verification contract
     */
    constructor(
        string memory name, 
        string memory symbol, 
        address _eligibilityVerifier
    ) ERC20(name, symbol) Ownable(msg.sender) {
        if (_eligibilityVerifier == address(0)) revert KYC_InvalidVerifierAddress();
        eligibilityVerifier = IRedbellyEligibilityVerifier(_eligibilityVerifier);
        transferGateActive = true; // Enabled by default to block bots immediately!
    }

    /**
     * @notice Secure minting function gated strictly by identity verification.
     * @dev Non-bypassable: Even the owner cannot mint tokens for an unverified address.
     */
    function mint(address to, uint256 amount) external {
        if (!eligibilityVerifier.hasChainPermission(to)) {
            revert KYC_VerificationFailed(to, "Destination address lacks a valid on-chain KYC credential");
        }
        _mint(to, amount);
    }

    /**
     * @notice Admin function allowing updating the verification contract address.
     */
    function updateEligibilityVerifier(address _newVerifier) external onlyOwner {
        if (_newVerifier == address(0)) revert KYC_InvalidVerifierAddress();
        address oldVerifier = address(eligibilityVerifier);
        eligibilityVerifier = IRedbellyEligibilityVerifier(_newVerifier);
        emit EligibilityVerifierUpdated(oldVerifier, _newVerifier);
    }

    /**
     * @notice Flips the transfer restriction between gated and fully open states.
     */
    function toggleTransferGate(bool _isActive) external onlyOwner {
        transferGateActive = _isActive;
        emit TransferGateToggled(_isActive);
    }

    /**
     * @dev Hook that intercepts ALL transfers to enforce identity criteria if the gate is active.
     */
    function _update(
        address from, 
        address to, 
        uint256 value
    ) internal override {
        // Enforce compliance rules only on active wallet-to-wallet transfers
        if (transferGateActive && from != address(0) && to != address(0)) {
            if (!eligibilityVerifier.hasChainPermission(from)) {
                revert KYC_VerificationFailed(from, "Sender lacks a valid on-chain KYC credential");
            }
            if (!eligibilityVerifier.hasChainPermission(to)) {
                revert KYC_VerificationFailed(to, "Recipient lacks a valid on-chain KYC credential");
            }
        }
        super._update(from, to, value);
    }
}