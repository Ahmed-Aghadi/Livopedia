// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@tableland/evm/contracts/ITablelandTables.sol";
import "./Ilock.sol";

contract Main {
    uint256 private _tableId;
    string private _tableName;
    string private _prefix = "main";
    // Interface to the `TablelandTables` registry contract
    ITablelandTables private _tableland;

    constructor(address registry) {
        _tableland = ITablelandTables(registry);
        _tableId = _tableland.createTable(
            address(this),
            /*
             *  CREATE TABLE {prefix}_{chainId} (
             *    id integer primary key,
             *    message text
             *  );
             */
            string.concat(
                "CREATE TABLE ",
                _prefix,
                "_",
                Strings.toString(block.chainid),
                " (id integer primary key, lockAddress text NOT NULL, profileId text NOT NULL, userAddress text NOT NULL, cid text NOT NULL);"
            )
        );

        _tableName = string.concat(
            _prefix,
            "_",
            Strings.toString(block.chainid),
            "_",
            Strings.toString(_tableId)
        );
    }

    function registerLock(address lockAddress, string memory profileId, string memory cid) public {
        require(_tableId != 0, "Table not created!");
        ILock lock = ILock(lockAddress);
        require(lock.isOwner(msg.sender), "Not owner!");
        _tableland.runSQL(
            address(this),
            _tableId,
            string.concat(
                "INSERT INTO ",
                _tableName,
                " (lockAddress, profileId, userAddress, cid) VALUES (",
                "'",
                _addressToString(lockAddress),
                "','",
                profileId,
                "','",
                _addressToString(msg.sender),
                "','",
                cid,
                "');"
            )
        );
    }

    function _addressToString(address x) public pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string.concat("0x", string(s));
    }

    function char(bytes1 b) public pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function getTableName() public view returns (string memory) {
        return _tableName;
    }

    function getTableId() public view returns (uint256) {
        return _tableId;
    }
}
