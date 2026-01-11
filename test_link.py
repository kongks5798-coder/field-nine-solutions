import requests

# ==========================================
# 🔑 여기만 입력하세요
# ==========================================
TOKEN = "여기에_봇_토큰_입력"   # 예: 76123:ABC-Def...
CHAT_ID = "여기에_숫자_ID_입력" # 예: 12345678
# ==========================================

def send_test():
    message = (
        "🚨 **[자비스 연결 테스트]** 🚨\n\n"
        "보스, 이 링크가 눌리는지 확인해주세요.\n"
        "👉 **[구매 페이지 바로가기](https://www.jomashop.com)**\n\n"
        "이 메시지가 보이면 사냥 준비 완료입니다."
    )
    
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {"chat_id": CHAT_ID, "text": message, "parse_mode": "Markdown"}
    
    try:
        response = requests.post(url, data=data)
        print(f"📡 전송 결과: {response.status_code}")
        if response.status_code == 200:
            print("✅ 성공! 핸드폰을 확인하세요.")
        else:
            print(f"❌ 실패! 토큰이나 ID를 다시 확인해주세요. (에러: {response.text})")
    except Exception as e:
        print(f"❌ 연결 오류: {e}")

if __name__ == "__main__":
    send_test()