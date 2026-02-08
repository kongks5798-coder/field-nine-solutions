'use client';

/**
 * SOVEREIGN TRADE RECEIPT
 *
 * A premium receipt component for energy transactions
 * showing all compliance certifications and proofs.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SovereignReceiptProps {
  receipt: {
    // Transaction info
    receiptId: string;
    timestamp: string;
    transactionType: 'verify' | 'swap' | 'attest';

    // Energy details
    sourceNode: {
      nodeId: string;
      name: string;
      country: string;
      market: string;
    };
    targetNode?: {
      nodeId: string;
      name: string;
      country: string;
      market: string;
    };
    kwhAmount: number;
    nxusdValue: number;

    // Compliance certifications
    compliance: {
      re100: { status: string; certificationId: string };
      cbam: { status: string; carbonAdjustment: number };
      esg: { rating: string; score: number };
      ghgProtocol: { status: string; scope2Emissions: number };
      sbti: { validationStatus: string; targetType: string };
    };

    // Proofs
    proofs: {
      gridInjectionProof: string;
      watermarkId: string;
      attestationHash: string;
      certificationHash: string;
      polygonTxHash: string;
      polygonBlockNumber: number;
    };

    // Permanent storage
    permanentRecord: {
      ipfsHash: string;
      arweaveId: string;
    };

    // Costs
    fees: {
      royaltyPaid: number;
      swapFee?: number;
      gasFee: number;
    };
  };
  onClose?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function SovereignReceipt({ receipt, onClose, onDownload, onShare }: SovereignReceiptProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = (status: string) => {
    if (['compliant', 'exempt', 'validated', 'achieved', 'AAA', 'AA'].includes(status)) {
      return 'text-green-400';
    }
    if (['on-track', 'targets-set', 'verified', 'A', 'BBB'].includes(status)) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const getESGGradient = (rating: string) => {
    const gradients: Record<string, string> = {
      AAA: 'from-emerald-500 to-green-400',
      AA: 'from-green-500 to-emerald-400',
      A: 'from-lime-500 to-green-400',
      BBB: 'from-yellow-500 to-amber-400',
      BB: 'from-orange-500 to-amber-400',
      B: 'from-red-500 to-orange-400',
      CCC: 'from-red-600 to-red-500',
    };
    return gradients[rating] || 'from-gray-500 to-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 py-8 border-b border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />

          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Sovereign Trade Receipt</h2>
                  <p className="text-sm text-slate-400">Field Nine Energy Protocol</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1">Receipt ID</div>
              <div className="font-mono text-sm text-white">{receipt.receiptId}</div>
            </div>
          </div>

          {/* Transaction Type Badge */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              receipt.transactionType === 'verify' ? 'bg-blue-500/20 text-blue-400' :
              receipt.transactionType === 'swap' ? 'bg-purple-500/20 text-purple-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {receipt.transactionType}
            </span>
            <span className="text-sm text-slate-400">{receipt.timestamp}</span>
          </div>
        </div>

        {/* Energy Flow */}
        <div className="px-6 py-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between gap-4">
            {/* Source Node */}
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Source</div>
              <div className="font-semibold text-white">{receipt.sourceNode.name}</div>
              <div className="text-sm text-slate-400 mt-1">
                {receipt.sourceNode.country} • {receipt.sourceNode.market}
              </div>
              <div className="font-mono text-xs text-slate-500 mt-2">{receipt.sourceNode.nodeId}</div>
            </div>

            {/* Arrow */}
            {receipt.targetNode && (
              <>
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-xs text-slate-400 mt-1">{receipt.kwhAmount.toLocaleString()} kWh</div>
                </div>

                {/* Target Node */}
                <div className="flex-1 bg-slate-800/50 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">Target</div>
                  <div className="font-semibold text-white">{receipt.targetNode.name}</div>
                  <div className="text-sm text-slate-400 mt-1">
                    {receipt.targetNode.country} • {receipt.targetNode.market}
                  </div>
                  <div className="font-mono text-xs text-slate-500 mt-2">{receipt.targetNode.nodeId}</div>
                </div>
              </>
            )}

            {!receipt.targetNode && (
              <div className="flex-1 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-xs text-green-400 mb-1">Energy Amount</div>
                <div className="text-2xl font-bold text-white">{receipt.kwhAmount.toLocaleString()}</div>
                <div className="text-sm text-slate-400">kWh Verified</div>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mt-4 flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-lg">
            <span className="text-slate-400">Transaction Value</span>
            <span className="text-xl font-bold text-white">
              ${receipt.nxusdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NXUSD
            </span>
          </div>
        </div>

        {/* Compliance Certifications */}
        <div className="px-6 py-6 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Compliance Certifications
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* RE100 */}
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">RE100</span>
                <span className={`text-xs font-semibold ${getStatusColor(receipt.compliance.re100.status)}`}>
                  {receipt.compliance.re100.status.toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-xs text-slate-500 truncate">{receipt.compliance.re100.certificationId}</div>
            </div>

            {/* CBAM */}
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">CBAM</span>
                <span className={`text-xs font-semibold ${getStatusColor(receipt.compliance.cbam.status)}`}>
                  {receipt.compliance.cbam.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Carbon Adj: €{receipt.compliance.cbam.carbonAdjustment.toFixed(2)}
              </div>
            </div>

            {/* ESG */}
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">ESG Rating</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${getESGGradient(receipt.compliance.esg.rating)} text-white`}>
                  {receipt.compliance.esg.rating}
                </span>
              </div>
              <div className="text-xs text-slate-500">Score: {receipt.compliance.esg.score}/100</div>
            </div>

            {/* GHG Protocol */}
            <div className="bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">GHG Protocol</span>
                <span className={`text-xs font-semibold ${getStatusColor(receipt.compliance.ghgProtocol.status)}`}>
                  {receipt.compliance.ghgProtocol.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Scope 2: {receipt.compliance.ghgProtocol.scope2Emissions.toFixed(2)} kg CO₂
              </div>
            </div>

            {/* SBTi */}
            <div className="col-span-2 bg-slate-800/40 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Science Based Targets (SBTi)</span>
                  <div className="text-xs text-slate-500 mt-1">Target: {receipt.compliance.sbti.targetType}</div>
                </div>
                <span className={`text-xs font-semibold ${getStatusColor(receipt.compliance.sbti.validationStatus)}`}>
                  {receipt.compliance.sbti.validationStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proofs Section (Expandable) */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-sm text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verification Proofs & Permanent Records
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Watermark ID', value: receipt.proofs.watermarkId },
                    { label: 'Grid Injection Proof', value: receipt.proofs.gridInjectionProof },
                    { label: 'Attestation Hash', value: receipt.proofs.attestationHash },
                    { label: 'Certification Hash', value: receipt.proofs.certificationHash },
                    { label: 'Polygon TX Hash', value: receipt.proofs.polygonTxHash, link: `https://polygonscan.com/tx/${receipt.proofs.polygonTxHash}` },
                    { label: 'Block Number', value: receipt.proofs.polygonBlockNumber.toLocaleString() },
                    { label: 'IPFS Hash', value: receipt.permanentRecord.ipfsHash, link: `https://ipfs.io/ipfs/${receipt.permanentRecord.ipfsHash}` },
                    { label: 'Arweave ID', value: receipt.permanentRecord.arweaveId, link: `https://arweave.net/${receipt.permanentRecord.arweaveId}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded">
                      <span className="text-xs text-slate-400">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300 truncate max-w-[200px]">
                          {item.value}
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(item.value), item.label)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          {copiedField === item.label ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fees Summary */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">Transaction Fees</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Royalty</span>
              <span className="text-white">${receipt.fees.royaltyPaid.toFixed(4)} NXUSD</span>
            </div>
            {receipt.fees.swapFee && (
              <div className="flex justify-between">
                <span className="text-slate-400">Swap Fee (0.25%)</span>
                <span className="text-white">${receipt.fees.swapFee.toFixed(4)} NXUSD</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Gas Fee</span>
              <span className="text-white">${receipt.fees.gasFee.toFixed(4)} NXUSD</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700/50 font-semibold">
              <span className="text-slate-300">Total Fees</span>
              <span className="text-white">
                ${(receipt.fees.royaltyPaid + (receipt.fees.swapFee || 0) + receipt.fees.gasFee).toFixed(4)} NXUSD
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/50 text-center">
          <p className="text-xs text-slate-500">
            This receipt is cryptographically signed and permanently stored on-chain.
            <br />
            Verify at{' '}
            <a href="https://fieldnine.io/verify" className="text-purple-400 hover:underline">
              fieldnine.io/verify
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default SovereignReceipt;
