/**
 * K-UNIVERSAL KYC Processor
 * Auto-sync passport data to Supabase user profiles
 */

import { supabase } from '@/lib/supabase/client';
import type { PassportData } from './passport-scanner';

export interface KYCSubmission {
  userId: string;
  passportData: PassportData;
  documentImageUrl: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface KYCResult {
  success: boolean;
  profileId?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  message: string;
}

export class KYCProcessor {
  /**
   * Submit KYC data and auto-sync to user profile
   */
  async submitKYC(submission: KYCSubmission): Promise<KYCResult> {
    try {
      // 1. Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, kyc_status')
        .eq('user_id', submission.userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // 2. If already verified, reject duplicate submission
      if (existingProfile?.kyc_status === 'verified') {
        return {
          success: false,
          kycStatus: 'verified',
          message: 'KYC already verified for this account',
        };
      }

      // 3. Insert or update passport data
      const { data: passportRecord, error: passportError } = await supabase
        .from('passport_data')
        .upsert(
          {
            profile_id: existingProfile?.id,
            passport_number: submission.passportData.passportNumber,
            mrz_code: submission.passportData.mrzCode,
            full_name: submission.passportData.fullName,
            date_of_birth: submission.passportData.dateOfBirth,
            nationality: submission.passportData.nationality,
            expiry_date: submission.passportData.expiryDate,
            document_image_url: submission.documentImageUrl,
            verification_score: 0.95, // Placeholder for AI verification score
          },
          { onConflict: 'profile_id' }
        )
        .select()
        .single();

      if (passportError) {
        throw passportError;
      }

      // 4. Auto-verify if confidence is high (production: add manual review)
      const autoVerify = this.shouldAutoVerify(submission.passportData);
      const newStatus = autoVerify ? 'verified' : 'pending';

      // 5. Update profile KYC status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: newStatus,
          kyc_verified_at: autoVerify ? new Date().toISOString() : null,
        })
        .eq('id', existingProfile!.id);

      if (updateError) {
        throw updateError;
      }

      // 6. Create audit log
      await this.createAuditLog({
        profileId: existingProfile!.id,
        action: 'kyc_submitted',
        metadata: {
          passport_number: submission.passportData.passportNumber,
          nationality: submission.passportData.nationality,
          auto_verified: autoVerify,
          ip_address: submission.ipAddress,
          device_info: submission.deviceInfo,
        },
      });

      return {
        success: true,
        profileId: existingProfile!.id,
        kycStatus: newStatus,
        message: autoVerify
          ? 'KYC verified successfully'
          : 'KYC submitted for review',
      };
    } catch (error) {
      console.error('KYC processing error:', error);
      return {
        success: false,
        kycStatus: 'rejected',
        message: error instanceof Error ? error.message : 'KYC processing failed',
      };
    }
  }

  /**
   * Check if KYC should be auto-verified (production: use AI/ML model)
   */
  private shouldAutoVerify(passportData: PassportData): boolean {
    // Basic validation rules
    const expiryDate = new Date(passportData.expiryDate);
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    // Auto-verify if:
    // 1. Passport is not expiring within 1 year
    // 2. Full name is present
    // 3. Passport number format is valid
    return (
      expiryDate > oneYearFromNow &&
      passportData.fullName.split(' ').length >= 2 &&
      passportData.passportNumber.length >= 6
    );
  }

  /**
   * Create audit log for compliance (GDPR, KYC/AML)
   */
  private async createAuditLog(params: {
    profileId: string;
    action: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('kyc_audit_logs').insert({
        profile_id: params.profileId,
        action: params.action,
        metadata: params.metadata,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit log failure shouldn't block KYC
    }
  }

  /**
   * Get KYC status for a user
   */
  async getKYCStatus(userId: string): Promise<{
    kycStatus: 'pending' | 'verified' | 'rejected' | 'not_submitted';
    passportData?: PassportData;
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          `
          id,
          kyc_status,
          passport_data (
            passport_number,
            mrz_code,
            full_name,
            date_of_birth,
            nationality,
            expiry_date,
            document_image_url
          )
        `
        )
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return { kycStatus: 'not_submitted' };
      }

      return {
        kycStatus: profile.kyc_status || 'not_submitted',
        passportData: profile.passport_data?.[0] as any,
      };
    } catch (error) {
      return { kycStatus: 'not_submitted' };
    }
  }
}
