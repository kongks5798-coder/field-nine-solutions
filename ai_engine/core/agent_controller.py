# ---------------------------------------------------------
# Field Nine OS: Agent Controller
# Level 3 Autonomous AI Agent with ReAct Framework
# OpenAI GPT-4o Integration
# ---------------------------------------------------------

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional, List, Dict, Callable, TypeVar, AsyncGenerator
from datetime import datetime
import asyncio
import json
import uuid
import logging

from .llm_providers import (
    OpenAIProvider,
    AgentLLMInterface,
    ChatMessage,
    MessageRole,
    LLMResponse,
    ToolCall,
    LLMError,
    TokenLimitError,
    RateLimitException,
    ThoughtStreamer,
    ErrorRecoveryHandler,
    StreamChunk
)

logger = logging.getLogger(__name__)


class AgentState(Enum):
    """에이전트 실행 상태"""
    IDLE = "idle"
    THINKING = "thinking"
    ACTING = "acting"
    OBSERVING = "observing"
    REVIEWING = "reviewing"  # Self-criticism phase
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


@dataclass
class ThoughtProcess:
    """ReAct의 Thought 단계 - 추론 과정 기록"""
    reasoning: str
    confidence: float  # 0.0 ~ 1.0
    plan: List[str]
    next_action: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    raw_response: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "reasoning": self.reasoning,
            "confidence": self.confidence,
            "plan": self.plan,
            "next_action": self.next_action,
            "timestamp": self.timestamp.isoformat()
        }

    @classmethod
    def from_llm_response(cls, content: str) -> 'ThoughtProcess':
        """LLM 응답에서 ThoughtProcess 파싱"""
        try:
            # JSON 파싱 시도
            data = json.loads(content)
            return cls(
                reasoning=data.get("reasoning", content),
                confidence=float(data.get("confidence", 0.5)),
                plan=data.get("plan", []),
                next_action=data.get("next_action"),
                raw_response=content
            )
        except json.JSONDecodeError:
            # JSON이 아닌 경우 텍스트로 처리
            return cls(
                reasoning=content,
                confidence=0.5,
                plan=[],
                raw_response=content
            )


@dataclass
class Action:
    """ReAct의 Action 단계 - 실행할 행동"""
    tool_name: str
    parameters: Dict[str, Any]
    expected_outcome: str
    action_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])

    def to_dict(self) -> Dict:
        return {
            "action_id": self.action_id,
            "tool_name": self.tool_name,
            "parameters": self.parameters,
            "expected_outcome": self.expected_outcome
        }

    @classmethod
    def from_tool_call(cls, tool_call: ToolCall, expected_outcome: str = "") -> 'Action':
        """ToolCall에서 Action 생성"""
        return cls(
            action_id=tool_call.id,
            tool_name=tool_call.name,
            parameters=tool_call.arguments,
            expected_outcome=expected_outcome
        )


@dataclass
class Observation:
    """ReAct의 Observation 단계 - 실행 결과 관찰"""
    action_id: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time_ms: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "action_id": self.action_id,
            "success": self.success,
            "result": str(self.result)[:500],  # Truncate for logging
            "error": self.error,
            "execution_time_ms": self.execution_time_ms
        }


@dataclass
class Feedback:
    """ReAct의 Feedback 단계 - 자기 비판 및 개선"""
    quality_score: float  # 0.0 ~ 1.0
    issues: List[str]
    suggestions: List[str]
    should_retry: bool
    retry_modifications: Optional[Dict] = None

    def to_dict(self) -> Dict:
        return {
            "quality_score": self.quality_score,
            "issues": self.issues,
            "suggestions": self.suggestions,
            "should_retry": self.should_retry,
            "retry_modifications": self.retry_modifications
        }


@dataclass
class AgentMemory:
    """에이전트의 단기/장기 기억"""
    short_term: List[Dict] = field(default_factory=list)  # Current session
    long_term: Dict[str, Any] = field(default_factory=dict)  # Persistent
    working_context: Dict[str, Any] = field(default_factory=dict)  # Active task context
    conversation_history: List[ChatMessage] = field(default_factory=list)  # LLM 대화 이력

    def add_to_short_term(self, entry: Dict):
        self.short_term.append({
            **entry,
            "timestamp": datetime.now().isoformat()
        })
        # Keep last 100 entries for context window
        if len(self.short_term) > 100:
            self.short_term = self.short_term[-100:]

    def get_relevant_context(self, query: str, limit: int = 10) -> List[Dict]:
        """간단한 관련성 기반 컨텍스트 검색"""
        return self.short_term[-limit:]

    def add_message(self, role: MessageRole, content: str):
        """대화 이력에 메시지 추가"""
        self.conversation_history.append(ChatMessage(role=role, content=content))
        # 최근 20개 메시지만 유지 (토큰 관리)
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

    def get_conversation_context(self) -> List[ChatMessage]:
        """LLM 호출용 대화 컨텍스트 반환"""
        return self.conversation_history.copy()


