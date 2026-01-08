import os
import time
import google.generativeai as genai
from db import get_db_client

# 1. Gemini AI 설정
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("❌ 경고: .env.local에 GOOGLE_API_KEY가 없습니다!")
else:
    genai.configure(api_key=api_key)

def run_diagnosis():
    print("------------------------------------------------")
    print("🤖 [Jarvis AI System] 지능형 진단 및 처방 시작...")
    
    # DB 연결
    try:
        db = get_db_client()
    except Exception as e:
        print(f"❌ DB 연결 실패: {e}")
        return

    # 2. 진단하지 않은 요청 가져오기
    print("🔍 대기 중인 요청을 조회합니다...")
    # diagnosis가 비어있는(is null) 항목만 가져옴
    response = db.table('requests').select("*").eq('diagnosis', None).execute()
    request_list = response.data
    
    if not request_list:
        print("🎉 모든 요청이 처리되었습니다. (할 일이 없습니다)")
        return

    print(f"📦 {len(request_list)}건의 새로운 요청을 처리합니다.\n")

    # AI 모델 준비
    model = genai.GenerativeModel('gemini-pro')

    # 3. 하나씩 처리하고 저장하기
    for req in request_list:
        req_id = req['id']
        user = req.get('user_id')
        symptom = req.get('symptom')
        
        print(f"▶ 분석 중... [ID: {req_id}] '{symptom}'")
        
        # AI에게 질문
        prompt = f"""
        당신은 최고의 비즈니스 컨설턴트 'Jarvis'입니다.
        아래 클라이언트의 고민을 듣고, 3줄 이내로 명확한 해결책을 제시해주세요.
        
        클라이언트 고민: "{symptom}"
        
        해결책:
        """
        
        try:
            # AI 답변 생성
            ai_response = model.generate_content(prompt)
            diagnosis_result = ai_response.text
            
            print("   ✅ 진단 완료! DB에 저장을 시도합니다...", end="")
            
            # ⭐️ [핵심] 결과를 다시 Supabase에 저장(Update)하는 코드
            db.table('requests').update({
                "diagnosis": diagnosis_result
            }).eq("id", req_id).execute()
            
            print(" [저장 성공! 💾]")
            print(f"   👉 처방 내용: {diagnosis_result}\n")
            
        except Exception as e:
            print(f"\n❌ 처리 중 에러 발생: {e}")

    print("------------------------------------------------")
    print("🏁 모든 작업이 완료되었습니다.")

if __name__ == "__main__":
    run_diagnosis()