/**
 * K-UNIVERSAL Passport Upload Component
 * Apple Wallet-style minimalist design
 */

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PassportScanner, type OCRResult } from '@/lib/ocr/passport-scanner';

interface PassportUploadProps {
  onSuccess: (data: OCRResult) => void;
  onError: (error: string) => void;
}

export function PassportUpload({ onSuccess, onError }: PassportUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process OCR
    setIsProcessing(true);
    setProgress(0);

    try {
      const scanner = new PassportScanner();
      await scanner.initialize();

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await scanner.scanPassport(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      await scanner.terminate();

      if (result.success) {
        onSuccess(result);
      } else {
        onError(result.error || 'OCR processing failed');
        setPreview(null);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Processing failed');
      setPreview(null);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Upload Area */}
      <motion.div
        className={`
          relative overflow-hidden rounded-2xl bg-white border-2 transition-all
          ${isDragging ? 'border-[#0066FF] bg-blue-50' : 'border-gray-200'}
          ${isProcessing ? 'pointer-events-none' : 'cursor-pointer hover:border-gray-300'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img
                src={preview}
                alt="Passport preview"
                className="w-full h-64 object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    🔍
                  </motion.div>
                  <p className="text-white font-semibold mb-2">Scanning Document...</p>
                  <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-white/80 text-sm mt-2">{progress}%</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center"
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🛂
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Passport Photo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Take a clear photo of your passport's data page
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-[#0066FF] font-medium">
                <span>📸</span>
                <span>Click or drag to upload</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
      >
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span>📋</span>
          <span>Requirements</span>
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Clear, well-lit photo of passport data page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>All text must be readable (no glare or shadows)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Valid passport (not expired)</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
