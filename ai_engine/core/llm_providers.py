# Field Nine OS: LLM Providers
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Dict, List, Optional
from enum import Enum
import asyncio
import json

from openai import AsyncOpenAI, RateLimitError as OpenAIRateLimitError, APIError, APITimeoutError


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass
class ChatMessage:
    role: MessageRole
    content: str
    name: Optional[str] = None
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class LLMResponse:
    content: Optional[str]
    tool_calls: List[ToolCall]
    finish_reason: str
    usage: Dict[str, int]
    model: str


@dataclass
class StreamChunk:
    content: str
    is_complete: bool = False
    tool_calls: Optional[List[ToolCall]] = None
    finish_reason: Optional[str] = None


class LLMError(Exception):
    def __init__(self, message: str, error_type: str, retryable: bool = False):
        super().__init__(message)
        self.error_type = error_type
        self.retryable = retryable


class TokenLimitError(LLMError):
    def __init__(self, message: str, used_tokens: int = 0, max_tokens: int = 0):
        super().__init__(message, "token_limit", retryable=True)
        self.used_tokens = used_tokens
        self.max_tokens = max_tokens


class RateLimitException(LLMError):
    def __init__(self, message: str, retry_after: float = 60.0):
        super().__init__(message, "rate_limit", retryable=True)
        self.retry_after = retry_after


