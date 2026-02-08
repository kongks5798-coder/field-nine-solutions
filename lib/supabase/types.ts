/**
 * Supabase Database Types
 * 데이터베이스 스키마 타입 정의
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          kyc_status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
          kyc_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          kyc_status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
          kyc_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          kyc_status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
          kyc_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          has_virtual_card: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          currency?: string;
          has_virtual_card?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          currency?: string;
          has_virtual_card?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          wallet_id: string;
          user_id: string;
          type: 'topup' | 'payment' | 'transfer' | 'refund';
          amount: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          user_id: string;
          type: 'topup' | 'payment' | 'transfer' | 'refund';
          amount: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_id?: string;
          user_id?: string;
          type?: 'topup' | 'payment' | 'transfer' | 'refund';
          amount?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      kyc_data: {
        Row: {
          id: string;
          user_id: string;
          passport_number: string | null;
          full_name: string | null;
          nationality: string | null;
          date_of_birth: string | null;
          expiry_date: string | null;
          gender: string | null;
          document_type: string | null;
          raw_mrz: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          passport_number?: string | null;
          full_name?: string | null;
          nationality?: string | null;
          date_of_birth?: string | null;
          expiry_date?: string | null;
          gender?: string | null;
          document_type?: string | null;
          raw_mrz?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          passport_number?: string | null;
          full_name?: string | null;
          nationality?: string | null;
          date_of_birth?: string | null;
          expiry_date?: string | null;
          gender?: string | null;
          document_type?: string | null;
          raw_mrz?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      kyc_status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
      transaction_type: 'topup' | 'payment' | 'transfer' | 'refund';
      transaction_status: 'pending' | 'completed' | 'failed' | 'cancelled';
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type KYCData = Database['public']['Tables']['kyc_data']['Row'];
