import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RIFStorageClient, type StorageOffer, type StorageCost } from '../utils/rifStorageClient';
import { Upload, HardDrive, Calculator, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface RIFDocumentUploaderProps {
    contractAddress: string;
    contractABI: any;
}

// Add window.ethereum type
declare global {
    interface Window {
        ethereum: any;
    }
}

export default function RIFDocumentUploader({ contractAddress, contractABI }: RIFDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [storageOffers, setStorageOffers] = useState<StorageOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<StorageOffer | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<StorageCost | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    category: 'donation_receipt',
    description: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  // Using testnet by default
  const rifStorage = new RIFStorageClient('testnet');

  useEffect(() => {
    loadStorageOffers();
  }, []);

  useEffect(() => {
    if (file && selectedOffer) {
      calculateCost();
    }
  }, [file, selectedOffer]);

  const loadStorageOffers = async () => {
    try {
      const offers = await rifStorage.getStorageOffers();
      const activeOffers = offers.filter(o => o.availableCapacity > 0);
      setStorageOffers(activeOffers);
      if (activeOffers.length > 0) {
        setSelectedOffer(activeOffers[0]);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
      setStatusMessage('Failed to load storage providers. Using mock data.');
      setStatusType('error');
    }
  };

  const calculateCost = async () => {
    if (!file) return;
    
    try {
      const cost = await rifStorage.calculateStorageCost(file.size, 1);
      setEstimatedCost(cost);
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  const uploadWithRIFStorage = async () => {
    if (!file || !selectedOffer || !estimatedCost) return;
    
    setUploading(true);
    setStatusMessage('Starting upload process...');
    setStatusType('info');

    try {
      // Step 1: Upload to IPFS first
      setStatusMessage('Uploading to IPFS...');
      const ipfsCid = await rifStorage.uploadToIPFS(file);
      console.log('File uploaded to IPFS:', ipfsCid);
      
      // Step 2: Create storage agreement on Rootstock via smart contract
      setStatusMessage('Waiting for wallet confirmation...');
      if (!window.ethereum) throw new Error("Metamask not found");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Prepare billing parameters
      const billingPeriods = [estimatedCost.period];
      const billingPrices = [ethers.parseEther(estimatedCost.monthlyCostRBTC.toFixed(18))]; // Ensure fixed decimals
      const totalPayment = ethers.parseEther(estimatedCost.totalCostRBTC.toFixed(18));
      
      // Call contract to create storage record with RIF Storage agreement
      setStatusMessage('Executing smart contract transaction...');
      const tx = await contract.createStorageRecord(
        ipfsCid,
        selectedOffer.provider,
        file.size,
        billingPeriods,
        billingPrices,
        metadata.category,
        { value: totalPayment }
      );
      
      setStatusMessage('Transaction submitted! Waiting for confirmation...');
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed:', receipt);
      setStatusMessage(`Success! Document stored securely. Hash: ${ipfsCid}`);
      setStatusType('success');
      setUploading(false);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setStatusMessage(`Error: ${error.message || 'Unknown error occurred'}`);
      setStatusType('error');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMetadata({ ...metadata, title: e.target.files[0].name });
    }
  };

  return (
    <div className="space-y-6">
      {/* File Selection Area */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-slate-50">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload size={40} className="text-slate-400 mb-2" />
          <span className="text-lg font-medium text-slate-700">
            {file ? file.name : "Click to select a document"}
          </span>
          <span className="text-sm text-slate-500">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "PDF, JPG, PNG, or JSON"}
          </span>
        </label>
      </div>

      {/* Form Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="form-group">
          <label className="text-sm font-medium text-slate-700 mb-1 block">Category</label>
          <select 
            value={metadata.category}
            onChange={(e) => setMetadata({...metadata, category: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          >
            <option value="donation_receipt">Donation Receipt</option>
            <option value="project_report">Project Report</option>
            <option value="impact_assessment">Impact Assessment</option>
            <option value="financial_audit">Financial Audit</option>
          </select>
        </div>

        <div className="form-group">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Storage Provider</label>
            <div className="relative">
                <select 
                    onChange={(e) => {
                        const offer = storageOffers.find(o => o.provider === e.target.value);
                        setSelectedOffer(offer || null);
                    }}
                    className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    disabled={uploading || storageOffers.length === 0}
                >
                    {storageOffers.map((offer, index) => (
                        <option key={index} value={offer.provider}>
                            {offer.provider.substring(0, 10)}... - {offer.availableCapacity / 1024 / 1024 / 1024} GB Avail
                        </option>
                    ))}
                    {storageOffers.length === 0 && <option>Loading providers...</option>}
                </select>
                <HardDrive size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
        </div>
      </div>

      {/* Cost Estimate Card */}
      {file && estimatedCost && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={20} className="text-blue-600" />
            <h3 className="font-semibold text-blue-900">Estimated Storage Cost</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-blue-800">
              <span>File Size:</span>
              <span className="font-medium">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <div className="flex justify-between text-blue-800">
              <span>Duration:</span>
              <span className="font-medium">30 Days</span>
            </div>
            <div className="flex justify-between text-blue-800 pt-2 border-t border-blue-200">
              <span>Total (RBTC):</span>
              <span className="font-bold">{estimatedCost.totalCostRBTC.toFixed(8)} RBTC</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3 italic">
            * Includes RIF Marketplace fees and estimated network gas.
          </p>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
            statusType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            statusType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            'bg-slate-100 text-slate-800 border border-slate-200'
        }`}>
            {statusType === 'error' && <AlertCircle className="shrink-0 mt-0.5" size={18} />}
            {statusType === 'success' && <CheckCircle className="shrink-0 mt-0.5" size={18} />}
            {statusType === 'info' && <Loader2 className="shrink-0 mt-0.5 animate-spin" size={18} />}
            <span className="text-sm">{statusMessage}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={uploadWithRIFStorage}
        disabled={!file || !selectedOffer || uploading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
            ${!file || !selectedOffer || uploading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
            }`}
      >
        {uploading ? (
            <>
                <Loader2 className="animate-spin" size={20} />
                Processing Storage Agreement...
            </>
        ) : (
            <>
                <Upload size={20} />
                Upload & Pay for Storage
            </>
        )}
      </button>
    </div>
  );
}
