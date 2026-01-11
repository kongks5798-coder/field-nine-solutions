import asyncio
import re
import requests
import time
from playwright.async_api import async_playwright
from win10toast import ToastNotifier
from datetime import datetime

# ==========================================
# ⚙️ 보스, 여기만 수정하세요 (타겟 설정)
# ==========================================
TARGETS = [
    {
        "name": "구찌 마몽트 백 (예시)",
        "url": "https://www.jomashop.com/gucci-bag-447632-dtd1t-1000.html", 
        "target_price_usd": 1500.00  # 이 가격보다 싸면 알림!
    },
    {
        "name": "오메가 씨마스터 (예시)",
        "url": "https://www.jomashop.com/omega-watch-210-30-42-20-01-001.html",
        "target_price_usd": 4000.00
    }
]
# ==========================================

class FieldNineHunter:
    def __init__(self):
        self.toaster = ToastNotifier()
        self.usd_krw = 1400.0 # 기본 환율

    def update_rate(self):
        try:
            res = requests.get("https://api.exchangerate-api.com/v4/latest/USD", timeout=3)
            self.usd_krw = res.json()['rates']['KRW']
        except:
            pass

    def alert(self, title, msg):
        """윈도우 알림 + 터미널 출력 동시 실행"""
        print(f"\n{'='*40}\n🚨 {title}\n{msg}\n{'='*40}\n")
        try:
            self.toaster.show_toast(title, msg, duration=5, threaded=True)
        except:
            pass # 알림 에러나도 봇은 죽지 않게 처리

    async def check(self):
        async with async_playwright() as p:
            print(f"[{datetime.now().strftime('%H:%M')}] 🔭 사냥 시작 (환율: {self.usd_krw:.0f}원)...")
            browser = await p.chromium.launch(headless=True)
            
            for item in TARGETS:
                try:
                    page = await browser.new_page()
                    await page.goto(item['url'], timeout=60000)
                    
                    # 가격 추출 (조마샵/일반적인 쇼핑몰 메타태그 기준)
                    try:
                        price_str = await page.locator('meta[itemprop="price"]').get_attribute("content")
                    except:
                        # 메타태그 없으면 보이는 가격 텍스트 긁기
                        price_str = await page.locator(".now-price").first.inner_text()

                    price = float(re.sub(r'[^\d.]', '', price_str))
                    
                    # 마진 계산
                    final_kor = (price * self.usd_krw * 1.18) + 20000 # 관세18% + 배송비
                    
                    print(f"   ✔️ {item['name']}: ${price:,.2f} (목표: ${item['target_price_usd']})")

                    if price <= item['target_price_usd']:
                        self.alert(
                            "자비스: 사냥감 포착!", 
                            f"{item['name']} 발견!\n현재가: ${price}\n예상비용: {final_kor:,.0f}원"
                        )
                    
                    await page.close()
                except Exception as e:
                    print(f"   ❌ 탐색 실패 ({item['name']}): {e}")

            await browser.close()
            print("💤 1분 대기 중...")

if __name__ == "__main__":
    bot = FieldNineHunter()
    while True:
        bot.update_rate()
        asyncio.run(bot.check())
        time.sleep(60) # 60초마다 반복