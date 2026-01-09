import { Product } from "@/types/product"

/**
 * Mock Product Data
 * 
 * This is temporary data for development and testing.
 * Later, this will be replaced with real data from Supabase.
 * 
 * TODO: Replace with Supabase query when database is ready
 * TODO: Add AI Stock Prediction Module Here
 */
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "프리미엄 면 티셔츠",
    sku: "TSH-001",
    price: 49000,
    stock: 45,
    cost: 25000,
    category: "의류",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    name: "데님 청바지",
    sku: "JEA-002",
    price: 89000,
    stock: 23,
    cost: 45000,
    category: "의류",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    name: "가죽 스니커즈",
    sku: "SHO-003",
    price: 129000,
    stock: 8, // Low stock - will trigger warning
    cost: 65000,
    category: "신발",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "4",
    name: "울 코트",
    sku: "COA-004",
    price: 199000,
    stock: 12,
    cost: 100000,
    category: "의류",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-19"),
  },
  {
    id: "5",
    name: "스포츠 백팩",
    sku: "BAC-005",
    price: 69000,
    stock: 5, // Low stock - will trigger warning
    cost: 35000,
    category: "액세서리",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "6",
    name: "실버 체인 목걸이",
    sku: "JEW-006",
    price: 159000,
    stock: 18,
    cost: 80000,
    category: "액세서리",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-21"),
  },
  {
    id: "7",
    name: "면 후드티",
    sku: "HOO-007",
    price: 79000,
    stock: 32,
    cost: 40000,
    category: "의류",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-17"),
  },
  {
    id: "8",
    name: "가죽 벨트",
    sku: "BEL-008",
    price: 59000,
    stock: 3, // Low stock - will trigger warning
    cost: 30000,
    category: "액세서리",
    image: "https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=400",
    createdAt: new Date("2024-01-09"),
    updatedAt: new Date("2024-01-14"),
  },
]

/**
 * Get all products
 * 
 * TODO: Replace with Supabase query
 * TODO: Add caching for performance
 */
export function getAllProducts(): Product[] {
  return mockProducts
}

/**
 * Get product by ID
 * 
 * TODO: Replace with Supabase query
 */
export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id)
}

/**
 * Get low stock products (stock < 10)
 * 
 * TODO: Replace with Supabase query with filter
 * TODO: Add AI Stock Prediction Module Here - predict when stock will run out
 */
export function getLowStockProducts(): Product[] {
  return mockProducts.filter((p) => p.stock < 10)
}
