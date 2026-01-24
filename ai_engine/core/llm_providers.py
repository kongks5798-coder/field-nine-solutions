# ---------------------------------------------------------
# Field Nine OS: LLM Providers
# OpenAI, Anthropic 등 LLM 연동 구현
# ---------------------------------------------------------

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import (
    Any, AsyncGenerator, Callable, Dict, List,
    Optional, Union, Literal, TypedDict
)
from enum import Enum
import asyncio
import json
import time
import logging

# OpenAI SDK >= 1.0.0
from openai import AsyncOpenAI, OpenAI, APIError, RateLimitError, APITimeoutError
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionChunk,
    ChatCompletionMessage,
    ChatCompletionMessageToolCall,
)
from openai.types.chat.chat_completion_message_tool_call import Function

logger = logging.getLogger(__name__)


# ============================================================
# Type Definitions
# ============================================================

class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass
class ChatMessage:
    """채팅 메시지"""
    role: MessageRole
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None


@dataclass
class ToolCall:
    """도구 호출 요청"""
    id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class LLMResponse:
    """LLM 응답"""
    content: Optional[str]
    tool_calls: List[ToolCall]
    finish_reason: str
    usage: Dict[str, int]
    model: str
    raw_response: Any = None


@dataclass
class StreamChunk:
    """스트리밍 청크"""
    content: str
    is_complete: bool = False
    tool_calls: Optional[List[ToolCall]] = None
    finish_reason: Optional[str] = None


class LLMError(Exception):
    """LLM 관련 에러 기본 클래스"""
    def __init__(self, message: str, error_type: str, retryable: bool = False):
        super().__init__(message)
        self.error_type = error_type
        self.retryable = retryable


class TokenLimitError(LLMError):
    """토큰 한도 초과 에러"""
    def __init__(self, message: str, used_tokens: int = 0, max_tokens: int = 0):
        super().__init__(message, "token_limit", retryable=True)
        self.used_tokens = used_tokens
        self.max_tokens = max_tokens


class RateLimitException(LLMError):
    """Rate Limit 에러"""
    def __init__(self, message: str, retry_after: float = 60.0):
        super().__init__(message, "rate_limit", retryable=True)
        self.retry_after = retry_after


# ============================================================
# Abstract LLM Provider
# ============================================================

class LLMProvider(ABC):
    """LLM Provider 추상 클래스"""

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> LLMResponse:
        """채팅 완성 API 호출"""
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """스트리밍 채팅 API 호출"""
        pass

    @abstractmethod
    def convert_tool_schema(self, tool_schema: Dict) -> Dict:
        """도구 스키마를 해당 LLM 형식으로 변환"""
        pass


# ============================================================
# OpenAI Provider
# ============================================================

