# ---------------------------------------------------------
# Field Nine OS: Tool Interface
# 에이전트가 사용할 도구들의 표준 인터페이스
# ---------------------------------------------------------

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable, Type
from enum import Enum
import asyncio
import aiohttp
import json


class ToolCategory(Enum):
    """도구 카테고리"""
    DATABASE = "database"
    WEB_SEARCH = "web_search"
    API_CALL = "api_call"
    FILE_SYSTEM = "file_system"
    COMPUTATION = "computation"
    COMMUNICATION = "communication"
    CUSTOM = "custom"


@dataclass
class ToolParameter:
    """도구 파라미터 정의"""
    name: str
    type: str  # "string", "number", "boolean", "object", "array"
    description: str
    required: bool = True
    default: Any = None
    enum: Optional[List[Any]] = None  # Allowed values


@dataclass
class ToolResult:
    """도구 실행 결과"""
    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class Tool(ABC):
    """
    도구 기본 추상 클래스

    모든 도구는 이 클래스를 상속받아 구현해야 함
    CrewAI/LangGraph 호환을 위한 표준 인터페이스
    """

    def __init__(self):
        self._name: str = ""
        self._description: str = ""
        self._category: ToolCategory = ToolCategory.CUSTOM
        self._parameters: List[ToolParameter] = []
        self._rate_limit: Optional[int] = None  # calls per minute
        self._call_count: int = 0

    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    @property
    def category(self) -> ToolCategory:
        return self._category

    @property
    def parameters(self) -> List[ToolParameter]:
        return self._parameters

    def get_schema(self) -> Dict:
        """OpenAI Function Calling 호환 스키마 반환"""
        return {
            "name": self._name,
            "description": self._description,
            "parameters": {
                "type": "object",
                "properties": {
                    p.name: {
                        "type": p.type,
                        "description": p.description,
                        **({"enum": p.enum} if p.enum else {}),
                        **({"default": p.default} if p.default is not None else {})
                    }
                    for p in self._parameters
                },
                "required": [p.name for p in self._parameters if p.required]
            }
        }

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """도구 실행 - 하위 클래스에서 구현"""
        pass

    def validate_params(self, **kwargs) -> bool:
        """파라미터 유효성 검사"""
        for param in self._parameters:
            if param.required and param.name not in kwargs:
                raise ValueError(f"Required parameter '{param.name}' is missing")
            if param.enum and param.name in kwargs:
                if kwargs[param.name] not in param.enum:
                    raise ValueError(
                        f"Parameter '{param.name}' must be one of {param.enum}"
                    )
        return True


class ToolRegistry:
    """
    도구 레지스트리

    에이전트가 사용할 수 있는 도구들을 관리
    """

    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        self._aliases: Dict[str, str] = {}

    def register(self, tool: Tool, aliases: Optional[List[str]] = None):
        """도구 등록"""
        self._tools[tool.name] = tool
        if aliases:
            for alias in aliases:
                self._aliases[alias] = tool.name

    def unregister(self, name: str):
        """도구 등록 해제"""
        if name in self._tools:
            del self._tools[name]
        # Remove aliases pointing to this tool
        self._aliases = {k: v for k, v in self._aliases.items() if v != name}

    def get_tool(self, name: str) -> Optional[Tool]:
        """도구 조회"""
        # Check aliases first
        actual_name = self._aliases.get(name, name)
        return self._tools.get(actual_name)

    def get_tool_descriptions(self) -> List[Dict]:
        """모든 도구 설명 반환 (LLM 프롬프트용)"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "category": tool.category.value,
                "parameters": tool.get_schema()["parameters"]
            }
            for tool in self._tools.values()
        ]

    def get_tools_by_category(self, category: ToolCategory) -> List[Tool]:
        """카테고리별 도구 조회"""
        return [t for t in self._tools.values() if t.category == category]

    def list_tools(self) -> List[str]:
        """등록된 도구 이름 목록"""
        return list(self._tools.keys())


# =============================================================
# 기본 내장 도구들
# =============================================================

class WebSearchTool(Tool):
    """웹 검색 도구 (Serper/Google API)"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self._name = "web_search"
        self._description = "Search the web for information using Google/Serper API"
        self._category = ToolCategory.WEB_SEARCH
        self._parameters = [
            ToolParameter("query", "string", "The search query"),
            ToolParameter("num_results", "number", "Number of results to return", required=False, default=5),
            ToolParameter("search_type", "string", "Type of search", required=False,
                         default="search", enum=["search", "news", "images"])
        ]
        self._api_key = api_key

    async def execute(self, query: str, num_results: int = 5, search_type: str = "search") -> Dict:
        self.validate_params(query=query, num_results=num_results, search_type=search_type)

        if not self._api_key:
            # Mock response for testing
            return {
                "results": [
                    {"title": f"Result {i} for: {query}", "url": f"https://example.com/{i}"}
                    for i in range(num_results)
                ],
                "source": "mock"
            }

        # Actual Serper API call
        async with aiohttp.ClientSession() as session:
            headers = {"X-API-KEY": self._api_key, "Content-Type": "application/json"}
            payload = {"q": query, "num": num_results}

            async with session.post(
                "https://google.serper.dev/search",
                headers=headers,
                json=payload
            ) as response:
                data = await response.json()
                return {"results": data.get("organic", []), "source": "serper"}


