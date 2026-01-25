# CEO Briefing Agent - Field Nine OS Level 3
# Mission: 2026 영업 데이터 기반 통합 브리핑 생성

import os
import sys
import json
import asyncio
from datetime import datetime, timedelta

# UTF-8 설정
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

# API Key 로드
env_path = r"C:\Users\polor\field-nine-dashboard\.env.local"
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

# 경로 설정
sys.path.insert(0, r"C:\Users\polor\field-nine-solutions")

from ai_engine.core import (
    AgentController,
    AgentLLMInterface,
    ToolRegistry,
    Tool,
    ToolParameter,
    ToolCategory,
    QualityAgent,
    ChatMessage,
    MessageRole
)
import aiohttp


# ============================================================
# CUSTOM TOOLS FOR CEO BRIEFING
# ============================================================

class GoogleSheetsReaderTool(Tool):
    """Google Sheets 데이터 읽기 도구"""

    def __init__(self, service_account_email: str, private_key: str, spreadsheet_id: str):
        super().__init__()
        self._name = "google_sheets_reader"
        self._description = "Read data from Google Sheets (2026_영업_PLAN_NEW)"
        self._category = ToolCategory.DATABASE
        self._parameters = [
            ToolParameter("sheet_name", "string", "시트 이름 (예: 2026, 주문현황, 클레임현황, 목표설정)", required=False)
        ]
        self.email = service_account_email
        self.key = private_key
        self.spreadsheet_id = spreadsheet_id

    async def execute(self, sheet_name: str = None, **kwargs) -> dict:
        """Google Sheets API를 통해 데이터 읽기"""
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

            # Private key 처리
            key = self.key.replace("\\n", "\n")

            credentials = service_account.Credentials.from_service_account_info(
                {
                    "type": "service_account",
                    "client_email": self.email,
                    "private_key": key,
                    "token_uri": "https://oauth2.googleapis.com/token"
                },
                scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
            )

            service = build('sheets', 'v4', credentials=credentials)

            # 시트 정보 가져오기
            sheet_info = service.spreadsheets().get(spreadsheetId=self.spreadsheet_id).execute()
            available_sheets = [s['properties']['title'] for s in sheet_info.get('sheets', [])]

            if not sheet_name:
                sheet_name = '2026' if '2026' in available_sheets else available_sheets[0]

            # 데이터 읽기
            result = service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"'{sheet_name}'!A:Z"
            ).execute()

            values = result.get('values', [])

            return {
                "success": True,
                "sheet_name": sheet_name,
                "available_sheets": available_sheets,
                "row_count": len(values),
                "headers": values[0] if values else [],
                "data": values[1:21] if len(values) > 1 else [],  # 샘플 20행
                "full_data": values  # 전체 데이터
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


class SalesAnalyzerTool(Tool):
    """매출 데이터 분석 도구"""

    def __init__(self):
        super().__init__()
        self._name = "sales_analyzer"
        self._description = "Analyze sales data and calculate key metrics"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("data", "object", "Raw sheet data to analyze"),
            ToolParameter("analysis_type", "string", "Type: target_rate, top_products, claims_risk", required=False)
        ]

    async def execute(self, data: dict = None, analysis_type: str = "all", **kwargs) -> dict:
        """매출 데이터 분석"""
        if not data or not data.get("full_data"):
            return {"error": "No data provided"}

        full_data = data["full_data"]
        headers = full_data[0] if full_data else []
        rows = full_data[1:] if len(full_data) > 1 else []

        result = {
            "sheet": data.get("sheet_name"),
            "total_rows": len(rows),
            "headers": headers
        }

        # 컬럼 인덱스 찾기
        def find_col(keywords):
            for i, h in enumerate(headers):
                if h and any(k.lower() in str(h).lower() for k in keywords):
                    return i
            return -1

        date_col = find_col(['날짜', '일자', '판매일', '정산일', '주문일'])
        amount_col = find_col(['결제금액', '판매금액', '정산금액', '금액', '매출', 'TTL', '합계'])
        product_col = find_col(['상품', '상품명', '품목', '제품', '주차'])

        # 플랫폼 컬럼들
        platform_keywords = ['무신사', '공홈', '29cm', '글로벌', '패텐', 'w컨셉']
        platform_cols = {}
        for i, h in enumerate(headers):
            if h:
                for pk in platform_keywords:
                    if pk.lower() in str(h).lower():
                        platform_cols[str(h)] = i
                        break

        result["column_info"] = {
            "date_col": date_col,
            "amount_col": amount_col,
            "product_col": product_col,
            "platform_cols": platform_cols
        }

        # 매출 계산
        total_revenue = 0
        platform_totals = {}

        for row in rows:
            # 플랫폼별 매출
            for name, col_idx in platform_cols.items():
                if col_idx < len(row):
                    try:
                        val = str(row[col_idx]).replace(',', '').replace(' ', '')
                        num = int(val) if val.isdigit() else 0
                        platform_totals[name] = platform_totals.get(name, 0) + num
                    except:
                        pass

            # 총 매출
            if amount_col >= 0 and amount_col < len(row):
                try:
                    val = str(row[amount_col]).replace(',', '').replace(' ', '')
                    num = int(val) if val.isdigit() else 0
                    total_revenue += num
                except:
                    pass

        result["revenue"] = {
            "total": total_revenue,
            "by_platform": platform_totals
        }

        return result