class OpenAIProvider(LLMProvider):
    """
    OpenAI API Provider (GPT-4o)

    Features:
    - Function Calling 지원
    - 스트리밍 지원
    - 자동 재시도 (Rate Limit, Timeout)
    - 토큰 사용량 추적
    - 에러 핸들링 & QualityAgent 연동

    Usage:
        provider = OpenAIProvider(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o",
            max_retries=3
        )

        response = await provider.chat([
            ChatMessage(role=MessageRole.USER, content="Hello")
        ])
    """

    # 모델별 토큰 한도
    MODEL_TOKEN_LIMITS = {
        "gpt-4o": 128000,
        "gpt-4o-mini": 128000,
        "gpt-4-turbo": 128000,
        "gpt-4": 8192,
        "gpt-3.5-turbo": 16385,
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        timeout: float = 60.0,
        on_token_usage: Optional[Callable[[Dict], None]] = None,
        on_error: Optional[Callable[[LLMError], None]] = None,
        on_stream_chunk: Optional[Callable[[str], None]] = None,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.timeout = timeout

        # Callbacks
        self.on_token_usage = on_token_usage
        self.on_error = on_error
        self.on_stream_chunk = on_stream_chunk

        # Token tracking
        self.total_tokens_used = 0
        self.session_cost = 0.0

        # Initialize client
        self.client = AsyncOpenAI(
            api_key=api_key,
            timeout=timeout,
            max_retries=0  # 직접 재시도 로직 구현
        )

        # Sync client for non-async contexts
        self._sync_client = OpenAI(
            api_key=api_key,
            timeout=timeout,
            max_retries=0
        )

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        채팅 완성 API 호출

        Args:
            messages: 채팅 메시지 리스트
            tools: 사용 가능한 도구 스키마 리스트
            **kwargs: 추가 파라미터 (temperature, max_tokens 등)

        Returns:
            LLMResponse: 응답 객체

        Raises:
            TokenLimitError: 토큰 한도 초과
            RateLimitException: Rate Limit 초과
            LLMError: 기타 API 에러
        """
        formatted_messages = self._format_messages(messages)
        formatted_tools = [self.convert_tool_schema(t) for t in tools] if tools else None

        request_params = {
            "model": kwargs.get("model", self.model),
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", self.temperature),
        }

        if self.max_tokens or kwargs.get("max_tokens"):
            request_params["max_tokens"] = kwargs.get("max_tokens", self.max_tokens)

        if formatted_tools:
            request_params["tools"] = formatted_tools
            request_params["tool_choice"] = kwargs.get("tool_choice", "auto")

        # 재시도 로직
        last_error = None
        for attempt in range(self.max_retries + 1):
            try:
                response = await self.client.chat.completions.create(**request_params)
                return self._parse_response(response)

            except RateLimitError as e:
                last_error = RateLimitException(
                    str(e),
                    retry_after=self._extract_retry_after(e)
                )
                if self.on_error:
                    self.on_error(last_error)

                if attempt < self.max_retries:
                    wait_time = last_error.retry_after * (attempt + 1)
                    logger.warning(f"Rate limit hit. Waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                    continue

            except APITimeoutError as e:
                last_error = LLMError(str(e), "timeout", retryable=True)
                if self.on_error:
                    self.on_error(last_error)

                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                    continue

            except APIError as e:
                # 토큰 한도 초과 체크
                if "maximum context length" in str(e).lower():
                    last_error = TokenLimitError(
                        str(e),
                        used_tokens=self._estimate_tokens(formatted_messages),
                        max_tokens=self.MODEL_TOKEN_LIMITS.get(self.model, 0)
                    )
                else:
                    last_error = LLMError(str(e), "api_error", retryable=False)

                if self.on_error:
                    self.on_error(last_error)

                if not last_error.retryable:
                    raise last_error

                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                    continue

            except Exception as e:
                last_error = LLMError(str(e), "unknown", retryable=False)
                if self.on_error:
                    self.on_error(last_error)
                raise last_error

        raise last_error

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        스트리밍 채팅 API 호출

        보스에게 실시간으로 Thought 과정을 보여주기 위한 스트리밍

        Usage:
            async for chunk in provider.chat_stream(messages):
                print(chunk.content, end="", flush=True)
                if chunk.is_complete:
                    print()  # 줄바꿈
        """
        formatted_messages = self._format_messages(messages)
        formatted_tools = [self.convert_tool_schema(t) for t in tools] if tools else None

        request_params = {
            "model": kwargs.get("model", self.model),
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", self.temperature),
            "stream": True,
        }

        if self.max_tokens or kwargs.get("max_tokens"):
            request_params["max_tokens"] = kwargs.get("max_tokens", self.max_tokens)

        if formatted_tools:
            request_params["tools"] = formatted_tools
            request_params["tool_choice"] = kwargs.get("tool_choice", "auto")

        try:
            stream = await self.client.chat.completions.create(**request_params)

            collected_content = ""
            collected_tool_calls: Dict[int, Dict] = {}

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

                if delta and delta.content:
                    collected_content += delta.content

                    # 콜백 호출
                    if self.on_stream_chunk:
                        self.on_stream_chunk(delta.content)

                    yield StreamChunk(
                        content=delta.content,
                        is_complete=False
                    )

                # Tool calls 수집
                if delta and delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in collected_tool_calls:
                            collected_tool_calls[idx] = {
                                "id": tc.id or "",
                                "name": tc.function.name if tc.function else "",
                                "arguments": ""
                            }
                        if tc.function and tc.function.arguments:
                            collected_tool_calls[idx]["arguments"] += tc.function.arguments

                # 완료 체크
                if finish_reason:
                    tool_calls = []
                    for tc_data in collected_tool_calls.values():
                        try:
                            args = json.loads(tc_data["arguments"]) if tc_data["arguments"] else {}
                        except json.JSONDecodeError:
                            args = {}

                        tool_calls.append(ToolCall(
                            id=tc_data["id"],
                            name=tc_data["name"],
                            arguments=args
                        ))

                    yield StreamChunk(
                        content="",
                        is_complete=True,
                        tool_calls=tool_calls if tool_calls else None,
                        finish_reason=finish_reason
                    )

        except RateLimitError as e:
            error = RateLimitException(str(e), retry_after=self._extract_retry_after(e))
            if self.on_error:
                self.on_error(error)
            raise error

        except APIError as e:
            error = LLMError(str(e), "api_error", retryable=False)
            if self.on_error:
                self.on_error(error)
            raise error

    def convert_tool_schema(self, tool_schema: Dict) -> Dict:
        """
        도구 스키마를 OpenAI Function Calling 형식으로 변환

        Input format (from tool_interface.py):
            {
                "name": "web_search",
                "description": "Search the web",
                "parameters": {
                    "type": "object",
                    "properties": {...},
                    "required": [...]
                }
            }

        Output format (OpenAI tools):
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the web",
                    "parameters": {...}
                }
            }
        """
        return {
            "type": "function",
            "function": {
                "name": tool_schema.get("name", ""),
                "description": tool_schema.get("description", ""),
                "parameters": tool_schema.get("parameters", {
                    "type": "object",
                    "properties": {},
                    "required": []
                })
            }
        }

    def _format_messages(self, messages: List[ChatMessage]) -> List[Dict]:
        """메시지를 OpenAI API 형식으로 변환"""
        formatted = []

        for msg in messages:
            message_dict = {
                "role": msg.role.value if isinstance(msg.role, MessageRole) else msg.role,
                "content": msg.content
            }

            if msg.name:
                message_dict["name"] = msg.name

            if msg.tool_calls:
                message_dict["tool_calls"] = msg.tool_calls

            if msg.tool_call_id:
                message_dict["tool_call_id"] = msg.tool_call_id

            formatted.append(message_dict)

        return formatted

    def _parse_response(self, response: ChatCompletion) -> LLMResponse:
        """API 응답 파싱"""
        message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        # Tool calls 파싱
        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                try:
                    args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                except json.JSONDecodeError:
                    args = {}

                tool_calls.append(ToolCall(
                    id=tc.id,
                    name=tc.function.name,
                    arguments=args
                ))

        # Usage 추적
        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        }

        self.total_tokens_used += usage["total_tokens"]
        self._update_cost(usage)

        if self.on_token_usage:
            self.on_token_usage(usage)

        return LLMResponse(
            content=message.content,
            tool_calls=tool_calls,
            finish_reason=finish_reason,
            usage=usage,
            model=response.model,
            raw_response=response
        )

    def _extract_retry_after(self, error: RateLimitError) -> float:
        """Rate Limit 에러에서 retry-after 추출"""
        # OpenAI 에러 메시지에서 추출 시도
        error_str = str(error)
        if "Please retry after" in error_str:
            try:
                import re
                match = re.search(r"retry after (\d+)", error_str)
                if match:
                    return float(match.group(1))
            except:
                pass
        return 60.0  # 기본 60초

    def _estimate_tokens(self, messages: List[Dict]) -> int:
        """메시지 토큰 수 추정 (대략적)"""
        total_chars = sum(
            len(str(m.get("content", ""))) for m in messages
        )
        return total_chars // 4  # 대략 4자당 1토큰

    def _update_cost(self, usage: Dict):
        """비용 계산 (GPT-4o 기준)"""
        # GPT-4o 가격 (2024년 기준, 변경될 수 있음)
        input_cost_per_1k = 0.005  # $5 per 1M input tokens
        output_cost_per_1k = 0.015  # $15 per 1M output tokens

        input_cost = (usage.get("prompt_tokens", 0) / 1000) * input_cost_per_1k
        output_cost = (usage.get("completion_tokens", 0) / 1000) * output_cost_per_1k

        self.session_cost += input_cost + output_cost

    def get_usage_stats(self) -> Dict:
        """사용량 통계 반환"""
        return {
            "total_tokens": self.total_tokens_used,
            "estimated_cost_usd": round(self.session_cost, 4),
            "model": self.model
        }

    def reset_usage_stats(self):
        """사용량 통계 초기화"""
        self.total_tokens_used = 0
        self.session_cost = 0.0


