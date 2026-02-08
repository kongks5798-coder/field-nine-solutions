/**
 * K-UNIVERSAL KYC Flow Hook
 * Manages end-to-end KYC verification process
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { PassportScanner, type OCRResult, type PassportData } from '@/lib/ocr/passport-scanner';
import { toast } from 'sonner';

export function useKYCFlow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const { updateKYCStatus, setUserProfile } = useAuthStore();

  /**
   * Step 1: Scan passport and extract data
   */
  const scanPassport = async (imageFile: File): Promise<boolean> => {
    setIsProcessing(true);
    toast.loading('여권 스캔 중...', { id: 'kyc-scan' });

    try {
      const scanner = new PassportScanner();
      await scanner.initialize();

      const result = await scanner.scanPassport(imageFile);
      await scanner.terminate();

      if (result.success && result.data) {
        setOcrResult(result);
        toast.success('여권 스캔 완료!', { id: 'kyc-scan' });
        return true;
      } else {
        toast.error(result.error || 'OCR 처리 실패', { id: 'kyc-scan' });
        return false;
      }
    } catch (error) {
      toast.error('스캔 중 오류 발생', { id: 'kyc-scan' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 2: Submit KYC data to backend
   */
  const submitKYC = async (userId: string): Promise<boolean> => {
    if (!ocrResult?.data) {
      toast.error('여권 데이터가 없습니다');
      return false;
    }

    setIsProcessing(true);
    toast.loading('KYC 제출 중...', { id: 'kyc-submit' });

    try {
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          passportData: ocrResult.data,
          documentImageUrl: 'demo-image-url', // TODO: Upload to Supabase Storage
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        updateKYCStatus(result.kycStatus, ocrResult.data);
        
        toast.success(
          result.kycStatus === 'verified'
            ? '✅ KYC 인증 완료!'
            : '📋 KYC 검토 중입니다',
          { id: 'kyc-submit' }
        );
        
        return true;
      } else {
        toast.error(result.error || 'KYC 제출 실패', { id: 'kyc-submit' });
        return false;
      }
    } catch (error) {
      toast.error('네트워크 오류', { id: 'kyc-submit' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Step 3: Check current KYC status
   */
  const checkKYCStatus = async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/kyc/submit?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        updateKYCStatus(result.kycStatus, result.passportData);
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
    }
  };

  return {
    isProcessing,
    ocrResult,
    scanPassport,
    submitKYC,
    checkKYCStatus,
  };
}