class ClaimsAnalyzerTool(Tool):
    """클레임 데이터 분석 도구"""

    def __init__(self):
        super().__init__()
        self._name = "claims_analyzer"
        self._description = "Analyze claims data and identify high-priority risks"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("data", "object", "Claims sheet data")
        ]

    async def execute(self, data: dict = None, **kwargs) -> dict:
        """클레임 데이터 분석 및 리스크 식별"""
        if not data or not data.get("full_data"):
            return {"error": "No claims data provided"}

        full_data = data["full_data"]
        headers = full_data[0] if full_data else []
        rows = full_data[1:] if len(full_data) > 1 else []

        # 클레임 분류
        claims_by_type = {}
        high_priority = []

        def find_col(keywords):
            for i, h in enumerate(headers):
                if h and any(k.lower() in str(h).lower() for k in keywords):
                    return i
            return -1

        type_col = find_col(['유형', '구분', '종류', '사유', '클레임'])
        status_col = find_col(['상태', '처리상태', '진행'])
        date_col = find_col(['날짜', '일자', '접수일'])
        amount_col = find_col(['금액', '환불', '보상'])

        for row in rows:
            claim_type = row[type_col] if type_col >= 0 and type_col < len(row) else "기타"
            status = row[status_col] if status_col >= 0 and status_col < len(row) else ""

            if claim_type:
                claims_by_type[str(claim_type)] = claims_by_type.get(str(claim_type), 0) + 1

            # 미처리 또는 긴급 클레임 식별
            if status and any(k in str(status) for k in ['미처리', '대기', '긴급', '즉시']):
                high_priority.append({
                    "type": claim_type,
                    "status": status,
                    "row": row[:5]  # 첫 5개 컬럼
                })

        # 가장 많은 클레임 유형
        top_claim_type = max(claims_by_type.items(), key=lambda x: x[1]) if claims_by_type else ("없음", 0)

        return {
            "total_claims": len(rows),
            "by_type": claims_by_type,
            "top_claim_type": {"type": top_claim_type[0], "count": top_claim_type[1]},
            "high_priority_count": len(high_priority),
            "high_priority_items": high_priority[:5],  # 상위 5개만
            "risk_level": "HIGH" if len(high_priority) > 5 else "MEDIUM" if len(high_priority) > 0 else "LOW"
        }


