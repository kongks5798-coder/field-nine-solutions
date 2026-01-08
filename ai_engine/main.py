"""
Field Nine Solutions - Python 주문 동기화 서버
FastAPI 기반 REST API 서버
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uuid

app = FastAPI(title="Field Nine Order Sync API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 데이터 모델 (Pydantic)
# ============================================

class OrderItemData(BaseModel):
    """주문 상세 품목"""
    product_sku: str = Field(..., description="상품 SKU")
    product_name: str = Field(..., description="상품명")
    quantity: int = Field(..., gt=0, description="주문 수량")
    unit_price: float = Field(..., ge=0, description="단가")
    unit_cost: Optional[float] = Field(None, ge=0, description="원가")
    option_name: Optional[str] = Field(None, description="옵션명")

class OrderData(BaseModel):
    """주문 데이터"""
    market_order_id: str = Field(..., description="마켓측 주문번호")
    store_id: Optional[str] = Field(None, description="스토어 ID")
    order_date: str = Field(..., description="주문 일시 (ISO 8601)")
    customer_name: str = Field(..., description="고객 이름")
    customer_email: Optional[str] = Field(None, description="고객 이메일")
    customer_phone: Optional[str] = Field(None, description="고객 전화번호")
    shipping_address: str = Field(..., description="배송 주소")
    shipping_address_detail: Optional[str] = Field(None, description="배송 상세 주소")
    shipping_postcode: Optional[str] = Field(None, description="우편번호")
    shipping_memo: Optional[str] = Field(None, description="배송 메모")
    product_amount: float = Field(..., ge=0, description="상품 총액")
    shipping_fee: float = Field(0, ge=0, description="배송비")
    discount_amount: float = Field(0, ge=0, description="할인 금액")
    platform_fee: float = Field(0, ge=0, description="플랫폼 수수료")
    payment_fee: float = Field(0, ge=0, description="결제 수수료")
    total_amount: float = Field(..., ge=0, description="주문 총액")
    status: str = Field("PAID", description="주문 상태")
    tracking_number: Optional[str] = Field(None, description="송장번호")
    items: List[OrderItemData] = Field(..., min_items=1, description="주문 상세 품목")

class SyncRequest(BaseModel):
    """동기화 요청"""
    platform: str = Field(..., description="플랫폼 (naver, coupang, etc.)")
    api_key: str = Field(..., description="API Key")
    store_id: str = Field(..., description="스토어 ID")

class SyncResponse(BaseModel):
    """동기화 응답"""
    success: bool = Field(..., description="성공 여부")
    orders: Optional[List[OrderData]] = Field(None, description="주문 데이터 목록")
    error: Optional[str] = Field(None, description="에러 메시지")
    message: Optional[str] = Field(None, description="응답 메시지")

# ============================================
# 헬퍼 함수
# ============================================

def generate_dummy_orders(platform: str, count: int = 5) -> List[OrderData]:
    """
    더미 주문 데이터 생성 (실제 마켓플레이스 API 연동 전까지 사용)
    실제 운영 시에는 여기서 실제 API를 호출하여 주문 데이터를 가져옴
    """
    orders = []
    
    # 플랫폼별 상품명 예시
    product_names = {
        "naver": ["네이버 스마트스토어 상품", "스마트스토어 특가 상품", "네이버 베스트 상품"],
        "coupang": ["쿠팡 로켓배송 상품", "쿠팡 와우 상품", "쿠팡 특가 상품"],
        "11st": ["11번가 인기 상품", "11번가 특가 상품", "11번가 베스트 상품"],
        "gmarket": ["지마켓 인기 상품", "지마켓 특가 상품", "지마켓 베스트 상품"],
    }
    
    products = product_names.get(platform, ["일반 상품"])
    
    for i in range(count):
        # 랜덤 날짜 (최근 7일 내)
        days_ago = random.randint(0, 7)
        order_date = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        # 랜덤 상품 선택
        product_name = random.choice(products)
        quantity = random.randint(1, 3)
        unit_price = random.randint(10000, 100000)
        unit_cost = int(unit_price * random.uniform(0.5, 0.8))  # 원가는 판매가의 50-80%
        
        # 주문 총액 계산
        product_amount = unit_price * quantity
        shipping_fee = random.choice([0, 2500, 3000, 3500])
        discount_amount = random.choice([0, 1000, 2000, 5000])
        platform_fee = int(product_amount * 0.05)  # 5% 플랫폼 수수료
        payment_fee = int(product_amount * 0.03)  # 3% 결제 수수료
        total_amount = product_amount + shipping_fee - discount_amount
        
        order = OrderData(
            market_order_id=f"{platform.upper()}-{uuid.uuid4().hex[:8].upper()}-{int(datetime.now().timestamp())}",
            order_date=order_date,
            customer_name=f"고객{random.randint(1, 100)}",
            customer_email=f"customer{random.randint(1, 100)}@example.com",
            customer_phone=f"010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            shipping_address=f"서울시 {random.choice(['강남구', '서초구', '송파구', '강동구'])}",
            shipping_address_detail=f"{random.randint(1, 100)}번지",
            shipping_postcode=f"{random.randint(10000, 99999)}",
            shipping_memo=random.choice([None, "부재 시 문 앞에 놓아주세요", "배송 전 연락 부탁드립니다"]),
            product_amount=product_amount,
            shipping_fee=shipping_fee,
            discount_amount=discount_amount,
            platform_fee=platform_fee,
            payment_fee=payment_fee,
            total_amount=total_amount,
            status=random.choice(["PAID", "PREPARING", "SHIPPED", "DELIVERED"]),
            tracking_number=f"TRACK{random.randint(1000000000, 9999999999)}" if random.random() > 0.5 else None,
            items=[
                OrderItemData(
                    product_sku=f"SKU-{platform.upper()}-{random.randint(1000, 9999)}",
                    product_name=product_name,
                    quantity=quantity,
                    unit_price=unit_price,
                    unit_cost=unit_cost,
                    option_name=random.choice([None, "색상: 빨강, 사이즈: L", "색상: 파랑, 사이즈: M"]),
                )
            ],
        )
        orders.append(order)
    
    return orders

# ============================================
# API 엔드포인트
# ============================================

@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "status": "ok",
        "service": "Field Nine Order Sync API",
        "version": "1.0.0",
    }

@app.post("/sync", response_model=SyncResponse)
async def sync_orders(request: SyncRequest):
    """
    주문 동기화 엔드포인트
    Next.js에서 호출하여 주문 데이터를 가져옴
    """
    try:
        # API Key 검증 (실제 운영 시에는 여기서 실제 API Key를 검증)
        if not request.api_key or len(request.api_key) < 10:
            raise HTTPException(status_code=401, detail="Invalid API Key")
        
        # 플랫폼별 실제 API 호출 (현재는 더미 데이터 반환)
        # 실제 운영 시에는 아래와 같이 실제 API를 호출:
        # if request.platform == "naver":
        #     # 네이버 스마트스토어 API 호출
        #     orders = await fetch_naver_orders(request.api_key)
        # elif request.platform == "coupang":
        #     # 쿠팡 API 호출
        #     orders = await fetch_coupang_orders(request.api_key)
        # else:
        #     raise HTTPException(status_code=400, detail="Unsupported platform")
        
        # 현재는 더미 데이터 생성 (실제 API 연동 전까지)
        orders = generate_dummy_orders(request.platform, count=random.randint(3, 8))
        
        return SyncResponse(
            success=True,
            orders=orders,
            message=f"{len(orders)}건의 주문을 가져왔습니다.",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        return SyncResponse(
            success=False,
            error=str(e),
            message="주문 동기화 중 오류가 발생했습니다.",
        )

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ============================================
# 서버 실행
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
