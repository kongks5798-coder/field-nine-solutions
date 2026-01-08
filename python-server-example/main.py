"""
Field Nine Python Backend - Production Version
RTX 5090 로컬 서버에서 실행되는 FastAPI 서버
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# 환경 변수 로드
load_dotenv()

# FastAPI 앱 생성
app = FastAPI(title="Field Nine API", version="1.0.0")

# CORS 설정 (Vercel 프론트엔드와 통신)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-vercel-app.vercel.app",  # 실제 Vercel URL로 변경
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase 클라이언트 생성 (Service Role Key 사용)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # ⚠️ Service Role Key만 사용
)

# ============================================
# Pydantic Models
# ============================================

class OrderCreate(BaseModel):
    external_order_id: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: str
    total_amount: float
    source: Optional[str] = None
    metadata: Optional[dict] = None

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float

# ============================================
# Health Check
# ============================================

@app.get("/")
async def root():
    return {"message": "Field Nine API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    try:
        # Supabase 연결 테스트
        supabase.table("products").select("id").limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# ============================================
# Orders API
# ============================================

@app.get("/api/orders")
async def get_orders(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    주문 목록 조회
    """
    try:
        query = supabase.table("orders").select("*")
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True).limit(limit).offset(offset)
        
        response = query.execute()
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    """
    특정 주문 조회
    """
    try:
        # 주문 정보
        order_response = supabase.table("orders").select("*").eq("id", order_id).execute()
        
        if not order_response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # 주문 상세 항목
        items_response = supabase.table("order_items").select(
            "*, products(*)"
        ).eq("order_id", order_id).execute()
        
        return {
            "order": order_response.data[0],
            "items": items_response.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders")
async def create_order(order: OrderCreate, items: List[OrderItemCreate]):
    """
    새 주문 생성 (외부 쇼핑몰 동기화)
    """
    try:
        # 주문 생성
        order_data = order.dict()
        order_response = supabase.table("orders").insert(order_data).execute()
        
        if not order_response.data:
            raise HTTPException(status_code=400, detail="Failed to create order")
        
        created_order = order_response.data[0]
        order_id = created_order["id"]
        
        # 주문 항목 생성
        order_items = [
            {**item.dict(), "order_id": order_id}
            for item in items
        ]
        
        items_response = supabase.table("order_items").insert(order_items).execute()
        
        return {
            "order": created_order,
            "items": items_response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """
    주문 상태 업데이트
    """
    valid_statuses = ['pending', 'processing', 'picked', 'packed', 'shipped', 'delivered', 'cancelled']
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        response = supabase.table("orders").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", order_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Products API
# ============================================

@app.get("/api/products")
async def get_products(limit: int = 100, offset: int = 0):
    """
    상품 목록 조회
    """
    try:
        response = supabase.table("products").select("*").limit(limit).offset(offset).execute()
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """
    특정 상품 조회
    """
    try:
        response = supabase.table("products").select("*").eq("id", product_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Inventory API
# ============================================

@app.get("/api/inventory")
async def get_inventory(product_id: Optional[str] = None, location_id: Optional[str] = None):
    """
    재고 조회
    """
    try:
        query = supabase.table("inventory").select("*, products(*), locations(*)")
        
        if product_id:
            query = query.eq("product_id", product_id)
        
        if location_id:
            query = query.eq("location_id", location_id)
        
        response = query.execute()
        return {"data": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Sync Endpoint (외부 쇼핑몰 동기화)
# ============================================

@app.post("/api/sync/orders")
async def sync_orders():
    """
    외부 쇼핑몰에서 주문을 가져와서 Supabase에 동기화
    ⚠️ 실제 구현 시 외부 API 연동 로직 추가 필요
    """
    try:
        # 예시: 가상의 외부 주문 데이터
        # 실제로는 Shopify, WooCommerce 등의 API를 호출
        external_orders = [
            {
                "external_order_id": "EXT-001",
                "customer_name": "홍길동",
                "customer_email": "hong@example.com",
                "shipping_address": "서울시 강남구...",
                "total_amount": 50000.00,
                "source": "shopify",
                "items": [
                    {"product_id": "prod-123", "quantity": 2, "unit_price": 25000.00}
                ]
            }
        ]
        
        synced_orders = []
        
        for ext_order in external_orders:
            # 이미 동기화된 주문인지 확인
            existing = supabase.table("orders").select("id").eq(
                "external_order_id", ext_order["external_order_id"]
            ).execute()
            
            if existing.data:
                continue  # 이미 존재하는 주문은 스킵
            
            # 주문 생성
            items = ext_order.pop("items", [])
            order_data = {
                **ext_order,
                "status": "pending"
            }
            
            order_response = supabase.table("orders").insert(order_data).execute()
            
            if order_response.data:
                order_id = order_response.data[0]["id"]
                
                # 주문 항목 생성
                order_items = [
                    {**item, "order_id": order_id}
                    for item in items
                ]
                
                supabase.table("order_items").insert(order_items).execute()
                synced_orders.append(order_response.data[0])
        
        return {
            "message": f"Synced {len(synced_orders)} orders",
            "orders": synced_orders
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# 서버 실행
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
