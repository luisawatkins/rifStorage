import RIFDocumentUploader from './components/RIFDocumentUploader';
import contractABI from './contracts/abi.json';
import './App.css';

// Replace with actual deployed contract address on Rootstock Testnet
// This is a placeholder address. In a real scenario, you would deploy the contract and put the address here.
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; 

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>Charity Audit Trail</h1>
        <p>Immutable donation receipts and reports on RIF Storage</p>
      </header>
      
      <main>
        <RIFDocumentUploader 
          contractAddress={CONTRACT_ADDRESS}
          contractABI={contractABI}
        />
      </main>
    </div>
  )
}

export default App
