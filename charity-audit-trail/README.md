# Charity Audit Trail dApp with RIF Storage

This project demonstrates how to use RIF Storage to create an immutable, transparent audit trail for charitable organizations.

## Features

- **RIF Storage Integration**: Uses RIF Marketplace to find storage providers and pay for pinning services.
- **Smart Contract Audit**: Stores document references (IPFS CIDs) and agreement IDs on the Rootstock blockchain.
- **Transparent Verification**: Allows anyone to verify the existence and integrity of donation receipts and reports.

## Prerequisites

- Node.js (v16+)
- Metamask wallet extension
- Testnet RBTC and RIF tokens (for RIF Storage payment)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. **Deploy Smart Contract**:
   - Deploy `src/contracts/StorageManager.sol` to Rootstock Testnet (e.g., using Remix or Hardhat).
   - Copy the deployed contract address.

2. **Update Frontend**:
   - Open `src/App.tsx`.
   - Replace `CONTRACT_ADDRESS` with your deployed contract address.

## Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How it Works

1. **Select File**: Choose a donation receipt or report to upload.
2. **Find Provider**: The app queries RIF Marketplace for available storage providers.
3. **Upload**: 
   - The file is uploaded to IPFS.
   - A storage agreement is created via the Smart Contract.
   - Payment is made in RBTC/RIF to the provider.
4. **Pinning**: The selected provider pins the content, ensuring long-term persistence.
