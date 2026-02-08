from win10toast import ToastNotifier

# 1. 알림 도구 준비
toaster = ToastNotifier()

print("🚀 알림 발송 중...")

# 2. 윈도우 팝업 띄우기
toaster.show_toast(
    "자비스 (Jarvis)",               # 제목
    "보스! 사냥감이 포착되었습니다.\n지금 바로 확인하세요!", # 내용
    duration=5,                     # 5초 동안 떠있음
    threaded=True                   # 딴짓해도 안 멈춤
)

print("✅ 화면 오른쪽 아래를 보세요!")