import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RIFStorageClient, type StorageOffer, type StorageCost } from '../utils/rifStorageClient';

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
    try {
      // Step 1: Upload to IPFS first
      const ipfsCid = await rifStorage.uploadToIPFS(file);
      console.log('File uploaded to IPFS:', ipfsCid);
      
      // Step 2: Create storage agreement on Rootstock via smart contract
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
      const tx = await contract.createStorageRecord(
        ipfsCid,
        selectedOffer.provider,
        file.size,
        billingPeriods,
        billingPrices,
        metadata.category,
        { value: totalPayment }
      );
      
      const receipt = await tx.wait();
      console.log('Storage record created:', receipt);
      
      // Extract record ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          // @ts-ignore
          return contract.interface.parseLog(log)?.name === 'StorageRecordCreated';
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        // @ts-ignore
        const parsedEvent = contract.interface.parseLog(event);
        alert(`Document stored successfully!\nIPFS: ${ipfsCid}\nRecord ID: ${parsedEvent?.args.recordId}\nAgreement ID: ${parsedEvent?.args.agreementId}`);
      } else {
        alert(`Document stored successfully! IPFS: ${ipfsCid}`);
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rif-uploader">
      <h2>Upload to RIF Storage</h2>
      
      <div className="form-group">
        <label>Document Title</label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
        />
      </div>
      
      <div className="form-group">
        <label>Category</label>
        <select
          value={metadata.category}
          onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
        >
          <option value="donation_receipt">Donation Receipt</option>
          <option value="project_report">Project Report</option>
          <option value="impact_assessment">Impact Assessment</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>File</label>
        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
      </div>
      
      {storageOffers.length > 0 && (
        <div className="form-group">
          <label>Storage Provider</label>
          <select
            value={selectedOffer?.provider}
            onChange={(e) => {
              const offer = storageOffers.find(o => o.provider === e.target.value);
              setSelectedOffer(offer || null);
            }}
          >
            {storageOffers.map(offer => (
              <option key={offer.provider} value={offer.provider}>
                Provider {offer.provider.slice(0, 8)}... 
                ({(offer.availableCapacity / 1024).toFixed(2)} GB available @ 
                {offer.avgBillingPrice.toFixed(6)} RBTC/GB/month)
              </option>
            ))}
          </select>
        </div>
      )}
      
      {estimatedCost && file && (
        <div className="cost-estimate">
          <h3>Storage Cost Estimate</h3>
          <p>File Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p>Monthly Cost: {estimatedCost.monthlyCostRBTC.toFixed(6)} RBTC</p>
          <p>Total Payment: {estimatedCost.totalCostRBTC.toFixed(6)} RBTC</p>
          <p className="note">This payment goes to the storage provider for pinning your file</p>
        </div>
      )}
      
      <button 
        onClick={uploadWithRIFStorage} 
        disabled={!file || !selectedOffer || uploading}
      >
        {uploading ? 'Uploading to RIF Storage...' : 'Upload & Pay for Storage'}
      </button>
      
      {storageOffers.length === 0 && (
        <p className="warning">No storage providers available. Please try again later.</p>
      )}
    </div>
  );
}