class TargetAnalyzerTool(Tool):
    """목표 달성률 분석 도구"""

    def __init__(self):
        super().__init__()
        self._name = "target_analyzer"
        self._description = "Analyze sales targets and achievement rate"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("sales_data", "object", "Actual sales data"),
            ToolParameter("target_data", "object", "Target/goal data")
        ]

    async def execute(self, sales_data: dict = None, target_data: dict = None, **kwargs) -> dict:
        """목표 대비 달성률 계산"""
        result = {
            "period": "2026 YTD",
            "calculated_at": datetime.now().isoformat()
        }

        # 실제 매출 추출
        actual_revenue = 0
        if sales_data and sales_data.get("revenue"):
            actual_revenue = sales_data["revenue"].get("total", 0)

        # 목표 매출 추출
        target_revenue = 0
        if target_data and target_data.get("full_data"):
            rows = target_data["full_data"][1:] if len(target_data["full_data"]) > 1 else []
            headers = target_data["full_data"][0] if target_data["full_data"] else []

            # 목표 금액 컬럼 찾기
            target_col = -1
            for i, h in enumerate(headers):
                if h and any(k in str(h) for k in ['목표', '타겟', '계획', 'target', 'goal']):
                    target_col = i
                    break

            if target_col >= 0:
                for row in rows:
                    if target_col < len(row):
                        try:
                            val = str(row[target_col]).replace(',', '').replace(' ', '')
                            num = int(val) if val.isdigit() else 0
                            target_revenue += num
                        except:
                            pass

        # 달성률 계산
        if target_revenue > 0:
            achievement_rate = (actual_revenue / target_revenue) * 100
        else:
            # 목표 데이터 없으면 추정
            target_revenue = 500000000  # 5억 추정
            achievement_rate = (actual_revenue / target_revenue) * 100

        result["actual_revenue"] = actual_revenue
        result["target_revenue"] = target_revenue
        result["achievement_rate"] = round(achievement_rate, 1)
        result["gap"] = target_revenue - actual_revenue
        result["status"] = "ON_TRACK" if achievement_rate >= 80 else "NEEDS_ATTENTION" if achievement_rate >= 50 else "CRITICAL"

        return result


class TopProductsAnalyzerTool(Tool):
    """TOP 상품 분석 도구"""

    def __init__(self):
        super().__init__()
        self._name = "top_products_analyzer"
        self._description = "Analyze and rank top-selling products"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("orders_data", "object", "Orders/sales data")
        ]

    async def execute(self, orders_data: dict = None, **kwargs) -> dict:
        """TOP 3 상품 분석"""
        if not orders_data or not orders_data.get("full_data"):
            return {"error": "No orders data"}

        full_data = orders_data["full_data"]
        headers = full_data[0] if full_data else []
        rows = full_data[1:] if len(full_data) > 1 else []

        # 상품/주차 컬럼 찾기
        product_col = -1
        amount_col = -1
        qty_col = -1

        for i, h in enumerate(headers):
            if h:
                h_lower = str(h).lower()
                if any(k in h_lower for k in ['상품', '품목', '제품', '주차', 'product']):
                    product_col = i
                if any(k in h_lower for k in ['금액', '매출', '판매금액', 'ttl', '합계']):
                    amount_col = i
                if any(k in h_lower for k in ['수량', '판매량', 'qty', 'quantity']):
                    qty_col = i

        # 상품별 집계
        product_sales = {}

        for row in rows:
            product = row[product_col] if product_col >= 0 and product_col < len(row) else None
            if not product or str(product).strip() == '':
                continue

            product = str(product).strip()

            # 금액 추출
            amount = 0
            if amount_col >= 0 and amount_col < len(row):
                try:
                    val = str(row[amount_col]).replace(',', '').replace(' ', '')
                    amount = int(val) if val.isdigit() else 0
                except:
                    pass

            if product not in product_sales:
                product_sales[product] = {"sales": 0, "count": 0}

            product_sales[product]["sales"] += amount
            product_sales[product]["count"] += 1

        # TOP 3 정렬
        sorted_products = sorted(product_sales.items(), key=lambda x: x[1]["sales"], reverse=True)
        top_3 = sorted_products[:3]

        return {
            "total_products": len(product_sales),
            "top_3": [
                {
                    "rank": i + 1,
                    "product": p[0],
                    "total_sales": p[1]["sales"],
                    "order_count": p[1]["count"]
                }
                for i, p in enumerate(top_3)
            ],
            "analysis_period": "이번 주"
        }


# ============================================================
# MAIN EXECUTION
# ============================================================

