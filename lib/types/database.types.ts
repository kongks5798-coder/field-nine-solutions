export type KYCStatus = 'pending' | 'verified' | 'rejected';
export type WalletType = 'ethereum' | 'polygon' | 'binance';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type PaymentStatus = 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
export type PaymentMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER' | 'MOBILE' | 'GIFT_CERTIFICATE' | 'EASY_PAY';

export interface Profile {
  id: string;
  user_id: string;
  kyc_status: KYCStatus;
  kyc_verified_at: string | null;
  created_at: string;
}

export interface PassportData {
  id: string;
  profile_id: string;
  passport_number: string;
  mrz_code: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  expiry_date: string;
  document_image_url: string | null;
  created_at: string;
}

export interface GhostWallet {
  id: string;
  profile_id: string;
  encrypted_private_key: string;
  public_address: string;
  wallet_type: WalletType;
  biometric_hash: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  chain_id: number;
  from_address: string;
  to_address: string;
  amount: string;
  status: TransactionStatus;
  created_at: string;
}

// 토스페이먼츠 결제 기록
export interface PaymentTransaction {
  id: string;
  user_id: string;
  payment_key: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  card_company?: string;
  card_number?: string;
  receipt_url?: string;
  created_at: string;
}

// 유저 지갑 잔액
export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      passport_data: {
        Row: PassportData;
        Insert: Omit<PassportData, 'id' | 'created_at'>;
        Update: Partial<Omit<PassportData, 'id' | 'created_at'>>;
      };
      ghost_wallets: {
        Row: GhostWallet;
        Insert: Omit<GhostWallet, 'id' | 'created_at'>;
        Update: Partial<Omit<GhostWallet, 'id' | 'created_at'>>;
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: Omit<WalletTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<WalletTransaction, 'id' | 'created_at'>>;
      };
      payment_transactions: {
        Row: PaymentTransaction;
        Insert: Omit<PaymentTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<PaymentTransaction, 'id' | 'created_at'>>;
      };
      user_wallets: {
        Row: UserWallet;
        Insert: Omit<UserWallet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserWallet, 'id' | 'created_at'>>;
      };
    };
  };
}
