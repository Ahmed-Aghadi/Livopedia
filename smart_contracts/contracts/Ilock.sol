// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface ILock {
    // balanceOf
    function balanceOf(address account) external view returns (uint256);

    // isOwner
    function isOwner(address account) external view returns (bool);
}
