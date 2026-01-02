import RIFDocumentUploader from './components/RIFDocumentUploader';
import contractABI from './contracts/abi.json';
import './index.css'; // Use the new global styles
import { FileText, ShieldCheck } from 'lucide-react';

// Replace with actual deployed contract address on Rootstock Testnet
// This is a placeholder address. In a real scenario, you would deploy the contract and put the address here.
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; 

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="app-container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldCheck size={48} className="text-blue-600" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Charity Audit Trail
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Secure, transparent, and immutable documentation for charitable donations using&nbsp;
            <span className="font-bold text-blue-600 inline-flex items-center gap-1">
              RIF Storage
            </span>
            &nbsp;and&nbsp;
            <span className="font-bold text-orange-500 inline-flex items-center gap-1">
              Rootstock
            </span>.
          </p>
        </header>
        
        <main className="flex flex-col items-center gap-8">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-center gap-2">
              <FileText className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Document Uploader</h2>
            </div>
            
            <div className="p-8">
              <RIFDocumentUploader 
                contractAddress={CONTRACT_ADDRESS}
                contractABI={contractABI}
              />
            </div>
          </div>

          <footer className="flex flex-col items-center gap-4 text-slate-400">
            <p className="text-sm font-medium uppercase tracking-wider">Powered By</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 font-bold text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                RIF Storage
              </span>
              <span className="flex items-center gap-2 font-bold text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                Rootstock
              </span>

            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
