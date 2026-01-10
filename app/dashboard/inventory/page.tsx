"use client"

import { useState, useMemo, useEffect } from "react"
import SidebarLayout from "@/components/layout/SidebarLayout"
import { MobileNavBar, MobileSearchBar } from "./mobile-optimized"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, AlertTriangle, ArrowUpDown, Loader2, Eye } from "lucide-react"
import { Product, ProductFormData } from "@/types/product"
import Image from "next/image"

/**
 * Inventory Page
 * 
 * This page displays all products from Supabase database in a table format with:
 * - Search functionality
 * - Filter by low stock
 * - Sort by price
 * - Add new product modal (saves to Supabase)
 * 
 * Features:
 * - Real-time search (client-side filtering)
 * - Low stock warnings (stock < 10)
 * - Professional table design
 * - Responsive mobile layout
 * - Loading states with skeleton UI
 * - Automatic refresh after adding product
 */
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "none">("none")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    cost: 0,
    category: "",
  })

  // Fetch products from Supabase on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/products")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "상품을 불러오는 중 오류가 발생했습니다.")
      }

      if (result.success) {
        setProducts(result.data || [])
      } else {
        throw new Error(result.message || "알 수 없는 오류가 발생했습니다.")
      }
    } catch (err) {
      console.error("[Inventory] Fetch error:", err)
      setError(err instanceof Error ? err.message : "상품을 불러오는 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter((p) => p.stock < 10)
    }

    // Sort by price
    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    }

    return filtered
  }, [products, searchQuery, showLowStockOnly, sortBy])

  // Calculate low stock count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock < 10).length
  }, [products])

  // Handle add product (saves to Supabase)
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku || newProduct.price <= 0) {
      alert("상품명, SKU, 가격을 모두 입력해주세요.")
      return
    }

    try {
      setIsAdding(true)
      setError(null)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "상품을 추가하는 중 오류가 발생했습니다.")
      }

      if (result.success) {
        // Reset form
        setNewProduct({
          name: "",
          sku: "",
          price: 0,
          stock: 0,
          cost: 0,
          category: "",
        })
        
        // Close modal
        setIsAddModalOpen(false)
        
        // Refresh product list
        await fetchProducts()
      } else {
        throw new Error(result.message || "알 수 없는 오류가 발생했습니다.")
      }
    } catch (err) {
      console.error("[Inventory] Add product error:", err)
      alert(err instanceof Error ? err.message : "상품을 추가하는 중 오류가 발생했습니다.")
    } finally {
      setIsAdding(false)
    }
  }

  // Format price to KRW
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price)
  }

  return (
    <SidebarLayout>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">재고 관리</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            총 {products.length}개 상품 · 재고 부족 {lowStockCount}개
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          상품 추가
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <Input
              type="text"
              placeholder="상품명, SKU, 카테고리로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Low Stock Filter */}
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="w-full sm:w-auto"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            재고 부족만 ({lowStockCount})
          </Button>

          {/* Sort Button */}
          <Button
            variant="outline"
            onClick={() => {
              if (sortBy === "none") setSortBy("price-asc")
              else if (sortBy === "price-asc") setSortBy("price-desc")
              else setSortBy("none")
            }}
            className="w-full sm:w-auto"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            {sortBy === "none" && "가격 정렬"}
            {sortBy === "price-asc" && "가격 ↑"}
            {sortBy === "price-desc" && "가격 ↓"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">오류 발생</p>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            className="mt-3"
          >
            다시 시도
          </Button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">이미지</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">판매가</TableHead>
                <TableHead className="text-right">재고</TableHead>
                <TableHead className="text-right">원가</TableHead>
                <TableHead className="text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading Skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="w-12 h-12 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#6B6B6B]">
                    {searchQuery || showLowStockOnly
                      ? "검색 결과가 없습니다."
                      : "상품이 없습니다. 상품을 추가해주세요."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <div className="w-12 h-12 relative rounded-md overflow-hidden bg-[#F5F5F5]">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-[#F5F5F5] rounded-md flex items-center justify-center text-[#6B6B6B] text-xs">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#171717]">{product.name}</div>
                      {product.stock < 10 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          재고 부족
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-[#6B6B6B] font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-[#6B6B6B]">
                      {product.category || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={product.stock < 10 ? "text-red-600 font-medium" : "text-[#171717]"}
                      >
                        {product.stock}개
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-[#6B6B6B]">
                      {product.cost ? formatPrice(product.cost) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/products/${product.id}`}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>새 상품 추가</DialogTitle>
            <DialogDescription>
              상품 정보를 입력하세요. 나중에 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#171717]">상품명 *</label>
              <Input
                placeholder="예: 프리미엄 면 티셔츠"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#171717]">SKU *</label>
              <Input
                placeholder="예: TSH-001"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[#171717]">판매가 (원) *</label>
                <Input
                  type="number"
                  placeholder="49000"
                  value={newProduct.price || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[#171717]">원가 (원)</label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={newProduct.cost || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, cost: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[#171717]">재고 수량</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newProduct.stock || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[#171717]">카테고리</label>
                <Input
                  placeholder="예: 의류"
                  value={newProduct.category || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddModalOpen(false)}
              disabled={isAdding}
            >
              취소
            </Button>
            <Button onClick={handleAddProduct} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                "상품 추가"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  )
}
