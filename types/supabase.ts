// ============================================
// Supabase TypeScript Types
// ============================================
// 이 파일은 자동 생성됩니다. 수동으로 편집하지 마세요.
//
// 생성 명령어:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
//
// 또는 Supabase Dashboard에서:
// Settings > API > Generate TypeScript types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'employee'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'employee'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          barcode: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string | null
          weight_kg: number | null
          dimensions_cm: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barcode: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category?: string | null
          weight_kg?: number | null
          dimensions_cm?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          barcode?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string | null
          weight_kg?: number | null
          dimensions_cm?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          zone_code: string
          rack_code: string
          level_code: string
          bin_code: string
          full_path: string
          capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          zone_code: string
          rack_code: string
          level_code: string
          bin_code: string
          capacity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          zone_code?: string
          rack_code?: string
          level_code?: string
          bin_code?: string
          capacity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          location_id: string
          quantity: number
          reserved_quantity: number
          last_counted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          location_id: string
          quantity?: number
          reserved_quantity?: number
          last_counted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          location_id?: string
          quantity?: number
          reserved_quantity?: number
          last_counted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          external_order_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          shipping_address: string
          total_amount: number
          status: 'pending' | 'processing' | 'picked' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
          source: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_order_id: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          shipping_address: string
          total_amount: number
          status?: 'pending' | 'processing' | 'picked' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
          source?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_order_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          shipping_address?: string
          total_amount?: number
          status?: 'pending' | 'processing' | 'picked' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
          source?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 사용 예시:
// import { Database } from '@/types/supabase';
// type Product = Database['public']['Tables']['products']['Row'];
// type Order = Database['public']['Tables']['orders']['Row'];