class AgentController:
    """
    Level 3 AI Agent Controller

    ReAct 프레임워크 기반 자율 에이전트 (OpenAI GPT-4o 연동)
    - Thought: 현재 상황 분석 및 계획 수립 (스트리밍 지원)
    - Action: 도구를 사용하여 실행
    - Observation: 결과 관찰 및 기록
    - Feedback: 품질 검수 및 자기 비판

    Usage:
        controller = AgentController(
            agent_id="trend-analyzer",
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            tools=tool_registry,
            on_thought=lambda t: print(f"💭 {t}")
        )
        result = await controller.execute("한국 스트릿 패션 트렌드 분석")
    """

    # 시스템 프롬프트
    SYSTEM_PROMPT = """You are an autonomous AI agent named '{agent_id}' operating within the Field Nine OS.
Your task is to reason step-by-step and execute actions using available tools to accomplish the user's goal.

## Response Format
Always respond with a JSON object:
{{
    "reasoning": "Your detailed step-by-step analysis of the current situation",
    "confidence": 0.0-1.0 (how confident you are that the task is complete),
    "plan": ["step 1", "step 2", ...],
    "next_action": "The tool to use next, or 'complete' if the task is done"
}}

## Available Tools
{tools_description}

## Rules
1. Think carefully before acting
2. Use tools when you need external data or actions
3. Set confidence to 0.9+ only when you're certain the task is complete
4. If a tool fails, analyze why and try an alternative approach
5. Always respond in the same language as the user's input

## Current Context
{context}
"""

    def __init__(
        self,
        agent_id: str,
        openai_api_key: Optional[str] = None,
        tools: 'ToolRegistry' = None,
        quality_agent: Optional['QualityAgent'] = None,
        model: str = "gpt-4o",
        max_iterations: int = 10,
        quality_threshold: float = 0.7,
        enable_streaming: bool = True,
        verbose: bool = True,
        on_thought: Optional[Callable[[str], None]] = None,
        on_action: Optional[Callable[[Action], None]] = None,
        on_observation: Optional[Callable[[Observation], None]] = None,
        on_state_change: Optional[Callable[[AgentState], None]] = None,
    ):
        self.agent_id = agent_id
        self.tools = tools
        self.quality_agent = quality_agent
        self.max_iterations = max_iterations
        self.quality_threshold = quality_threshold
        self.enable_streaming = enable_streaming
        self.verbose = verbose

        # Callbacks
        self.on_thought = on_thought
        self.on_action = on_action
        self.on_observation = on_observation
        self.on_state_change = on_state_change

        # State management
        self.state = AgentState.IDLE
        self.memory = AgentMemory()
        self.execution_history: List[Dict] = []
        self.current_task_id: Optional[str] = None

        # LLM Interface 초기화
        self.llm = AgentLLMInterface(
            api_key=openai_api_key,
            model=model,
            quality_agent=quality_agent,
            on_thought=self._handle_thought_stream,
            on_tool_call=self._handle_tool_call_stream,
            on_error=self._handle_llm_error,
            enable_streaming=enable_streaming,
            verbose=verbose
        )

        # Error Recovery
        self.error_handler = ErrorRecoveryHandler(quality_agent)

    async def execute(self, task: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        메인 실행 루프 - ReAct 패턴 구현
        """
        self.current_task_id = str(uuid.uuid4())[:12]
        self._set_state(AgentState.THINKING)

        # Initialize working context
        self.memory.working_context = {
            "task": task,
            "context": context or {},
            "iterations": 0,
            "start_time": datetime.now().isoformat()
        }

        # 대화 이력 초기화
        self.memory.conversation_history = []

        self._log(f"🎯 Task Started: {task}")

        final_result = None

        for iteration in range(self.max_iterations):
            self.memory.working_context["iterations"] = iteration + 1
            self._log(f"\n--- Iteration {iteration + 1}/{self.max_iterations} ---")

            try:
                # 1. THOUGHT: 추론 단계 (스트리밍)
                self._set_state(AgentState.THINKING)
                thought = await self._think(task, iteration)
                self._log(f"💭 Confidence: {thought.confidence:.2f}")

                # Check if task is complete
                if self._is_task_complete(thought):
                    self._log("✅ Agent determined task is complete")
                    final_result = thought.reasoning
                    break

                # 2. ACTION: 행동 단계
                self._set_state(AgentState.ACTING)
                action = await self._decide_action(thought)

                if action is None:
                    self._log("⚠️ No action decided, continuing to next iteration")
                    continue

                self._log(f"⚡ Action: {action.tool_name}({json.dumps(action.parameters)[:80]}...)")

                if self.on_action:
                    self.on_action(action)

                # 3. OBSERVATION: 관찰 단계
                self._set_state(AgentState.OBSERVING)
                observation = await self._execute_action(action)
                self._log(f"👁️ Observation: success={observation.success}")

                if self.on_observation:
                    self.on_observation(observation)

                # Record in memory
                self.memory.add_to_short_term({
                    "thought": thought.to_dict(),
                    "action": action.to_dict(),
                    "observation": observation.to_dict()
                })

                # 대화 이력에 결과 추가
                self.memory.add_message(
                    MessageRole.USER,
                    f"Tool '{action.tool_name}' returned: {json.dumps(observation.result)[:500]}"
                )

                # 4. FEEDBACK: 자기 비판 단계 (품질 검수 에이전트 활성화시)
                if self.quality_agent and observation.success:
                    self._set_state(AgentState.REVIEWING)
                    feedback = await self._review(thought, action, observation)
                    self._log(f"🔍 Quality Score: {feedback.quality_score:.2f}")

                    if feedback.should_retry and feedback.quality_score < self.quality_threshold:
                        self._log(f"🔄 Retry triggered: {feedback.issues}")
                        self.memory.working_context["retry_context"] = feedback.retry_modifications
                        continue

                # Update final result
                if observation.success:
                    final_result = observation.result

            except LLMError as e:
                self._log(f"❌ LLM Error: {e}")
                recovery = await self.error_handler.handle_error(
                    e, {"task": task, "iteration": iteration}
                )

                if recovery.should_retry:
                    if recovery.strategy == "wait_and_retry":
                        self._log(f"⏳ Waiting {recovery.modifications.get('wait_seconds', 60)}s...")
                        await asyncio.sleep(recovery.modifications.get("wait_seconds", 60))
                    continue
                else:
                    self._set_state(AgentState.FAILED)
                    return self._build_response(success=False, error=str(e))

            except Exception as e:
                self._log(f"❌ Error in iteration {iteration + 1}: {str(e)}")
                self._set_state(AgentState.FAILED)
                return self._build_response(success=False, error=str(e))

        self._set_state(AgentState.COMPLETED)
        return self._build_response(success=True, result=final_result)

    async def execute_streaming(
        self,
        task: str,
        context: Optional[Dict] = None
    ) -> AsyncGenerator[Dict, None]:
        """
        스트리밍 실행 - 실시간으로 상태와 결과를 yield

        Usage:
            async for update in controller.execute_streaming("태스크"):
                print(update)
        """
        self.current_task_id = str(uuid.uuid4())[:12]

        yield {"type": "start", "task_id": self.current_task_id, "task": task}

        self.memory.working_context = {
            "task": task,
            "context": context or {},
            "iterations": 0,
            "start_time": datetime.now().isoformat()
        }

        for iteration in range(self.max_iterations):
            self.memory.working_context["iterations"] = iteration + 1

            yield {"type": "iteration_start", "iteration": iteration + 1}

            # THOUGHT (streaming)
            self._set_state(AgentState.THINKING)
            yield {"type": "state", "state": "thinking"}

            thought_content = ""
            async for chunk in self._think_streaming(task, iteration):
                thought_content += chunk
                yield {"type": "thought_chunk", "content": chunk}

            thought = ThoughtProcess.from_llm_response(thought_content)
            yield {"type": "thought_complete", "thought": thought.to_dict()}

            if self._is_task_complete(thought):
                yield {"type": "complete", "result": thought.reasoning}
                return

            # ACTION
            self._set_state(AgentState.ACTING)
            yield {"type": "state", "state": "acting"}

            action = await self._decide_action(thought)
            if action:
                yield {"type": "action", "action": action.to_dict()}

                # OBSERVATION
                self._set_state(AgentState.OBSERVING)
                yield {"type": "state", "state": "observing"}

                observation = await self._execute_action(action)
                yield {"type": "observation", "observation": observation.to_dict()}

        yield {"type": "max_iterations", "iterations": self.max_iterations}

    async def _think(self, task: str, iteration: int) -> ThoughtProcess:
        """추론 단계: 현재 상황 분석 및 다음 행동 계획"""
        # Build context
        recent_context = self.memory.get_relevant_context(task, limit=5)
        retry_context = self.memory.working_context.get("retry_context")

        # Build system prompt with tools
        tools_desc = self._get_tools_description()
        context_str = json.dumps(recent_context[-3:], indent=2) if recent_context else "None"

        system_prompt = self.SYSTEM_PROMPT.format(
            agent_id=self.agent_id,
            tools_description=tools_desc,
            context=context_str
        )

        # Build user message
        user_message = f"Task: {task}\n\nIteration: {iteration + 1}"
        if retry_context:
            user_message += f"\n\nPrevious attempt needs improvement:\n{json.dumps(retry_context, indent=2)}"

        # Prepare messages
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=system_prompt),
            *self.memory.get_conversation_context(),
            ChatMessage(role=MessageRole.USER, content=user_message)
        ]

        # Get tool schemas
        tool_schemas = self.tools.get_tool_descriptions() if self.tools else []

        # Call LLM
        response = await self.llm.think_with_tools(
            user_message,
            tool_schemas,
            context=messages[:-1]  # Exclude the last user message (already in task)
        )

        # Parse response
        thought = ThoughtProcess.from_llm_response(response.content or "")

        # 대화 이력에 추가
        self.memory.add_message(MessageRole.USER, user_message)
        self.memory.add_message(MessageRole.ASSISTANT, response.content or "")

        return thought

    async def _think_streaming(
        self,
        task: str,
        iteration: int
    ) -> AsyncGenerator[str, None]:
        """스트리밍 추론"""
        tools_desc = self._get_tools_description()
        recent_context = self.memory.get_relevant_context(task, limit=3)
        context_str = json.dumps(recent_context, indent=2) if recent_context else "None"

        system_prompt = self.SYSTEM_PROMPT.format(
            agent_id=self.agent_id,
            tools_description=tools_desc,
            context=context_str
        )

        user_message = f"Task: {task}\n\nIteration: {iteration + 1}"

        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=system_prompt),
            ChatMessage(role=MessageRole.USER, content=user_message)
        ]

        tool_schemas = self.tools.get_tool_descriptions() if self.tools else []

        async for chunk in self.llm.provider.chat_stream(messages, tool_schemas):
            if chunk.content:
                yield chunk.content

    async def _decide_action(self, thought: ThoughtProcess) -> Optional[Action]:
        """행동 결정: 사용할 도구와 파라미터 선택"""
        # LLM이 tool_call을 반환한 경우
        # (현재 구조에서는 thought의 next_action을 기반으로 결정)

        if thought.next_action == "complete" or thought.confidence >= 0.9:
            return None

        if not thought.next_action or not self.tools:
            return None

        # next_action에서 도구 이름 추출
        tool_name = thought.next_action.strip()
        tool = self.tools.get_tool(tool_name)

        if not tool:
            # 계획에서 도구 추출 시도
            for step in thought.plan:
                for available_tool in self.tools.list_tools():
                    if available_tool.lower() in step.lower():
                        tool = self.tools.get_tool(available_tool)
                        tool_name = available_tool
                        break
                if tool:
                    break

        if not tool:
            return None

        # LLM에게 파라미터 결정 요청
        param_prompt = f"""Based on the task and your reasoning, provide parameters for the tool '{tool_name}'.

Your reasoning: {thought.reasoning}

Tool schema: {json.dumps(tool.get_schema())}

Respond with ONLY a JSON object containing the parameters:
{{"param1": "value1", "param2": "value2"}}"""

        messages = [
            ChatMessage(role=MessageRole.USER, content=param_prompt)
        ]

        response = await self.llm.provider.chat(messages)

        try:
            parameters = json.loads(response.content or "{}")
        except json.JSONDecodeError:
            parameters = {}

        return Action(
            tool_name=tool_name,
            parameters=parameters,
            expected_outcome=thought.plan[0] if thought.plan else ""
        )

    async def _execute_action(self, action: Action) -> Observation:
        """행동 실행: 선택된 도구 실행 및 결과 수집"""
        start_time = datetime.now()

        try:
            tool = self.tools.get_tool(action.tool_name)
            if tool is None:
                return Observation(
                    action_id=action.action_id,
                    success=False,
                    result=None,
                    error=f"Tool '{action.tool_name}' not found"
                )

            result = await tool.execute(**action.parameters)
            execution_time = (datetime.now() - start_time).total_seconds() * 1000

            return Observation(
                action_id=action.action_id,
                success=True,
                result=result,
                execution_time_ms=execution_time
            )

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            return Observation(
                action_id=action.action_id,
                success=False,
                result=None,
                error=str(e),
                execution_time_ms=execution_time
            )

    async def _review(
        self,
        thought: ThoughtProcess,
        action: Action,
        observation: Observation
    ) -> Feedback:
        """품질 검수: 결과물 품질 평가 및 개선점 도출"""
        if self.quality_agent is None:
            return Feedback(
                quality_score=1.0,
                issues=[],
                suggestions=[],
                should_retry=False
            )

        return await self.quality_agent.review(
            task=self.memory.working_context.get("task", ""),
            thought=thought,
            action=action,
            observation=observation
        )

    def _is_task_complete(self, thought: ThoughtProcess) -> bool:
        """태스크 완료 여부 판단"""
        if thought.confidence >= 0.9:
            return True

        if thought.next_action and thought.next_action.lower() == "complete":
            return True

        plan_text = " ".join(thought.plan).lower()
        if any(word in plan_text for word in ["complete", "done", "finished", "완료"]):
            if thought.confidence >= 0.8:
                return True

        return False

    def _get_tools_description(self) -> str:
        """도구 설명 문자열 생성"""
        if not self.tools:
            return "No tools available"

        descriptions = []
        for schema in self.tools.get_tool_descriptions():
            params = schema.get("parameters", {}).get("properties", {})
            param_str = ", ".join(f"{k}: {v.get('type', 'any')}" for k, v in params.items())
            descriptions.append(f"- {schema['name']}({param_str}): {schema['description']}")

        return "\n".join(descriptions)

    def _build_response(
        self,
        success: bool,
        result: Any = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """최종 응답 구성"""
        return {
            "task_id": self.current_task_id,
            "agent_id": self.agent_id,
            "success": success,
            "result": result,
            "error": error,
            "state": self.state.value,
            "iterations": self.memory.working_context.get("iterations", 0),
            "execution_history": self.execution_history[-10:],
            "usage_stats": self.llm.get_stats(),
            "timestamp": datetime.now().isoformat()
        }

    def _set_state(self, state: AgentState):
        """상태 변경"""
        self.state = state
        if self.on_state_change:
            self.on_state_change(state)

    def _handle_thought_stream(self, content: str):
        """스트리밍 Thought 핸들러"""
        if self.on_thought:
            self.on_thought(content)

    def _handle_tool_call_stream(self, tool_call: ToolCall):
        """스트리밍 Tool Call 핸들러"""
        self._log(f"🔧 Tool called: {tool_call.name}")

    def _handle_llm_error(self, error: LLMError):
        """LLM 에러 핸들러"""
        self._log(f"⚠️ LLM Error: {error.error_type} - {error}")

    def _log(self, message: str):
        """로깅 유틸리티"""
        if self.verbose:
            print(f"[{self.agent_id}] {message}")

    # --- State Management ---

    def pause(self):
        """실행 일시 정지"""
        self._set_state(AgentState.PAUSED)

    def resume(self):
        """실행 재개"""
        if self.state == AgentState.PAUSED:
            self._set_state(AgentState.THINKING)

    def get_state(self) -> Dict:
        """현재 상태 조회"""
        return {
            "agent_id": self.agent_id,
            "state": self.state.value,
            "current_task_id": self.current_task_id,
            "memory_size": len(self.memory.short_term),
            "working_context": self.memory.working_context,
            "usage_stats": self.llm.get_stats()
        }

    def get_usage_stats(self) -> Dict:
        """사용량 통계"""
        return self.llm.get_stats()
