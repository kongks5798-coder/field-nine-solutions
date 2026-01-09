/**
 * Product Type Definition
 * 
 * This defines the structure of a product in our inventory system.
 * Used throughout the app for type safety.
 * 
 * Fields:
 * - id: Unique identifier (UUID or string)
 * - name: Product name
 * - sku: Stock Keeping Unit (product code)
 * - price: Selling price in KRW
 * - stock: Current stock quantity
 * - image: Product image URL (optional)
 * - cost: Cost price (for profit calculation)
 * - category: Product category (optional)
 * - createdAt: When product was added
 * - updatedAt: Last update time
 */
export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  image?: string
  cost?: number
  category?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Product Form Data
 * 
 * Used when creating or editing a product.
 * All fields except image are required.
 */
export interface ProductFormData {
  name: string
  sku: string
  price: number
  stock: number
  image?: string
  cost?: number
  category?: string
}
