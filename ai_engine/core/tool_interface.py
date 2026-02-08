# Field Nine OS: Tool Interface
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from enum import Enum
import aiohttp


class ToolCategory(Enum):
    DATABASE = "database"
    WEB_SEARCH = "web_search"
    API_CALL = "api_call"
    COMPUTATION = "computation"
    CUSTOM = "custom"


@dataclass
class ToolParameter:
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None


class Tool(ABC):
    def __init__(self):
        self._name = ""
        self._description = ""
        self._category = ToolCategory.CUSTOM
        self._parameters: List[ToolParameter] = []

    @property
    def name(self) -> str:
        return self._name

    def get_schema(self) -> Dict:
        return {
            "name": self._name,
            "description": self._description,
            "parameters": {
                "type": "object",
                "properties": {p.name: {"type": p.type, "description": p.description} for p in self._parameters},
                "required": [p.name for p in self._parameters if p.required]
            }
        }

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        pass


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        self._aliases: Dict[str, str] = {}

    def register(self, tool: Tool, aliases: Optional[List[str]] = None):
        self._tools[tool.name] = tool
        if aliases:
            for alias in aliases:
                self._aliases[alias] = tool.name

    def get_tool(self, name: str) -> Optional[Tool]:
        actual = self._aliases.get(name, name)
        return self._tools.get(actual)

    def get_tool_descriptions(self) -> List[Dict]:
        return [tool.get_schema() for tool in self._tools.values()]

    def list_tools(self) -> List[str]:
        return list(self._tools.keys())


# Default Tools
class WebSearchTool(Tool):
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self._name = "web_search"
        self._description = "Search the web for information"
        self._category = ToolCategory.WEB_SEARCH
        self._parameters = [
            ToolParameter("query", "string", "Search query"),
            ToolParameter("num_results", "number", "Number of results", False, 5)
        ]
        self._api_key = api_key

    async def execute(self, query: str, num_results: int = 5) -> Dict:
        return {"results": [{"title": f"Result for: {query}", "url": "https://example.com"}], "source": "mock"}


class ComputeTool(Tool):
    def __init__(self):
        super().__init__()
        self._name = "compute"
        self._description = "Perform calculations"
        self._category = ToolCategory.COMPUTATION
        self._parameters = [
            ToolParameter("operation", "string", "Operation type"),
            ToolParameter("expression", "string", "Expression to evaluate")
        ]

    async def execute(self, operation: str, expression: str, **kwargs) -> Dict:
        if operation == "math":
            try:
                result = eval(expression, {"__builtins__": {}}, {"abs": abs, "round": round, "min": min, "max": max})
                return {"result": result}
            except:
                return {"error": "Invalid expression"}
        return {"error": "Unknown operation"}


class APICallTool(Tool):
    def __init__(self):
        super().__init__()
        self._name = "api_call"
        self._description = "Make HTTP API calls"
        self._category = ToolCategory.API_CALL
        self._parameters = [
            ToolParameter("url", "string", "API endpoint"),
            ToolParameter("method", "string", "HTTP method", False, "GET")
        ]

    async def execute(self, url: str, method: str = "GET", **kwargs) -> Dict:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(method, url, timeout=30) as resp:
                    data = await resp.json()
                    return {"status": resp.status, "data": data}
        except Exception as e:
            return {"error": str(e)}


def create_default_registry(config: Optional[Dict] = None) -> ToolRegistry:
    config = config or {}
    registry = ToolRegistry()
    registry.register(WebSearchTool(api_key=config.get("serper_api_key")), ["search", "google"])
    registry.register(ComputeTool(), ["calc", "math"])
    registry.register(APICallTool(), ["http", "fetch"])
    return registry
