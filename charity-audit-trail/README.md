# Build a Charity Audit Trail dApp with RIF Storage

This tutorial guides you through building a decentralized application (dApp) that leverages **RIF Storage** and **Rootstock** to create an immutable, transparent audit trail for charitable donations.

By the end of this guide, you will have a working React application that allows users to upload documents (like donation receipts), pin them to IPFS via RIF Storage providers, and record the proof on the Rootstock blockchain.

---

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **Metamask** browser extension
- **Rootstock Testnet RBTC** (for gas)
- Basic knowledge of React and Solidity

---

## 🚀 Step 1: Project Setup

First, we initialize a React project using Vite and install the necessary Web3 dependencies.

```bash
# Create the project
npm create vite@latest charity-audit-trail -- --template react-ts
cd charity-audit-trail

# Install dependencies
npm install ethers ipfs-http-client axios lucide-react

# Install styling engine (Tailwind CSS)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configure Tailwind CSS
Update `tailwind.config.js` to scan your source files:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add the directives to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🔗 Step 2: The Smart Contract

We need a smart contract to store the reference to our documents on-chain. This ensures that even if the file storage changes, the *record* of the document remains immutable.

**File:** `src/contracts/StorageManager.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CharityAuditStorage {
    struct StorageRecord {
        string ipfsCid;
        address provider;
        uint256 fileSize;
        uint256 timestamp;
        string category; // e.g., "receipt", "report"
    }

    StorageRecord[] public records;
    event RecordCreated(uint256 indexed id, string ipfsCid, string category);

    function createStorageRecord(
        string memory _ipfsCid,
        address _provider,
        uint256 _fileSize,
        uint256[] memory _billingPeriods,
        uint256[] memory _billingPrices,
        string memory _category
    ) public payable {
        // In a real RIF implementation, this would interact with the RIF StorageManager contract
        // to pay for pinning. Here we simulate the record keeping.
        
        records.push(StorageRecord({
            ipfsCid: _ipfsCid,
            provider: _provider,
            fileSize: _fileSize,
            timestamp: block.timestamp,
            category: _category
        }));

        emit RecordCreated(records.length - 1, _ipfsCid, _category);
    }
}
```

*Note: For this tutorial, you can deploy this contract to the Rootstock Testnet using Remix or Hardhat and save the address.*

---

## 🛠️ Step 3: RIF Storage Client Utility

To interact with RIF Storage (which sits on top of IPFS), we create a utility class. This handles finding storage providers and uploading files.

**File:** `src/utils/rifStorageClient.ts`

This client performs three main actions:
1.  **`getStorageOffers()`**: Fetches available storage providers from the RIF Marketplace.
2.  **`uploadToIPFS()`**: Uploads the raw file to an IPFS node.
3.  **`calculateStorageCost()`**: Estimates how much RBTC/RIF is needed to pin the file.

*(See the source code in `src/utils/rifStorageClient.ts` for the full implementation, including mock data fallbacks for development)*

---

## 💻 Step 4: Frontend Implementation

Now we build the user interface. We'll create a component that handles the file selection, cost estimation, and the actual upload process.

**File:** `src/components/RIFDocumentUploader.tsx`

Key features of this component:
-   **State Management**: Tracks the selected file, storage offers, and transaction status.
-   **Calculations**: Automatically updates the estimated cost when a file or provider is selected.
-   **Interaction**: Connects to Metamask using `ethers.js` to sign the transaction.

```typescript
// Core upload logic
const uploadWithRIFStorage = async () => {
    // 1. Upload to IPFS via our utility
    const ipfsCid = await rifStorage.uploadToIPFS(file);
    
    // 2. Connect to Wallet
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 3. Execute Smart Contract Transaction
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    const tx = await contract.createStorageRecord(
        ipfsCid,
        selectedOffer.provider,
        // ... params
    );
    await tx.wait();
};
```

---

## 🎨 Step 5: Connecting It All

Finally, we update `App.tsx` to host our uploader component and provide the contract configuration.

**File:** `src/App.tsx`

```tsx
import RIFDocumentUploader from './components/RIFDocumentUploader';

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 ...">
       {/* Header & Layout */}
       <RIFDocumentUploader 
         contractAddress={CONTRACT_ADDRESS}
         contractABI={contractABI}
       />
    </div>
  )
}
```

---

## ▶️ Running the Application

1.  **Start the development server**:
    ```bash
    npm run dev
    ```

2.  **Open in Browser**:
    Navigate to `http://localhost:5173`.

3.  **Test the Flow**:
    -   Connect your Metamask wallet (ensure you are on Rootstock Testnet).
    -   Select a file (PDF/Image).
    -   Choose a storage provider from the dropdown.
    -   Click **"Upload & Pay for Storage"**.
    -   Confirm the transaction in Metamask.
