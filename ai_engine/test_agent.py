#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Field Nine OS Agent 테스트 스크립트
"""
import asyncio
import os
import sys
import io

# Windows 콘솔 UTF-8 설정
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_openai_connection():
    """OpenAI 연결 테스트"""
    print("=" * 60)
    print("[TEST] Field Nine OS - Agent Test")
    print("=" * 60)

    # API 키 확인
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[X] OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        print("\n설정 방법:")
        print("  Windows CMD: set OPENAI_API_KEY=sk-...")
        print("  PowerShell: $env:OPENAI_API_KEY='sk-...'")
        return False

    print(f"[OK] API Key 확인됨: {api_key[:10]}...")

    try:
        from ai_engine.core.llm_providers import OpenAIProvider, ChatMessage, MessageRole

        print("\n[OK] OpenAIProvider 로딩 성공")

        # Provider 생성
        provider = OpenAIProvider(
            api_key=api_key,
            model="gpt-4o-mini",  # 테스트용으로 저렴한 모델 사용
            temperature=0.7,
            on_stream_chunk=lambda c: print(c, end="", flush=True)
        )

        print("[OK] Provider 생성 완료")
        print("\n" + "-" * 60)
        print("[CHAT] 간단한 채팅 테스트...")
        print("-" * 60)

        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content="너는 Field Nine의 AI 비서야. 간단하게 답해줘."),
            ChatMessage(role=MessageRole.USER, content="안녕! 넌 누구야?")
        ]

        # 일반 호출
        response = await provider.chat(messages)
        print(f"\n[RESPONSE] {response.content}")
        print(f"[TOKENS] {response.usage}")

        print("\n" + "-" * 60)
        print("[STREAM] 스트리밍 테스트...")
        print("-" * 60)

        messages.append(ChatMessage(role=MessageRole.ASSISTANT, content=response.content or ""))
        messages.append(ChatMessage(role=MessageRole.USER, content="Field Nine이 뭐하는 회사인지 한 문장으로 설명해줘"))

        print("[THOUGHT] ", end="")
        async for chunk in provider.chat_stream(messages):
            if chunk.is_complete:
                print("\n[OK] 스트리밍 완료")

        print("\n" + "-" * 60)
        print(f"[USAGE] 총 사용량: {provider.get_usage_stats()}")
        print("-" * 60)

        return True

    except ImportError as e:
        print(f"[X] Import 에러: {e}")
        print("   openai 패키지가 설치되어 있는지 확인하세요:")
        print("   pip install openai")
        return False

    except Exception as e:
        print(f"[X] 에러 발생: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_full_agent():
    """전체 에이전트 테스트"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[X] OPENAI_API_KEY가 필요합니다.")
        return False

    try:
        from ai_engine.core import (
            AgentController,
            QualityAgent,
            create_default_registry,
            AgentState
        )

        print("\n" + "=" * 60)
        print("[AGENT] 전체 에이전트 테스트")
        print("=" * 60)

        # 도구 레지스트리
        tools = create_default_registry()
        print(f"[TOOLS] 등록된 도구: {tools.list_tools()}")

        # 에이전트 생성
        agent = AgentController(
            agent_id="test-agent",
            openai_api_key=api_key,
            tools=tools,
            model="gpt-4o-mini",  # 테스트용
            max_iterations=3,
            quality_threshold=0.7,
            enable_streaming=True,
            verbose=True,
            on_thought=lambda t: print(t, end="", flush=True),
            on_state_change=lambda s: print(f"\n[STATE] {s.value}")
        )

        print("\n[TASK] '간단한 인사말을 생성해줘'")
        print("-" * 60)

        result = await agent.execute("간단한 인사말을 생성해줘")

        print("\n" + "=" * 60)
        print("[RESULT] 실행 결과:")
        print(f"  - 성공: {result['success']}")
        print(f"  - 반복: {result['iterations']}회")
        print(f"  - 상태: {result['state']}")

        if result.get('usage_stats'):
            stats = result['usage_stats']
            usage = stats.get('usage', {})
            print(f"  - 토큰: {usage.get('total_tokens', 0)}")
            print(f"  - 비용: ${usage.get('estimated_cost_usd', 0):.4f}")

        if result.get('result'):
            print(f"\n[OUTPUT]\n{str(result['result'])[:500]}")

        return True

    except Exception as e:
        print(f"[X] 에이전트 에러: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """메인 테스트"""
    # 1. 기본 연결 테스트
    success = await test_openai_connection()

    if success:
        print("\n")
        # 2. 전체 에이전트 테스트
        await test_full_agent()

    print("\n" + "=" * 60)
    print("[DONE] 테스트 완료")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
