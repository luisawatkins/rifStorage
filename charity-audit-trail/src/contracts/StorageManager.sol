// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for RIF Storage Contract (simplified version)
interface IRIFStorage {
    function newAgreement(
        bytes32 dataReference,
        address provider,
        uint256 size,
        uint256[] calldata billingPeriods,
        uint256[] calldata billingPrices,
        address token
    ) external payable returns (bytes32);
}

contract CharityAuditStorage {
    // RIF Storage contract address (Testnet)
    address public constant RIF_STORAGE_CONTRACT = 0x19f64632851944a98980F95146c2438510e40854; // Sample Testnet address (Should be verified)
    
    struct StorageRecord {
        bytes32 ipfsHash;        // IPFS CID converted to bytes32
        bytes32 agreementId;     // RIF Storage Agreement ID
        address uploader;
        uint256 timestamp;
        string category;
        uint256 fileSize;
        bool isPinned;
    }
    
    mapping(bytes32 => StorageRecord) public records;
    bytes32[] public recordIds;
    
    event StorageRecordCreated(
        bytes32 indexed recordId,
        bytes32 ipfsHash,
        bytes32 agreementId,
        address indexed uploader,
        string category
    );
    
    // Create storage record with RIF Storage agreement
    function createStorageRecord(
        string memory ipfsCid,
        address provider,
        uint256 fileSize,
        uint256[] memory billingPeriods,
        uint256[] memory billingPrices,
        string memory category
    ) external payable returns (bytes32) {
        // Convert IPFS CID string to bytes32
        bytes32 ipfsHash = stringToBytes32(ipfsCid);
        
        // Create RIF Storage agreement
        bytes32 agreementId = IRIFStorage(RIF_STORAGE_CONTRACT).newAgreement{value: msg.value}(
            ipfsHash,
            provider,
            fileSize,
            billingPeriods,
            billingPrices,
            address(0) // 0x0 for RBTC payment
        );
        
        bytes32 recordId = keccak256(
            abi.encodePacked(ipfsHash, msg.sender, block.timestamp)
        );
        
        records[recordId] = StorageRecord({
            ipfsHash: ipfsHash,
            agreementId: agreementId,
            uploader: msg.sender,
            timestamp: block.timestamp,
            category: category,
            fileSize: fileSize,
            isPinned: true
        });
        
        recordIds.push(recordId);
        
        emit StorageRecordCreated(
            recordId,
            ipfsHash,
            agreementId,
            msg.sender,
            category
        );
        
        return recordId;
    }
    
    function getRecord(bytes32 recordId) external view returns (StorageRecord memory) {
        require(records[recordId].uploader != address(0), "Record does not exist");
        return records[recordId];
    }
    
    function getAllRecordIds() external view returns (bytes32[] memory) {
        return recordIds;
    }
    
    // Helper function to convert IPFS CID to bytes32
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }
}
