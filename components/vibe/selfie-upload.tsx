/**
 * VIBE-ID Selfie Upload Component
 * Tesla 스타일 드래그 앤 드롭 이미지 업로드
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';

interface SelfieUploadProps {
  onUpload: (file: File) => void;
  isDisabled?: boolean;
}

export function SelfieUpload({ onUpload, isDisabled = false }: SelfieUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      setIsDragging(true);
    }
  }, [isDisabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (isDisabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, [isDisabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isDisabled}
      />

      <AnimatePresence mode="wait">
        {!preview ? (
          // Upload Zone
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => !isDisabled && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative w-full aspect-square max-w-sm mx-auto
              rounded-3xl border-2 border-dashed
              flex flex-col items-center justify-center
              cursor-pointer transition-all duration-300
              ${isDragging
                ? 'border-[#171717] bg-[#171717]/5 scale-[1.02]'
                : 'border-[#171717]/20 bg-white hover:border-[#171717]/40'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Icon */}
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              className="w-20 h-20 rounded-full bg-[#171717]/10 flex items-center justify-center mb-6"
            >
              {isDragging ? (
                <Upload className="w-10 h-10 text-[#171717]" />
              ) : (
                <Camera className="w-10 h-10 text-[#171717]/60" />
              )}
            </motion.div>

            {/* Text */}
            <p className="text-[#171717] font-semibold text-lg mb-2">
              {isDragging ? '여기에 놓으세요' : '셀피 업로드'}
            </p>
            <p className="text-[#171717]/50 text-sm text-center px-8">
              사진을 끌어놓거나 클릭하여<br />
              이미지를 선택하세요
            </p>

            {/* Supported formats */}
            <div className="absolute bottom-6 flex items-center gap-2 text-[#171717]/30 text-xs">
              <ImageIcon className="w-4 h-4" />
              <span>JPG, PNG, HEIC</span>
            </div>
          </motion.div>
        ) : (
          // Preview
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm mx-auto"
          >
            {/* Image Preview */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#171717]/5">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />

              {/* Clear Button */}
              <button
                onClick={handleClear}
                disabled={isDisabled}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#171717]/80 text-white flex items-center justify-center hover:bg-[#171717] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Analyze Button */}
            <motion.button
              onClick={handleAnalyze}
              disabled={isDisabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full mt-6 py-4 rounded-2xl font-semibold text-lg
                flex items-center justify-center gap-2
                transition-colors
                ${isDisabled
                  ? 'bg-[#171717]/30 text-white cursor-not-allowed'
                  : 'bg-[#171717] text-white hover:bg-[#171717]/90'
                }
              `}
            >
              <Camera className="w-5 h-5" />
              분석 시작하기
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
