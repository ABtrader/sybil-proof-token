// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MockEligibilityVerifier {
    mapping(address => bool) public permissions;

    // Helper function for our tests so we can toggle a user's ID status
    function setPermission(address account, bool status) external {
        permissions[account] = status;
    }

    // This mimics Redbelly's exact protocol function structure
    function hasChainPermission(address account) external view returns (bool) {
        return permissions[account];
    }
}