#!/usr/bin/env python3
# ---------------------------------------------------------
# Field Nine OS: Agent 실행 예시
# OpenAI GPT-4o 연동 완전 예제
# ---------------------------------------------------------

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ai_engine.core import (
    AgentController,
    AgentState,
    QualityAgent,
    create_default_registry,
    ThoughtProcess,
    Action,
    Observation
)


async def main():
    """
    Field Nine OS Agent 실행 예시

    실행 방법:
        1. 환경변수 설정:
           export OPENAI_API_KEY="sk-..."
           export SERPER_API_KEY="..."  # (선택) 웹 검색용

        2. 실행:
           cd field-nine-solutions
           python -m ai_engine.examples.run_agent
    """

    print("=" * 60)
    print("🚀 Field Nine OS - Level 3 AI Agent")
    print("=" * 60)

    # API 키 확인
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY 환경변수를 설정해주세요.")
        print("   export OPENAI_API_KEY='sk-...'")
        return

    # 도구 레지스트리 생성
    tools = create_default_registry({
        "serper_api_key": os.getenv("SERPER_API_KEY"),
        # "supabase": supabase_client,  # Supabase 클라이언트 연결 시
    })

    print(f"📦 등록된 도구: {tools.list_tools()}")

    # 품질 검수 에이전트 생성 (선택적)
    quality_agent = QualityAgent(
        min_quality_threshold=0.7,
        max_retries=2
    )

    # 콜백 함수 정의
    def on_thought(content: str):
        """실시간 Thought 스트리밍"""
        print(content, end="", flush=True)

    def on_action(action: Action):
        """Action 실행 알림"""
        print(f"\n🔧 도구 실행: {action.tool_name}")

    def on_observation(obs: Observation):
        """Observation 결과"""
        status = "✅" if obs.success else "❌"
        print(f"{status} 결과: {str(obs.result)[:200]}...")

    def on_state_change(state: AgentState):
        """상태 변경 알림"""
        state_icons = {
            AgentState.THINKING: "🤔",
            AgentState.ACTING: "⚡",
            AgentState.OBSERVING: "👁️",
            AgentState.REVIEWING: "🔍",
            AgentState.COMPLETED: "✅",
            AgentState.FAILED: "❌",
        }
        icon = state_icons.get(state, "📌")
        print(f"\n{icon} 상태: {state.value}")

    # 에이전트 생성
    agent = AgentController(
        agent_id="field-nine-agent",
        openai_api_key=api_key,
        tools=tools,
        quality_agent=quality_agent,
        model="gpt-4o",
        max_iterations=5,
        quality_threshold=0.7,
        enable_streaming=True,
        verbose=True,
        on_thought=on_thought,
        on_action=on_action,
        on_observation=on_observation,
        on_state_change=on_state_change,
    )

    print("\n" + "=" * 60)

    # 테스트 태스크 실행
    tasks = [
        "오늘 날씨가 패션 트렌드에 미치는 영향을 분석해줘",
        # "2026년 한국 스트릿 패션 트렌드를 검색하고 요약해줘",
        # "Field Nine의 매출 데이터를 분석해줘",
    ]

    for task in tasks:
        print(f"\n🎯 Task: {task}")
        print("-" * 60)

        result = await agent.execute(task)

        print("\n" + "=" * 60)
        print("📊 실행 결과:")
        print(f"  - 성공: {result['success']}")
        print(f"  - 반복 횟수: {result['iterations']}")
        print(f"  - 상태: {result['state']}")

        if result.get("usage_stats"):
            stats = result["usage_stats"]
            print(f"\n💰 사용량:")
            print(f"  - 총 토큰: {stats.get('usage', {}).get('total_tokens', 0)}")
            print(f"  - 예상 비용: ${stats.get('usage', {}).get('estimated_cost_usd', 0):.4f}")

        if result.get("error"):
            print(f"\n❌ 에러: {result['error']}")

        print("=" * 60)


