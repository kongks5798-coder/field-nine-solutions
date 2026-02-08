# Field Nine OS: Agent Controller
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional, List, Dict, Callable
from datetime import datetime
import asyncio
import json
import uuid

from .llm_providers import AgentLLMInterface, ChatMessage, MessageRole, LLMError
from .tool_interface import ToolRegistry


class AgentState(Enum):
    IDLE = "idle"
    THINKING = "thinking"
    ACTING = "acting"
    OBSERVING = "observing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ThoughtProcess:
    reasoning: str
    confidence: float
    plan: List[str]
    next_action: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {"reasoning": self.reasoning, "confidence": self.confidence, "plan": self.plan, "next_action": self.next_action}

    @classmethod
    def from_llm_response(cls, content: str) -> 'ThoughtProcess':
        try:
            data = json.loads(content)
            return cls(
                reasoning=data.get("reasoning", content),
                confidence=float(data.get("confidence", 0.5)),
                plan=data.get("plan", []),
                next_action=data.get("next_action")
            )
        except:
            return cls(reasoning=content, confidence=0.5, plan=[])


@dataclass
class Action:
    tool_name: str
    parameters: Dict[str, Any]
    expected_outcome: str
    action_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])

    def to_dict(self) -> Dict:
        return {"action_id": self.action_id, "tool_name": self.tool_name, "parameters": self.parameters}


@dataclass
class Observation:
    action_id: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time_ms: float = 0.0

    def to_dict(self) -> Dict:
        return {"action_id": self.action_id, "success": self.success, "result": str(self.result)[:500], "error": self.error}


@dataclass
class Feedback:
    quality_score: float
    issues: List[str]
    suggestions: List[str]
    should_retry: bool
    retry_modifications: Optional[Dict] = None


@dataclass
class AgentMemory:
    short_term: List[Dict] = field(default_factory=list)
    working_context: Dict[str, Any] = field(default_factory=dict)
    conversation_history: List[ChatMessage] = field(default_factory=list)

    def add_message(self, role: MessageRole, content: str):
        self.conversation_history.append(ChatMessage(role=role, content=content))
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]