# ============================================================
# Streaming Thought Display
# ============================================================

class ThoughtStreamer:
    """
    에이전트 Thought 과정 실시간 표시

    보스에게 에이전트가 무슨 생각을 하고 있는지 실시간으로 보여줌

    Usage:
        streamer = ThoughtStreamer(
            on_chunk=lambda c: print(c, end=""),
            on_complete=lambda full: save_to_log(full)
        )

        async for chunk in provider.chat_stream(messages):
            streamer.process(chunk)
    """

    def __init__(
        self,
        on_chunk: Optional[Callable[[str], None]] = None,
        on_complete: Optional[Callable[[str], None]] = None,
        on_tool_call: Optional[Callable[[ToolCall], None]] = None,
        prefix: str = "💭 ",
        show_timestamp: bool = True
    ):
        self.on_chunk = on_chunk
        self.on_complete = on_complete
        self.on_tool_call = on_tool_call
        self.prefix = prefix
        self.show_timestamp = show_timestamp

        self.collected_content = ""
        self._started = False

    def process(self, chunk: StreamChunk) -> str:
        """청크 처리 및 표시"""
        if not self._started and chunk.content:
            self._started = True
            if self.show_timestamp:
                timestamp = time.strftime("%H:%M:%S")
                header = f"\n[{timestamp}] {self.prefix}"
            else:
                header = f"\n{self.prefix}"

            if self.on_chunk:
                self.on_chunk(header)

        if chunk.content:
            self.collected_content += chunk.content
            if self.on_chunk:
                self.on_chunk(chunk.content)

        if chunk.is_complete:
            self._started = False

            if self.on_complete:
                self.on_complete(self.collected_content)

            if chunk.tool_calls and self.on_tool_call:
                for tc in chunk.tool_calls:
                    self.on_tool_call(tc)

            result = self.collected_content
            self.collected_content = ""
            return result

        return ""

    def reset(self):
        """상태 초기화"""
        self.collected_content = ""
        self._started = False