async def run_ceo_briefing():
    """CEO 브리핑 생성 메인 함수"""

    print("=" * 70)
    print("[FIELD NINE OS] CEO BRIEFING AGENT v1.0")
    print("=" * 70)
    print(f"[INIT] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # 환경변수 확인
    api_key = os.environ.get("OPENAI_API_KEY")
    service_email = os.environ.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")
    private_key = os.environ.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")
    spreadsheet_id = "1EIhlnIvT2gutlyVMhDcARxU8DAC4M9rR5BHbphzLvB4"

    if not api_key:
        print("[ERROR] OPENAI_API_KEY not found")
        return

    print(f"[OK] OpenAI API Key: {api_key[:20]}...")
    print(f"[OK] Service Account: {service_email}")
    print(f"[OK] Spreadsheet ID: {spreadsheet_id}")
    print()

    # ============================================================
    # PHASE 1: PLAN
    # ============================================================
    print("=" * 70)
    print("[PHASE 1: PLAN] Google Sheet 스캔 전략")
    print("=" * 70)

    # 도구 레지스트리 생성
    registry = ToolRegistry()

    # Google Sheets 도구 등록
    sheets_tool = GoogleSheetsReaderTool(
        service_account_email=service_email,
        private_key=private_key,
        spreadsheet_id=spreadsheet_id
    )
    registry.register(sheets_tool, ["sheets", "read_sheet"])

    # 분석 도구 등록
    sales_tool = SalesAnalyzerTool()
    claims_tool = ClaimsAnalyzerTool()
    target_tool = TargetAnalyzerTool()
    products_tool = TopProductsAnalyzerTool()

    registry.register(sales_tool, ["analyze_sales"])
    registry.register(claims_tool, ["analyze_claims"])
    registry.register(target_tool, ["analyze_target"])
    registry.register(products_tool, ["analyze_products", "top_products"])

    print(f"[TOOLS] Registered: {registry.list_tools()}")
    print()

    # ============================================================
    # PHASE 2: EXECUTE - 데이터 수집
    # ============================================================
    print("=" * 70)
    print("[PHASE 2: EXECUTE] 데이터 수집 및 분석")
    print("=" * 70)

    collected_data = {}

    # 1. 2026 매출 시트 읽기
    print("\n[SCAN] '2026' 시트 스캔 중...")
    sales_sheet = await sheets_tool.execute(sheet_name="2026")
    if sales_sheet.get("success"):
        print(f"  → 시트 '{sales_sheet['sheet_name']}' 로드 완료 ({sales_sheet['row_count']} rows)")
        collected_data["sales_sheet"] = sales_sheet
    else:
        print(f"  → [WARN] {sales_sheet.get('error')}")

    # 2. 주문현황 시트 읽기
    print("\n[SCAN] '주문현황' 시트 스캔 중...")
    orders_sheet = await sheets_tool.execute(sheet_name="주문현황")
    if orders_sheet.get("success"):
        print(f"  → 시트 '{orders_sheet['sheet_name']}' 로드 완료 ({orders_sheet['row_count']} rows)")
        collected_data["orders_sheet"] = orders_sheet
    else:
        print(f"  → [WARN] {orders_sheet.get('error')}")

    # 3. 클레임현황 시트 읽기
    print("\n[SCAN] '클레임현황' 시트 스캔 중...")
    claims_sheet = await sheets_tool.execute(sheet_name="클레임현황")
    if claims_sheet.get("success"):
        print(f"  → 시트 '{claims_sheet['sheet_name']}' 로드 완료 ({claims_sheet['row_count']} rows)")
        collected_data["claims_sheet"] = claims_sheet
    else:
        print(f"  → [WARN] {claims_sheet.get('error')}")

    # 4. 목표설정 시트 읽기
    print("\n[SCAN] '목표설정' 시트 스캔 중...")
    target_sheet = await sheets_tool.execute(sheet_name="목표설정")
    if target_sheet.get("success"):
        print(f"  → 시트 '{target_sheet['sheet_name']}' 로드 완료 ({target_sheet['row_count']} rows)")
        collected_data["target_sheet"] = target_sheet
    else:
        print(f"  → [WARN] {target_sheet.get('error')}")

    print("\n[DATA] 데이터 수집 완료")
    print(f"  → Available sheets: {sales_sheet.get('available_sheets', [])}")

    # ============================================================
    # PHASE 2: EXECUTE - 분석 실행
    # ============================================================
    print("\n" + "-" * 70)
    print("[ANALYSIS] 데이터 분석 시작")
    print("-" * 70)

    analysis_results = {}

    # 1. 매출 분석
    print("\n[ANALYZE] 매출 데이터 분석 중...")
    if collected_data.get("sales_sheet"):
        sales_analysis = await sales_tool.execute(data=collected_data["sales_sheet"])
        analysis_results["sales"] = sales_analysis
        print(f"  → 총 매출: ₩{sales_analysis.get('revenue', {}).get('total', 0):,}")

    # 2. 목표 달성률 계산
    print("\n[ANALYZE] 목표 달성률 계산 중...")
    target_analysis = await target_tool.execute(
        sales_data=analysis_results.get("sales"),
        target_data=collected_data.get("target_sheet")
    )
    analysis_results["target"] = target_analysis
    print(f"  → 달성률: {target_analysis.get('achievement_rate', 0)}%")

    # 3. TOP 3 상품 분석
    print("\n[ANALYZE] TOP 3 상품 분석 중...")
    # 주문현황 또는 2026 시트 사용
    orders_data = collected_data.get("orders_sheet") or collected_data.get("sales_sheet")
    if orders_data:
        products_analysis = await products_tool.execute(orders_data=orders_data)
        analysis_results["top_products"] = products_analysis
        top_3 = products_analysis.get("top_3", [])
        for item in top_3:
            print(f"  → #{item['rank']} {item['product']}: ₩{item['total_sales']:,}")

    # 4. 클레임 리스크 분석
    print("\n[ANALYZE] 클레임 리스크 분석 중...")
    if collected_data.get("claims_sheet"):
        claims_analysis = await claims_tool.execute(data=collected_data["claims_sheet"])
        analysis_results["claims"] = claims_analysis
        print(f"  → 리스크 레벨: {claims_analysis.get('risk_level', 'N/A')}")
        print(f"  → 긴급 처리 필요: {claims_analysis.get('high_priority_count', 0)}건")

    # ============================================================
    # PHASE 3: VERIFY - 데이터 검증
    # ============================================================
    print("\n" + "=" * 70)
    print("[PHASE 3: VERIFY] 데이터 재검증")
    print("=" * 70)

    verification = {
        "timestamp": datetime.now().isoformat(),
        "checks": []
    }

    # 매출 데이터 검증
    if analysis_results.get("sales"):
        sales = analysis_results["sales"]
        check = {
            "item": "매출 데이터",
            "source": sales.get("sheet"),
            "rows": sales.get("total_rows", 0),
            "status": "VERIFIED" if sales.get("total_rows", 0) > 0 else "NO_DATA"
        }
        verification["checks"].append(check)
        print(f"  [✓] {check['item']}: {check['status']} ({check['rows']} rows)")

    # 목표 달성률 검증
    if analysis_results.get("target"):
        target = analysis_results["target"]
        check = {
            "item": "목표 달성률",
            "value": f"{target.get('achievement_rate', 0)}%",
            "status": "VERIFIED"
        }
        verification["checks"].append(check)
        print(f"  [✓] {check['item']}: {check['value']}")

    # TOP 상품 검증
    if analysis_results.get("top_products"):
        products = analysis_results["top_products"]
        check = {
            "item": "TOP 상품",
            "count": len(products.get("top_3", [])),
            "status": "VERIFIED" if products.get("top_3") else "NO_DATA"
        }
        verification["checks"].append(check)
        print(f"  [✓] {check['item']}: {check['count']}개 확인")

    # 클레임 검증
    if analysis_results.get("claims"):
        claims = analysis_results["claims"]
        check = {
            "item": "클레임 현황",
            "count": claims.get("total_claims", 0),
            "risk": claims.get("risk_level", "N/A"),
            "status": "VERIFIED"
        }
        verification["checks"].append(check)
        print(f"  [✓] {check['item']}: {check['count']}건, 리스크 {check['risk']}")

    verification["overall"] = "PASS" if all(c.get("status") == "VERIFIED" for c in verification["checks"]) else "PARTIAL"
    print(f"\n  [RESULT] 검증 결과: {verification['overall']}")

    # ============================================================
    # PHASE 4: AESTHETICS - CEO STATUS REPORT
    # ============================================================
    print("\n" + "=" * 70)
    print("[PHASE 4: AESTHETICS] Tesla Style CEO Report 생성")
    print("=" * 70)

    # 데이터 추출
    target = analysis_results.get("target", {})
    sales = analysis_results.get("sales", {})
    products = analysis_results.get("top_products", {})
    claims = analysis_results.get("claims", {})

    # 플랫폼별 매출
    platform_revenue = sales.get("revenue", {}).get("by_platform", {})
    top_platform = max(platform_revenue.items(), key=lambda x: x[1]) if platform_revenue else ("N/A", 0)

    # TOP 3 상품
    top_3 = products.get("top_3", [])

    # 클레임 리스크
    risk_level = claims.get("risk_level", "N/A")
    top_claim = claims.get("top_claim_type", {})
    high_priority = claims.get("high_priority_count", 0)

    # Tesla Style Report 생성
    report = f"""
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║   ███████╗██╗███████╗██╗     ██████╗     ███╗   ██╗██╗███╗   ██╗███████╗ ║
║   ██╔════╝██║██╔════╝██║     ██╔══██╗    ████╗  ██║██║████╗  ██║██╔════╝ ║
║   █████╗  ██║█████╗  ██║     ██║  ██║    ██╔██╗ ██║██║██╔██╗ ██║█████╗   ║
║   ██╔══╝  ██║██╔══╝  ██║     ██║  ██║    ██║╚██╗██║██║██║╚██╗██║██╔══╝   ║
║   ██║     ██║███████╗███████╗██████╔╝    ██║ ╚████║██║██║ ╚████║███████╗ ║
║   ╚═╝     ╚═╝╚══════╝╚══════╝╚═════╝     ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝╚══════╝ ║
║                                                                          ║
║                        CEO STATUS REPORT                                 ║
║                    {datetime.now().strftime('%Y.%m.%d %H:%M')}                                    ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────────┐   ║
║   │  01. TARGET ACHIEVEMENT                                          │   ║
║   └─────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║       ACHIEVEMENT RATE ────────────────────── {target.get('achievement_rate', 0):>6.1f}%                ║
║                                                                          ║
║       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓{'▓' * min(int(target.get('achievement_rate', 0) / 5), 20)}{'░' * max(20 - int(target.get('achievement_rate', 0) / 5), 0)}                ║
║                                                                          ║
║       ACTUAL    ₩{target.get('actual_revenue', 0):>15,}                              ║
║       TARGET    ₩{target.get('target_revenue', 0):>15,}                              ║
║       GAP       ₩{target.get('gap', 0):>15,}                              ║
║       STATUS    {target.get('status', 'N/A'):<15}                                    ║
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────────┐   ║
║   │  02. TOP 3 PRODUCTS (THIS WEEK)                                  │   ║
║   └─────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║       #1  {top_3[0]['product'] if len(top_3) > 0 else 'N/A':<30}  ₩{top_3[0]['total_sales'] if len(top_3) > 0 else 0:>12,}    ║
║       #2  {top_3[1]['product'] if len(top_3) > 1 else 'N/A':<30}  ₩{top_3[1]['total_sales'] if len(top_3) > 1 else 0:>12,}    ║
║       #3  {top_3[2]['product'] if len(top_3) > 2 else 'N/A':<30}  ₩{top_3[2]['total_sales'] if len(top_3) > 2 else 0:>12,}    ║
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────────┐   ║
║   │  03. RISK ALERT                                                  │   ║
║   └─────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║       RISK LEVEL ──────────────────────── [{risk_level:^8}]                  ║
║                                                                          ║
║       TOP CLAIM TYPE     {top_claim.get('type', 'N/A'):<20} ({top_claim.get('count', 0)} cases)      ║
║       URGENT ACTION      {high_priority} items require immediate attention         ║
║                                                                          ║
║   ┌─────────────────────────────────────────────────────────────────┐   ║
║   │  04. PLATFORM PERFORMANCE                                        │   ║
║   └─────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║"""

    # 플랫폼별 매출 추가
    for name, amount in sorted(platform_revenue.items(), key=lambda x: x[1], reverse=True)[:5]:
        report += f"\n║       {name:<15}  ₩{amount:>15,}                           ║"

    report += f"""
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   VERIFICATION: {verification['overall']:<10}                                           ║
║   GENERATED BY: FIELD NINE OS Level 3 Agent                             ║
║   SOURCE: 2026_영업_PLAN_NEW                                              ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

    print(report)

    # 결과 저장
    result_path = r"C:\Users\polor\field-nine-solutions\ceo_briefing_result.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "verification": verification,
            "analysis": analysis_results,
            "collected_sheets": list(collected_data.keys())
        }, f, ensure_ascii=False, indent=2)

    print(f"\n[SAVED] 상세 결과: {result_path}")
    print("\n[DONE] CEO Briefing 완료")

    return analysis_results


if __name__ == "__main__":
    asyncio.run(run_ceo_briefing())