async def streaming_example():
    """
    스트리밍 실행 예시

    에이전트의 모든 과정을 실시간으로 모니터링
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY 환경변수를 설정해주세요.")
        return

    tools = create_default_registry()

    agent = AgentController(
        agent_id="streaming-agent",
        openai_api_key=api_key,
        tools=tools,
        model="gpt-4o",
        max_iterations=3,
        enable_streaming=True,
        verbose=False,  # 직접 출력할 것이므로 비활성화
    )

    print("🌊 스트리밍 모드 실행")
    print("-" * 60)

    task = "간단한 인사말을 생성해줘"

    async for update in agent.execute_streaming(task):
        update_type = update.get("type")

        if update_type == "start":
            print(f"🎯 Task ID: {update['task_id']}")

        elif update_type == "iteration_start":
            print(f"\n--- Iteration {update['iteration']} ---")

        elif update_type == "state":
            print(f"📌 State: {update['state']}")

        elif update_type == "thought_chunk":
            print(update["content"], end="", flush=True)

        elif update_type == "thought_complete":
            print("\n✅ Thought complete")

        elif update_type == "action":
            print(f"⚡ Action: {update['action']}")

        elif update_type == "observation":
            print(f"👁️ Observation: {update['observation']}")

        elif update_type == "complete":
            print(f"\n🎉 Complete: {update['result'][:200]}...")

        elif update_type == "max_iterations":
            print(f"⚠️ Max iterations reached: {update['iterations']}")


async def simple_chat_example():
    """
    간단한 OpenAI 채팅 예시

    LLM Provider만 사용하여 직접 대화
    """
    from ai_engine.core import OpenAIProvider, ChatMessage, MessageRole

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY 환경변수를 설정해주세요.")
        return

    # Provider 생성
    provider = OpenAIProvider(
        api_key=api_key,
        model="gpt-4o",
        temperature=0.7,
        on_stream_chunk=lambda c: print(c, end="", flush=True),
    )

    print("💬 간단한 채팅 예시")
    print("-" * 60)

    messages = [
        ChatMessage(
            role=MessageRole.SYSTEM,
            content="너는 친절한 한국어 AI 비서야."
        ),
        ChatMessage(
            role=MessageRole.USER,
            content="안녕하세요! Field Nine에 대해 소개해줄 수 있나요?"
        )
    ]

    # 일반 호출
    print("📝 일반 응답:")
    response = await provider.chat(messages)
    print(response.content)
    print(f"\n📊 토큰 사용량: {response.usage}")

    # 스트리밍 호출
    print("\n🌊 스트리밍 응답:")
    messages.append(ChatMessage(
        role=MessageRole.ASSISTANT,
        content=response.content or ""
    ))
    messages.append(ChatMessage(
        role=MessageRole.USER,
        content="더 자세히 알려줘"
    ))

    async for chunk in provider.chat_stream(messages):
        if chunk.content:
            print(chunk.content, end="", flush=True)
        if chunk.is_complete:
            print("\n✅ 스트리밍 완료")

    # 사용량 통계
    print(f"\n💰 총 사용량: {provider.get_usage_stats()}")


async def function_calling_example():
    """
    Function Calling 예시

    도구를 사용한 LLM 호출
    """
    from ai_engine.core import OpenAIProvider, ChatMessage, MessageRole

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY 환경변수를 설정해주세요.")
        return

    provider = OpenAIProvider(
        api_key=api_key,
        model="gpt-4o",
    )

    # 도구 스키마 정의
    tools = [
        {
            "name": "get_weather",
            "description": "Get the current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city name"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "default": "celsius"
                    }
                },
                "required": ["location"]
            }
        },
        {
            "name": "search_products",
            "description": "Search for fashion products",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["tops", "bottoms", "shoes", "accessories"]
                    }
                },
                "required": ["query"]
            }
        }
    ]

    print("🔧 Function Calling 예시")
    print("-" * 60)

    messages = [
        ChatMessage(
            role=MessageRole.SYSTEM,
            content="You are a helpful assistant that can check weather and search products."
        ),
        ChatMessage(
            role=MessageRole.USER,
            content="서울 날씨 알려주고, 요즘 인기있는 스니커즈 검색해줘"
        )
    ]

    response = await provider.chat(messages, tools)

    print(f"📝 응답: {response.content}")
    print(f"\n🔧 Tool Calls:")
    for tc in response.tool_calls:
        print(f"  - {tc.name}: {tc.arguments}")

    # Tool 실행 결과를 다시 LLM에 전달하는 예시
    if response.tool_calls:
        messages.append(ChatMessage(
            role=MessageRole.ASSISTANT,
            content=response.content or "",
            tool_calls=[{
                "id": tc.id,
                "name": tc.name,
                "arguments": tc.arguments
            } for tc in response.tool_calls]
        ))

        # Mock tool results
        for tc in response.tool_calls:
            if tc.name == "get_weather":
                tool_result = {"temperature": 15, "condition": "맑음", "humidity": 45}
            elif tc.name == "search_products":
                tool_result = {"products": [
                    {"name": "Nike Air Max", "price": 159000},
                    {"name": "Adidas Samba", "price": 139000}
                ]}
            else:
                tool_result = {"error": "Unknown tool"}

            messages.append(ChatMessage(
                role=MessageRole.TOOL,
                content=str(tool_result),
                tool_call_id=tc.id
            ))

        # Final response with tool results
        final_response = await provider.chat(messages)
        print(f"\n📋 최종 응답:\n{final_response.content}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Field Nine OS Agent 예시")
    parser.add_argument(
        "--mode",
        choices=["full", "streaming", "chat", "function"],
        default="full",
        help="실행 모드 선택"
    )

    args = parser.parse_args()

    if args.mode == "full":
        asyncio.run(main())
    elif args.mode == "streaming":
        asyncio.run(streaming_example())
    elif args.mode == "chat":
        asyncio.run(simple_chat_example())
    elif args.mode == "function":
        asyncio.run(function_calling_example())