# ============================================================
# Error Recovery Handler
# ============================================================

class ErrorRecoveryHandler:
    """
    에러 복구 핸들러

    API 에러 발생 시 QualityAgent와 연동하여 복구 전략 결정

    Usage:
        handler = ErrorRecoveryHandler(quality_agent)
        recovery = await handler.handle_error(error, context)
        if recovery.should_retry:
            # 재시도 로직
    """

    def __init__(self, quality_agent: Optional['QualityAgent'] = None):
        self.quality_agent = quality_agent
        self.error_history: List[Dict] = []

    async def handle_error(
        self,
        error: LLMError,
        context: Dict
    ) -> 'RecoveryDecision':
        """에러 처리 및 복구 결정"""
        self.error_history.append({
            "error_type": error.error_type,
            "message": str(error),
            "timestamp": time.time(),
            "context": context
        })

        # 기본 복구 전략
        decision = RecoveryDecision(
            should_retry=error.retryable,
            strategy="default",
            modifications={}
        )

        if isinstance(error, TokenLimitError):
            decision = self._handle_token_limit(error, context)

        elif isinstance(error, RateLimitException):
            decision = self._handle_rate_limit(error, context)

        # QualityAgent에게 보고
        if self.quality_agent:
            await self._report_to_quality_agent(error, decision)

        return decision

    def _handle_token_limit(
        self,
        error: TokenLimitError,
        context: Dict
    ) -> 'RecoveryDecision':
        """토큰 한도 초과 처리"""
        return RecoveryDecision(
            should_retry=True,
            strategy="reduce_context",
            modifications={
                "action": "truncate_history",
                "keep_last_n": 5,
                "summarize_old": True,
                "reason": f"Token limit exceeded: {error.used_tokens}/{error.max_tokens}"
            }
        )

    def _handle_rate_limit(
        self,
        error: RateLimitException,
        context: Dict
    ) -> 'RecoveryDecision':
        """Rate Limit 처리"""
        return RecoveryDecision(
            should_retry=True,
            strategy="wait_and_retry",
            modifications={
                "action": "delay",
                "wait_seconds": error.retry_after,
                "reason": "Rate limit exceeded"
            }
        )

    async def _report_to_quality_agent(
        self,
        error: LLMError,
        decision: 'RecoveryDecision'
    ):
        """QualityAgent에게 에러 보고"""
        if not self.quality_agent:
            return

        # QualityAgent의 커스텀 규칙으로 에러 처리 결과 기록
        report = {
            "error_type": error.error_type,
            "recovery_strategy": decision.strategy,
            "will_retry": decision.should_retry,
            "error_count": len(self.error_history)
        }

        logger.info(f"Error reported to QualityAgent: {report}")

    def get_error_stats(self) -> Dict:
        """에러 통계 반환"""
        if not self.error_history:
            return {"total_errors": 0}

        error_types = {}
        for err in self.error_history:
            err_type = err["error_type"]
            error_types[err_type] = error_types.get(err_type, 0) + 1

        return {
            "total_errors": len(self.error_history),
            "by_type": error_types,
            "last_error": self.error_history[-1] if self.error_history else None
        }


