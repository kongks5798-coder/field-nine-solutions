'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/client';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { logger } from '@/src/utils/logger';
import Toast from '@/app/components/Toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  stock_quantity: number;
  thumbnail_url?: string;
  category?: string;
  margin_rate?: number;
  created_at: string;
  updated_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    sale_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    category: '',
  });

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/products/' + productId);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        throw new Error('상품을 찾을 수 없습니다.');
      }

      setProduct(data as Product);
      setEditForm({
        name: data.name || '',
        sku: data.sku || '',
        sale_price: Number(data.sale_price) || 0,
        cost_price: Number(data.cost_price) || 0,
        stock_quantity: Number(data.stock_quantity) || 0,
        category: data.category || '',
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('[ProductDetail] 상품 로드 실패:', error as Error);
      setError(error.message || '상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          sku: editForm.sku,
          sale_price: editForm.sale_price,
          cost_price: editForm.cost_price,
          stock_quantity: editForm.stock_quantity,
          category: editForm.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        throw updateError;
      }

      setToast({ message: '상품 정보가 업데이트되었습니다.', type: 'success' });
      setIsEditing(false);
      await loadProduct();
    } catch (err: unknown) {
      const error = err as { message?: string };
      logger.error('[ProductDetail] 상품 업데이트 실패:', error as Error);
      setError(error.message || '상품 업데이트에 실패했습니다.');
      setToast({ message: error.message || '상품 업데이트에 실패했습니다.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setEditForm({
        name: product.name || '',
        sku: product.sku || '',
        sale_price: Number(product.sale_price) || 0,
        cost_price: Number(product.cost_price) || 0,
        stock_quantity: Number(product.stock_quantity) || 0,
        category: product.category || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <SidebarLayout userName="로딩 중..." userEmail="">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </SidebarLayout>
    );
  }

  if (error && !product) {
    return (
      <SidebarLayout userName="오류" userEmail="">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-800 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">오류 발생</p>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/inventory')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            재고 관리로 돌아가기
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  if (!product) {
    return null;
  }

  const margin = product.sale_price - product.cost_price;
  const marginRate = product.sale_price > 0 ? (margin / product.sale_price) * 100 : 0;
  const isLowStock = product.stock_quantity < 10;

  return (
    <SidebarLayout userName="상품 상세" userEmail="">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/inventory')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#171717]">{product.name}</h1>
              <p className="text-[#6B6B6B] mt-1">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                편집
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Image & Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#171717] mb-4">상품 이미지</h2>
              {product.thumbnail_url ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#171717] mb-4">상품 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">상품명</label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="상품명"
                    />
                  ) : (
                    <p className="text-[#171717]">{product.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">SKU</label>
                  {isEditing ? (
                    <Input
                      value={editForm.sku}
                      onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                      placeholder="SKU"
                    />
                  ) : (
                    <p className="text-[#171717]">{product.sku}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">카테고리</label>
                  {isEditing ? (
                    <Input
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      placeholder="카테고리"
                    />
                  ) : (
                    <p className="text-[#171717]">{product.category || '미분류'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Stock Status */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                재고 현황
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">현재 재고</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.stock_quantity}
                      onChange={(e) => setEditForm({ ...editForm, stock_quantity: parseInt(e.target.value) || 0 })}
                      placeholder="재고 수량"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-[#171717]'}`}>
                        {product.stock_quantity}
                      </p>
                      {isLowStock && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">재고 부족</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                가격 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">판매가</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.sale_price}
                      onChange={(e) => setEditForm({ ...editForm, sale_price: parseFloat(e.target.value) || 0 })}
                      placeholder="판매가"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-[#171717]">
                      ₩{Number(product.sale_price).toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#6B6B6B] mb-1 block">원가</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.cost_price}
                      onChange={(e) => setEditForm({ ...editForm, cost_price: parseFloat(e.target.value) || 0 })}
                      placeholder="원가"
                    />
                  ) : (
                    <p className="text-xl font-semibold text-[#6B6B6B]">
                      ₩{Number(product.cost_price).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="pt-4 border-t border-[#E5E5E0]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B6B6B]">마진</span>
                    <span className="text-lg font-bold text-[#1A5D3F]">
                      ₩{margin.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B6B6B]">마진율</span>
                    <span className="text-lg font-bold text-[#1A5D3F]">
                      {marginRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#171717] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                통계
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">생성일</span>
                  <span className="text-[#171717]">
                    {new Date(product.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">수정일</span>
                  <span className="text-[#171717]">
                    {new Date(product.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
