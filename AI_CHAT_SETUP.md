# AI 채팅 기능 설정 가이드

Field Nine에 Google Gemini와 OpenAI ChatGPT를 연동한 AI 채팅 기능이 추가되었습니다.

## 🚀 기능

- **Google Gemini** 지원
- **OpenAI ChatGPT** 지원
- 실시간 채팅 인터페이스
- 제미나이 스타일의 중앙 채팅 UI
- 메시지 히스토리 관리
- Provider 전환 기능

## 📋 설정 방법

### 1. API 키 발급

#### Google Gemini API 키 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. API 키 복사

#### OpenAI API 키 발급
1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. "Create new secret key" 클릭
3. API 키 복사

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음을 추가하세요:

```env
# Google Gemini API
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Vercel 배포 시 환경 변수 설정

1. Vercel 대시보드 접속
2. 프로젝트 설정 → Environment Variables
3. 다음 변수 추가:
   - `GOOGLE_GEMINI_API_KEY`
   - `OPENAI_API_KEY`

## 🎯 사용 방법

### 채팅 페이지 접속
- URL: `https://www.fieldnine.io/chat`
- 또는 랜딩 페이지의 "AI 어시스턴트와 대화하기" 버튼 클릭

### Provider 전환
- 채팅 인터페이스 상단의 "Gemini" 또는 "ChatGPT" 버튼으로 전환 가능

## 📁 파일 구조

```
app/
  api/
    ai/
      chat/
        route.ts          # AI 채팅 API 엔드포인트
  chat/
    page.tsx              # 채팅 페이지
components/
  ai/
    ChatInterface.tsx     # 채팅 UI 컴포넌트
```

## 🔧 API 엔드포인트

### POST `/api/ai/chat`

**요청 본문:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "안녕하세요!"
    }
  ],
  "provider": "gemini",  // "gemini" 또는 "openai"
  "model": "gemini-pro"  // 선택사항
}
```

**응답:**
```json
{
  "success": true,
  "message": "안녕하세요! 무엇을 도와드릴까요?",
  "provider": "gemini",
  "model": "gemini-pro"
}
```

## 🎨 UI 특징

- 제미나이 스타일의 중앙 정렬 채팅 인터페이스
- 실시간 메시지 스트리밍 (향후 지원)
- Provider 전환 기능
- 반응형 디자인
- Tesla Warm Ivory 테마 적용

## 🐛 문제 해결

### API 키 오류
- 환경 변수가 올바르게 설정되었는지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- Vercel 배포 시 환경 변수가 설정되었는지 확인

### 응답 생성 실패
- API 키의 사용량 한도 확인
- 네트워크 연결 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 📝 향후 개선 사항

- [ ] 스트리밍 응답 지원
- [ ] 채팅 히스토리 저장 (데이터베이스)
- [ ] 사용자별 세션 관리
- [ ] 파일 업로드 지원
- [ ] 코드 블록 하이라이팅
- [ ] 마크다운 렌더링