@dataclass
class RecoveryDecision:
    """복구 결정"""
    should_retry: bool
    strategy: str
    modifications: Dict[str, Any]
    wait_seconds: float = 0.0


# ============================================================
# Integrated Agent LLM Interface
# ============================================================

class AgentLLMInterface:
    """
    에이전트용 통합 LLM 인터페이스

    OpenAIProvider + ErrorRecovery + Streaming을 통합

    Usage:
        llm = AgentLLMInterface(
            api_key=os.getenv("OPENAI_API_KEY"),
            on_thought=lambda t: print(f"💭 {t}")
        )

        # 일반 호출
        response = await llm.think("태스크 분석")

        # 도구 호출과 함께
        response = await llm.think_with_tools("검색 필요", tools)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        quality_agent: Optional['QualityAgent'] = None,
        on_thought: Optional[Callable[[str], None]] = None,
        on_tool_call: Optional[Callable[[ToolCall], None]] = None,
        on_error: Optional[Callable[[LLMError], None]] = None,
        enable_streaming: bool = True,
        verbose: bool = True
    ):
        self.enable_streaming = enable_streaming
        self.verbose = verbose
        self.on_thought = on_thought
        self.on_tool_call = on_tool_call

        # Provider 초기화
        self.provider = OpenAIProvider(
            api_key=api_key,
            model=model,
            on_error=on_error,
            on_stream_chunk=self._handle_stream_chunk if enable_streaming else None
        )

        # Error Recovery
        self.error_handler = ErrorRecoveryHandler(quality_agent)

        # Thought Streamer
        self.thought_streamer = ThoughtStreamer(
            on_chunk=self._handle_thought_chunk,
            on_complete=self._handle_thought_complete,
            on_tool_call=on_tool_call
        )

        # 시스템 프롬프트
        self.system_prompt = """You are an autonomous AI agent operating within the Field Nine OS.