class AgentController:
    """Level 3 AI Agent Controller with ReAct Framework"""

    SYSTEM_PROMPT = """You are an autonomous AI agent. Analyze the task and respond with JSON:
{{"reasoning": "your analysis", "confidence": 0.0-1.0, "plan": ["step1", "step2"], "next_action": "tool_name or complete"}}

Available tools: {tools}"""

    def __init__(
        self,
        agent_id: str,
        openai_api_key: Optional[str] = None,
        tools: Optional[ToolRegistry] = None,
        quality_agent: Optional[Any] = None,
        model: str = "gpt-4o",
        max_iterations: int = 10,
        quality_threshold: float = 0.7,
        enable_streaming: bool = True,
        verbose: bool = True,
        on_thought: Optional[Callable[[str], None]] = None,
        on_state_change: Optional[Callable[[AgentState], None]] = None,
    ):
        self.agent_id = agent_id
        self.tools = tools
        self.quality_agent = quality_agent
        self.max_iterations = max_iterations
        self.quality_threshold = quality_threshold
        self.verbose = verbose
        self.on_thought = on_thought
        self.on_state_change = on_state_change

        self.state = AgentState.IDLE
        self.memory = AgentMemory()
        self.current_task_id: Optional[str] = None

        self.llm = AgentLLMInterface(
            api_key=openai_api_key,
            model=model,
            on_thought=on_thought,
            enable_streaming=enable_streaming,
            verbose=verbose
        )

    async def execute(self, task: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        self.current_task_id = str(uuid.uuid4())[:12]
        self._set_state(AgentState.THINKING)

        self.memory.working_context = {"task": task, "iterations": 0, "start_time": datetime.now().isoformat()}
        self.memory.conversation_history = []

        self._log(f"[TASK] {task}")

        final_result = None

        for iteration in range(self.max_iterations):
            self.memory.working_context["iterations"] = iteration + 1
            self._log(f"\n--- Iteration {iteration + 1}/{self.max_iterations} ---")

            try:
                # THOUGHT
                self._set_state(AgentState.THINKING)
                thought = await self._think(task, iteration)
                self._log(f"[CONFIDENCE] {thought.confidence:.2f}")

                if self._is_complete(thought):
                    self._log("[COMPLETE] Task done")
                    final_result = thought.reasoning
                    break

                # ACTION
                self._set_state(AgentState.ACTING)
                action = await self._decide_action(thought)

                if action is None:
                    continue

                self._log(f"[ACTION] {action.tool_name}")

                # OBSERVATION
                self._set_state(AgentState.OBSERVING)
                observation = await self._execute_action(action)
                self._log(f"[RESULT] success={observation.success}")

                self.memory.add_message(MessageRole.USER, f"Tool result: {json.dumps(observation.result)[:300]}")

                # FEEDBACK
                if self.quality_agent and observation.success:
                    self._set_state(AgentState.REVIEWING)
                    feedback = await self.quality_agent.review(task, thought, action, observation)
                    if feedback.should_retry and feedback.quality_score < self.quality_threshold:
                        self.memory.working_context["retry_context"] = feedback.retry_modifications
                        continue

                if observation.success:
                    final_result = observation.result

            except LLMError as e:
                self._log(f"[ERROR] {e}")
                self._set_state(AgentState.FAILED)
                return self._build_response(False, error=str(e))

            except Exception as e:
                self._log(f"[ERROR] {e}")
                self._set_state(AgentState.FAILED)
                return self._build_response(False, error=str(e))

        self._set_state(AgentState.COMPLETED)
        return self._build_response(True, result=final_result)

    async def _think(self, task: str, iteration: int) -> ThoughtProcess:
        tools_desc = ", ".join(self.tools.list_tools()) if self.tools else "none"
        system = self.SYSTEM_PROMPT.format(tools=tools_desc)

        user_msg = f"Task: {task}\nIteration: {iteration + 1}"
        if self.memory.working_context.get("retry_context"):
            user_msg += f"\nRetry needed: {json.dumps(self.memory.working_context['retry_context'])}"

        messages = [
            ChatMessage(role=MessageRole.SYSTEM, content=system),
            *self.memory.conversation_history[-5:],
            ChatMessage(role=MessageRole.USER, content=user_msg)
        ]

        tool_schemas = self.tools.get_tool_descriptions() if self.tools else []
        response = await self.llm.think_with_tools(user_msg, tool_schemas, messages[:-1])

        thought = ThoughtProcess.from_llm_response(response.content or "")
        self.memory.add_message(MessageRole.USER, user_msg)
        self.memory.add_message(MessageRole.ASSISTANT, response.content or "")

        return thought

    async def _decide_action(self, thought: ThoughtProcess) -> Optional[Action]:
        if thought.next_action == "complete" or thought.confidence >= 0.9:
            return None
        if not thought.next_action or not self.tools:
            return None

        tool = self.tools.get_tool(thought.next_action)
        if not tool:
            for t in self.tools.list_tools():
                if t.lower() in " ".join(thought.plan).lower():
                    tool = self.tools.get_tool(t)
                    break

        if not tool:
            return None

        # Get params from LLM
        prompt = f"Provide JSON params for tool '{tool.name}': {json.dumps(tool.get_schema())}"
        response = await self.llm.provider.chat([ChatMessage(role=MessageRole.USER, content=prompt)])

        try:
            params = json.loads(response.content or "{}")
        except:
            params = {}

        return Action(tool_name=tool.name, parameters=params, expected_outcome=thought.plan[0] if thought.plan else "")

    async def _execute_action(self, action: Action) -> Observation:
        start = datetime.now()
        try:
            tool = self.tools.get_tool(action.tool_name)
            if not tool:
                return Observation(action_id=action.action_id, success=False, result=None, error="Tool not found")

            result = await tool.execute(**action.parameters)
            return Observation(
                action_id=action.action_id,
                success=True,
                result=result,
                execution_time_ms=(datetime.now() - start).total_seconds() * 1000
            )
        except Exception as e:
            return Observation(action_id=action.action_id, success=False, result=None, error=str(e))

    def _is_complete(self, thought: ThoughtProcess) -> bool:
        if thought.confidence >= 0.9:
            return True
        if thought.next_action and thought.next_action.lower() == "complete":
            return True
        return False

    def _build_response(self, success: bool, result: Any = None, error: Optional[str] = None) -> Dict:
        return {
            "task_id": self.current_task_id,
            "agent_id": self.agent_id,
            "success": success,
            "result": result,
            "error": error,
            "state": self.state.value,
            "iterations": self.memory.working_context.get("iterations", 0),
            "usage_stats": self.llm.get_stats(),
            "timestamp": datetime.now().isoformat()
        }

    def _set_state(self, state: AgentState):
        self.state = state
        if self.on_state_change:
            self.on_state_change(state)

    def _log(self, msg: str):
        if self.verbose:
            print(f"[{self.agent_id}] {msg}")

    def get_usage_stats(self) -> Dict:
        return self.llm.get_stats()
