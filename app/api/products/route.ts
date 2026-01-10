import { createClient } from '@/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { Product, ProductFormData } from '@/types/product';
import { trackError } from '@/lib/monitoring-enhanced';

/**
 * Products API Route
 * 
 * This handles all product CRUD operations:
 * - GET: Fetch all products for the authenticated user
 * - POST: Create a new product
 * 
 * Security: RLS (Row Level Security) ensures users can only access their own products
 * 
 * @route /api/products
 */

// GET: Fetch all products
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Fetch products (RLS will automatically filter by user_id)
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      trackError(error as Error, { component: 'Products API', action: 'fetch' });
      console.error('[Products API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Database error', message: '상품을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Transform Supabase data to Product type
    const transformedProducts: Product[] = (products || []).map((p: {
      id: string;
      name: string;
      sku: string;
      price: number;
      stock: number;
      cost: number | null;
      category: string | null;
      image_url: string | null;
      created_at: string;
      updated_at: string;
    }) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      stock: p.stock,
      cost: p.cost ? Number(p.cost) : undefined,
      category: p.category || undefined,
      image: p.image_url || undefined,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error) {
    console.error('[Products API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ProductFormData = await request.json();

    // Validation
    if (!body.name || !body.sku || !body.price || body.price <= 0) {
      return NextResponse.json(
        { error: 'Validation error', message: '상품명, SKU, 가격은 필수입니다.' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', body.sku)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Duplicate SKU', message: '이미 존재하는 SKU입니다.' },
        { status: 409 }
      );
    }

    // Insert new product
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        sku: body.sku,
        price: body.price,
        stock: body.stock || 0,
        cost: body.cost || null,
        category: body.category || null,
        image_url: body.image || null,
        user_id: session.user.id, // RLS: automatically set to current user
      })
      .select()
      .single();

    if (error) {
      console.error('[Products API] Insert error:', error);
      return NextResponse.json(
        { error: 'Database error', message: '상품을 추가하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Transform to Product type
    const transformedProduct: Product = {
      id: newProduct.id,
      name: newProduct.name,
      sku: newProduct.sku,
      price: Number(newProduct.price),
      stock: newProduct.stock,
      cost: newProduct.cost ? Number(newProduct.cost) : undefined,
      category: newProduct.category || undefined,
      image: newProduct.image_url || undefined,
      createdAt: new Date(newProduct.created_at),
      updatedAt: new Date(newProduct.updated_at),
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
      message: '상품이 성공적으로 추가되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('[Products API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: '예상치 못한 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