Your task is to reason step-by-step and execute actions using available tools.

When thinking, always structure your response as JSON:
{
    "reasoning": "Your step-by-step analysis",
    "confidence": 0.0-1.0,
    "plan": ["step1", "step2", ...],
    "next_action": "The tool to use next or 'complete' if done"
}

Always think in Korean when the task is in Korean."""

    async def think(
        self,
        task: str,
        context: Optional[List[ChatMessage]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        단순 추론 (도구 없이)

        Args:
            task: 수행할 태스크
            context: 이전 대화 컨텍스트
        """
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=self.system_prompt),
        ]

        if context:
            messages.extend(context)

        messages.append(ChatMessage(role=MessageRole.USER, content=task))

        if self.enable_streaming:
            return await self._stream_response(messages)
        else:
            return await self.provider.chat(messages)

    async def think_with_tools(
        self,
        task: str,
        tools: List[Dict],
        context: Optional[List[ChatMessage]] = None,
        **kwargs
    ) -> LLMResponse:
        """
        도구와 함께 추론

        Args:
            task: 수행할 태스크
            tools: 사용 가능한 도구 스키마
            context: 이전 대화 컨텍스트
        """
        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=self.system_prompt),
        ]

        if context:
            messages.extend(context)

        messages.append(ChatMessage(role=MessageRole.USER, content=task))

        try:
            if self.enable_streaming:
                return await self._stream_response(messages, tools)
            else:
                return await self.provider.chat(messages, tools)

        except LLMError as e:
            # 에러 복구 시도
            recovery = await self.error_handler.handle_error(e, {"task": task})

            if recovery.should_retry:
                if recovery.strategy == "reduce_context":
                    # 컨텍스트 축소 후 재시도
                    reduced_context = context[-5:] if context else None
                    return await self.think_with_tools(task, tools, reduced_context)

                elif recovery.strategy == "wait_and_retry":
                    await asyncio.sleep(recovery.modifications.get("wait_seconds", 60))
                    return await self.think_with_tools(task, tools, context)

            raise

    async def _stream_response(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None
    ) -> LLMResponse:
        """스트리밍 응답 처리"""
        collected_content = ""
        final_tool_calls = []
        final_finish_reason = ""

        async for chunk in self.provider.chat_stream(messages, tools):
            self.thought_streamer.process(chunk)

            if chunk.content:
                collected_content += chunk.content

            if chunk.is_complete:
                if chunk.tool_calls:
                    final_tool_calls = chunk.tool_calls
                final_finish_reason = chunk.finish_reason or "stop"

        return LLMResponse(
            content=collected_content,
            tool_calls=final_tool_calls,
            finish_reason=final_finish_reason,
            usage={},  # 스트리밍에서는 usage 정보 없음
            model=self.provider.model
        )

    def _handle_stream_chunk(self, content: str):
        """스트리밍 청크 핸들러"""
        if self.verbose:
            print(content, end="", flush=True)

    def _handle_thought_chunk(self, content: str):
        """Thought 청크 핸들러"""
        if self.on_thought:
            self.on_thought(content)

    def _handle_thought_complete(self, full_thought: str):
        """Thought 완료 핸들러"""
        if self.verbose:
            print()  # 줄바꿈

    def get_stats(self) -> Dict:
        """통계 반환"""
        return {
            "usage": self.provider.get_usage_stats(),
            "errors": self.error_handler.get_error_stats()
        }
