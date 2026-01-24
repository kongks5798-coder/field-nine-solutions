# Field Nine OS - Agent Core Module
# Level 3 AI Agent Architecture with OpenAI Integration

from .agent_controller import (
    AgentController,
    AgentState,
    ThoughtProcess,
    Action,
    Observation,
    Feedback,
    AgentMemory
)

from .react_loop import ReActLoop, LoopPhase, LoopState

from .tool_interface import (
    Tool,
    ToolRegistry,
    ToolCategory,
    ToolParameter,
    ToolResult,
    WebSearchTool,
    DatabaseQueryTool,
    APICallTool,
    ComputationTool,
    NotificationTool,
    create_default_registry
)

from .quality_agent import (
    QualityAgent,
    QualityCriteria,
    QualityCheck,
    check_json_valid,
    check_min_length,
    check_no_placeholder,
    check_korean_response
)

from .llm_providers import (
    OpenAIProvider,
    AgentLLMInterface,
    LLMProvider,
    ChatMessage,
    MessageRole,
    LLMResponse,
    ToolCall,
    StreamChunk,
    ThoughtStreamer,
    ErrorRecoveryHandler,
    RecoveryDecision,
    LLMError,
    TokenLimitError,
    RateLimitException
)

__all__ = [
    # Agent Controller
    "AgentController",
    "AgentState",
    "ThoughtProcess",
    "Action",
    "Observation",
    "Feedback",
    "AgentMemory",

    # ReAct Loop
    "ReActLoop",
    "LoopPhase",
    "LoopState",

    # Tools
    "Tool",
    "ToolRegistry",
    "ToolCategory",
    "ToolParameter",
    "ToolResult",
    "WebSearchTool",
    "DatabaseQueryTool",
    "APICallTool",
    "ComputationTool",
    "NotificationTool",
    "create_default_registry",

    # Quality Agent
    "QualityAgent",
    "QualityCriteria",
    "QualityCheck",
    "check_json_valid",
    "check_min_length",
    "check_no_placeholder",
    "check_korean_response",

    # LLM Providers
    "OpenAIProvider",
    "AgentLLMInterface",
    "LLMProvider",
    "ChatMessage",
    "MessageRole",
    "LLMResponse",
    "ToolCall",
    "StreamChunk",
    "ThoughtStreamer",
    "ErrorRecoveryHandler",
    "RecoveryDecision",
    "LLMError",
    "TokenLimitError",
    "RateLimitException"
]