class DatabaseQueryTool(Tool):
    """데이터베이스 조회 도구 (Supabase)"""

    def __init__(self, supabase_client: Any = None):
        super().__init__()
        self._name = "database_query"
        self._description = "Query the Supabase database for business data"
        self._category = ToolCategory.DATABASE
        self._parameters = [
            ToolParameter("table", "string", "The table to query"),
            ToolParameter("select", "string", "Columns to select", required=False, default="*"),
            ToolParameter("filters", "object", "Filter conditions", required=False),
            ToolParameter("limit", "number", "Max number of rows", required=False, default=100)
        ]
        self._client = supabase_client

    async def execute(
        self,
        table: str,
        select: str = "*",
        filters: Optional[Dict] = None,
        limit: int = 100
    ) -> Dict:
        self.validate_params(table=table, select=select, limit=limit)

        if not self._client:
            # Mock response
            return {
                "data": [{"id": i, "table": table} for i in range(min(5, limit))],
                "count": 5,
                "source": "mock"
            }

        # Actual Supabase query
        query = self._client.table(table).select(select).limit(limit)

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        result = query.execute()
        return {"data": result.data, "count": len(result.data), "source": "supabase"}


class APICallTool(Tool):
    """외부 API 호출 도구"""

    def __init__(self):
        super().__init__()
        self._name = "api_call"
        self._description = "Make HTTP requests to external APIs"
        self._category = ToolCategory.API_CALL
        self._parameters = [
            ToolParameter("url", "string", "The API endpoint URL"),
            ToolParameter("method", "string", "HTTP method", required=False,
                         default="GET", enum=["GET", "POST", "PUT", "DELETE"]),
            ToolParameter("headers", "object", "Request headers", required=False),
            ToolParameter("body", "object", "Request body (for POST/PUT)", required=False),
            ToolParameter("timeout", "number", "Request timeout in seconds", required=False, default=30)
        ]

    async def execute(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[Dict] = None,
        body: Optional[Dict] = None,
        timeout: int = 30
    ) -> Dict:
        self.validate_params(url=url, method=method, timeout=timeout)

        async with aiohttp.ClientSession() as session:
            request_kwargs = {
                "headers": headers or {},
                "timeout": aiohttp.ClientTimeout(total=timeout)
            }

            if body and method in ["POST", "PUT"]:
                request_kwargs["json"] = body

            async with session.request(method, url, **request_kwargs) as response:
                try:
                    data = await response.json()
                except:
                    data = await response.text()

                return {
                    "status": response.status,
                    "data": data,
                    "headers": dict(response.headers)
                }


class ComputationTool(Tool):
    """계산 도구 (안전한 Python 표현식 실행)"""

    def __init__(self):
        super().__init__()
        self._name = "compute"
        self._description = "Perform mathematical calculations and data processing"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("operation", "string", "The operation type",
                         enum=["math", "statistics", "format"]),
            ToolParameter("expression", "string", "The expression or data to process"),
            ToolParameter("data", "array", "Input data array", required=False)
        ]

    async def execute(
        self,
        operation: str,
        expression: str,
        data: Optional[List] = None
    ) -> Dict:
        self.validate_params(operation=operation, expression=expression)

        if operation == "math":
            # Safe math evaluation
            allowed_names = {
                "abs": abs, "round": round, "min": min, "max": max,
                "sum": sum, "len": len, "pow": pow
            }
            try:
                result = eval(expression, {"__builtins__": {}}, allowed_names)
                return {"result": result, "type": type(result).__name__}
            except Exception as e:
                return {"error": str(e)}

        elif operation == "statistics":
            if not data:
                return {"error": "Data required for statistics"}
            import statistics
            return {
                "mean": statistics.mean(data),
                "median": statistics.median(data),
                "stdev": statistics.stdev(data) if len(data) > 1 else 0,
                "min": min(data),
                "max": max(data)
            }

        elif operation == "format":
            return {"formatted": expression.format(**(data[0] if data else {}))}

        return {"error": f"Unknown operation: {operation}"}


class NotificationTool(Tool):
    """알림 전송 도구 (Slack/Kakao/Email)"""

    def __init__(self, providers: Optional[Dict[str, Any]] = None):
        super().__init__()
        self._name = "notify"
        self._description = "Send notifications via various channels"
        self._category = ToolCategory.COMMUNICATION
        self._parameters = [
            ToolParameter("channel", "string", "Notification channel",
                         enum=["slack", "kakao", "email", "webhook"]),
            ToolParameter("message", "string", "The message to send"),
            ToolParameter("recipient", "string", "Recipient identifier", required=False),
            ToolParameter("metadata", "object", "Additional metadata", required=False)
        ]
        self._providers = providers or {}

    async def execute(
        self,
        channel: str,
        message: str,
        recipient: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        self.validate_params(channel=channel, message=message)

        # Mock implementation
        return {
            "sent": True,
            "channel": channel,
            "message_preview": message[:100],
            "timestamp": "2026-01-25T12:00:00Z"
        }


def create_default_registry(config: Optional[Dict] = None) -> ToolRegistry:
    """기본 도구 세트가 포함된 레지스트리 생성"""
    config = config or {}
    registry = ToolRegistry()

    # Register default tools
    registry.register(WebSearchTool(api_key=config.get("serper_api_key")), aliases=["search", "google"])
    registry.register(DatabaseQueryTool(supabase_client=config.get("supabase")), aliases=["db", "query"])
    registry.register(APICallTool(), aliases=["http", "request", "fetch"])
    registry.register(ComputationTool(), aliases=["calc", "math"])
    registry.register(NotificationTool(providers=config.get("notification_providers")), aliases=["alert", "send"])

    return registry
