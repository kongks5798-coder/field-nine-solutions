import time
import schedule
import sys
import os

# ⭐️ [핵심] 현재 파일(auto_pilot.py)이 있는 폴더를 강제로 인식시킴
# 이걸 넣으면 "옆에 있는 파일 못 찾겠다"는 에러가 싹 사라집니다.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from diagnose_system import run_diagnosis

def job():
    print(f"\n⏰ [24시 자동 감시] 현재 시간: {time.strftime('%H:%M:%S')}")
    try:
        run_diagnosis()
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

# 테스트를 위해 10초마다 실행
schedule.every(10).seconds.do(job)

print("🚀 [Jarvis Auto-Pilot] 24시간 자동화 시스템 가동 중...")
print("   (종료하려면 Ctrl + C를 누르세요)")

while True:
    schedule.run_pending()
    time.sleep(1)