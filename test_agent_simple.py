#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Field Nine OS Agent 간단 테스트
"""
import asyncio
import os
import sys
import io

# Windows UTF-8
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

async def main():
    print("=" * 60)
    print("[TEST] Field Nine OS - Agent Test")
    print("=" * 60)

    # API 키
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[X] OPENAI_API_KEY 필요")
        return

    print(f"[OK] API Key: {api_key[:15]}...")

    try:
        from openai import AsyncOpenAI

        print("[OK] OpenAI SDK 로드 성공")

        client = AsyncOpenAI(api_key=api_key)

        print("\n[CHAT] GPT-4o-mini 테스트...")
        print("-" * 60)

        # 간단한 채팅 테스트
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 Field Nine의 AI 비서야. 간단하게 답해."},
                {"role": "user", "content": "안녕! 넌 누구야?"}
            ],
            temperature=0.7
        )

        content = response.choices[0].message.content
        print(f"\n[RESPONSE] {content}")
        print(f"[TOKENS] prompt={response.usage.prompt_tokens}, completion={response.usage.completion_tokens}")

        print("\n" + "-" * 60)
        print("[STREAM] 스트리밍 테스트...")
        print("-" * 60)

        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 Field Nine의 AI 비서야."},
                {"role": "assistant", "content": content},
                {"role": "user", "content": "Field Nine OS가 뭔지 한 문장으로 설명해줘"}
            ],
            stream=True
        )

        print("[STREAM] ", end="")
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end="", flush=True)

        print("\n\n[OK] 스트리밍 완료!")

        print("\n" + "=" * 60)
        print("[AGENT] AgentController 테스트...")
        print("=" * 60)

        # AgentController 테스트
        from ai_engine.core import AgentController, create_default_registry

        tools = create_default_registry()
        print(f"[TOOLS] {tools.list_tools()}")

        agent = AgentController(
            agent_id="test-agent",
            openai_api_key=api_key,
            tools=tools,
            model="gpt-4o-mini",
            max_iterations=2,
            enable_streaming=True,
            verbose=True,
            on_thought=lambda t: print(t, end="", flush=True)
        )

        print("\n[TASK] '간단한 인사말을 만들어줘'")
        print("-" * 60)

        result = await agent.execute("간단한 인사말을 만들어줘")

        print("\n" + "-" * 60)
        print(f"[RESULT] 성공: {result['success']}")
        print(f"[RESULT] 반복: {result['iterations']}회")
        print(f"[RESULT] 상태: {result['state']}")

        if result.get('result'):
            print(f"\n[OUTPUT]\n{str(result['result'])[:300]}")

    except ImportError as e:
        print(f"[X] Import 에러: {e}")
        import traceback
        traceback.print_exc()

    except Exception as e:
        print(f"[X] 에러: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("[DONE] 테스트 완료")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