class OpenAIProvider:
    """OpenAI API Provider (GPT-4o)"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        max_retries: int = 3,
        on_stream_chunk: Optional[callable] = None,
        on_error: Optional[callable] = None,
    ):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.max_retries = max_retries
        self.on_stream_chunk = on_stream_chunk
        self.on_error = on_error
        self.total_tokens_used = 0
        self.session_cost = 0.0

        self.client = AsyncOpenAI(api_key=api_key, timeout=60.0, max_retries=0)

    async def chat(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> LLMResponse:
        formatted_messages = self._format_messages(messages)
        formatted_tools = [self.convert_tool_schema(t) for t in tools] if tools else None

        params = {
            "model": kwargs.get("model", self.model),
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", self.temperature),
        }

        if self.max_tokens:
            params["max_tokens"] = self.max_tokens
        if formatted_tools:
            params["tools"] = formatted_tools
            params["tool_choice"] = "auto"

        for attempt in range(self.max_retries + 1):
            try:
                response = await self.client.chat.completions.create(**params)
                return self._parse_response(response)
            except OpenAIRateLimitError as e:
                if attempt < self.max_retries:
                    await asyncio.sleep(60 * (attempt + 1))
                    continue
                raise RateLimitException(str(e))
            except APIError as e:
                if "context length" in str(e).lower():
                    raise TokenLimitError(str(e))
                raise LLMError(str(e), "api_error")

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        tools: Optional[List[Dict]] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        formatted_messages = self._format_messages(messages)
        formatted_tools = [self.convert_tool_schema(t) for t in tools] if tools else None

        params = {
            "model": kwargs.get("model", self.model),
            "messages": formatted_messages,
            "temperature": kwargs.get("temperature", self.temperature),
            "stream": True,
        }

        if formatted_tools:
            params["tools"] = formatted_tools

        stream = await self.client.chat.completions.create(**params)
        collected_tool_calls: Dict[int, Dict] = {}

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

            if delta and delta.content:
                if self.on_stream_chunk:
                    self.on_stream_chunk(delta.content)
                yield StreamChunk(content=delta.content, is_complete=False)

            if delta and delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in collected_tool_calls:
                        collected_tool_calls[idx] = {"id": tc.id or "", "name": tc.function.name if tc.function else "", "arguments": ""}
                    if tc.function and tc.function.arguments:
                        collected_tool_calls[idx]["arguments"] += tc.function.arguments

            if finish_reason:
                tool_calls = []
                for tc_data in collected_tool_calls.values():
                    try:
                        args = json.loads(tc_data["arguments"]) if tc_data["arguments"] else {}
                    except:
                        args = {}
                    tool_calls.append(ToolCall(id=tc_data["id"], name=tc_data["name"], arguments=args))
                yield StreamChunk(content="", is_complete=True, tool_calls=tool_calls if tool_calls else None, finish_reason=finish_reason)

    def convert_tool_schema(self, tool_schema: Dict) -> Dict:
        return {
            "type": "function",
            "function": {
                "name": tool_schema.get("name", ""),
                "description": tool_schema.get("description", ""),
                "parameters": tool_schema.get("parameters", {"type": "object", "properties": {}, "required": []})
            }
        }

    def _format_messages(self, messages: List[ChatMessage]) -> List[Dict]:
        formatted = []
        for msg in messages:
            d = {"role": msg.role.value if isinstance(msg.role, MessageRole) else msg.role, "content": msg.content}
            if msg.name:
                d["name"] = msg.name
            if msg.tool_calls:
                d["tool_calls"] = msg.tool_calls
            if msg.tool_call_id:
                d["tool_call_id"] = msg.tool_call_id
            formatted.append(d)
        return formatted

    def _parse_response(self, response) -> LLMResponse:
        message = response.choices[0].message
        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                try:
                    args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                except:
                    args = {}
                tool_calls.append(ToolCall(id=tc.id, name=tc.function.name, arguments=args))

        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        }
        self.total_tokens_used += usage["total_tokens"]

        return LLMResponse(
            content=message.content,
            tool_calls=tool_calls,
            finish_reason=response.choices[0].finish_reason,
            usage=usage,
            model=response.model
        )

    def get_usage_stats(self) -> Dict:
        return {"total_tokens": self.total_tokens_used, "estimated_cost_usd": round(self.session_cost, 4), "model": self.model}


class AgentLLMInterface:
    """에이전트용 통합 LLM 인터페이스"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        on_thought: Optional[callable] = None,
        on_error: Optional[callable] = None,
        enable_streaming: bool = True,
        verbose: bool = True
    ):
        self.enable_streaming = enable_streaming
        self.verbose = verbose
        self.on_thought = on_thought

        self.provider = OpenAIProvider(
            api_key=api_key,
            model=model,
            on_error=on_error,
            on_stream_chunk=lambda c: print(c, end="", flush=True) if enable_streaming and verbose else None
        )

        self.system_prompt = """You are an autonomous AI agent. Respond with JSON:
{"reasoning": "...", "confidence": 0.0-1.0, "plan": [...], "next_action": "tool_name or complete"}"""

    async def think(self, task: str, context: Optional[List[ChatMessage]] = None) -> LLMResponse:
        messages = [ChatMessage(role=MessageRole.SYSTEM, content=self.system_prompt)]
        if context:
            messages.extend(context)
        messages.append(ChatMessage(role=MessageRole.USER, content=task))

        if self.enable_streaming:
            return await self._stream_response(messages)
        return await self.provider.chat(messages)

    async def think_with_tools(self, task: str, tools: List[Dict], context: Optional[List[ChatMessage]] = None) -> LLMResponse:
        messages = [ChatMessage(role=MessageRole.SYSTEM, content=self.system_prompt)]
        if context:
            messages.extend(context)
        messages.append(ChatMessage(role=MessageRole.USER, content=task))

        if self.enable_streaming:
            return await self._stream_response(messages, tools)
        return await self.provider.chat(messages, tools)

    async def _stream_response(self, messages: List[ChatMessage], tools: Optional[List[Dict]] = None) -> LLMResponse:
        collected = ""
        final_tool_calls = []
        final_finish = ""

        async for chunk in self.provider.chat_stream(messages, tools):
            if chunk.content:
                collected += chunk.content
            if chunk.is_complete:
                if chunk.tool_calls:
                    final_tool_calls = chunk.tool_calls
                final_finish = chunk.finish_reason or "stop"

        return LLMResponse(content=collected, tool_calls=final_tool_calls, finish_reason=final_finish, usage={}, model=self.provider.model)

    def get_stats(self) -> Dict:
        return {"usage": self.provider.get_usage_stats(), "errors": {}}
