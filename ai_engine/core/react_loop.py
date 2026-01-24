# ---------------------------------------------------------
# Field Nine OS: ReAct Loop Implementation
# Thought -> Action -> Observation -> Feedback
# ---------------------------------------------------------

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, AsyncGenerator
from datetime import datetime
from enum import Enum
import asyncio
import json


class LoopPhase(Enum):
    """ReAct 루프 단계"""
    THOUGHT = "thought"
    ACTION = "action"
    OBSERVATION = "observation"
    FEEDBACK = "feedback"
    COMPLETE = "complete"


@dataclass
class LoopState:
    """루프 상태 추적"""
    phase: LoopPhase
    iteration: int
    data: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)


class ReActLoop:
    """
    ReAct (Reasoning + Acting) 루프 구현

    각 단계에서 이벤트를 방출하여 외부에서 모니터링 가능
    LangGraph 스타일의 노드 기반 실행 지원

    Features:
    - Async Generator 기반 스트리밍
    - 중간 상태 저장/복원
    - 조건부 분기 지원
    - 타임아웃 관리

    Usage:
        loop = ReActLoop(
            thought_fn=think,
            action_fn=act,
            observe_fn=observe,
            feedback_fn=review
        )

        async for state in loop.run("태스크"):
            print(f"Phase: {state.phase}, Data: {state.data}")
    """

    def __init__(
        self,
        thought_fn: callable,
        action_fn: callable,
        observe_fn: callable,
        feedback_fn: Optional[callable] = None,
        max_iterations: int = 10,
        timeout_seconds: float = 300.0,
        enable_checkpointing: bool = True
    ):
        self.thought_fn = thought_fn
        self.action_fn = action_fn
        self.observe_fn = observe_fn
        self.feedback_fn = feedback_fn
        self.max_iterations = max_iterations
        self.timeout_seconds = timeout_seconds
        self.enable_checkpointing = enable_checkpointing

        # State management
        self.history: List[LoopState] = []
        self.checkpoints: List[Dict] = []
        self._is_running = False
        self._should_stop = False

    async def run(
        self,
        task: str,
        initial_context: Optional[Dict] = None,
        resume_from: Optional[int] = None
    ) -> AsyncGenerator[LoopState, None]:
        """
        ReAct 루프 실행

        Args:
            task: 수행할 태스크
            initial_context: 초기 컨텍스트
            resume_from: 재개할 체크포인트 인덱스

        Yields:
            LoopState: 각 단계의 상태
        """
        self._is_running = True
        self._should_stop = False
        context = initial_context or {}
        start_iteration = 0

        # 체크포인트에서 복원
        if resume_from is not None and resume_from < len(self.checkpoints):
            checkpoint = self.checkpoints[resume_from]
            context = checkpoint.get("context", {})
            start_iteration = checkpoint.get("iteration", 0)

        try:
            start_time = datetime.now()

            for iteration in range(start_iteration, self.max_iterations):
                if self._should_stop:
                    break

                # 타임아웃 체크
                elapsed = (datetime.now() - start_time).total_seconds()
                if elapsed > self.timeout_seconds:
                    yield LoopState(
                        phase=LoopPhase.COMPLETE,
                        iteration=iteration,
                        data={"error": "Timeout exceeded", "elapsed_seconds": elapsed}
                    )
                    break

                # 1. THOUGHT 단계
                thought_state = await self._execute_phase(
                    LoopPhase.THOUGHT,
                    iteration,
                    self.thought_fn,
                    task=task,
                    context=context,
                    iteration=iteration
                )
                yield thought_state

                # 완료 조건 체크
                if thought_state.data.get("is_complete"):
                    yield LoopState(
                        phase=LoopPhase.COMPLETE,
                        iteration=iteration,
                        data={"result": thought_state.data.get("final_answer")}
                    )
                    break

                # 2. ACTION 단계
                action_state = await self._execute_phase(
                    LoopPhase.ACTION,
                    iteration,
                    self.action_fn,
                    thought=thought_state.data,
                    context=context
                )
                yield action_state

                # 3. OBSERVATION 단계
                observation_state = await self._execute_phase(
                    LoopPhase.OBSERVATION,
                    iteration,
                    self.observe_fn,
                    action=action_state.data,
                    context=context
                )
                yield observation_state

                # 4. FEEDBACK 단계 (선택적)
                if self.feedback_fn:
                    feedback_state = await self._execute_phase(
                        LoopPhase.FEEDBACK,
                        iteration,
                        self.feedback_fn,
                        thought=thought_state.data,
                        action=action_state.data,
                        observation=observation_state.data
                    )
                    yield feedback_state

                    # 재시도 필요시 컨텍스트 업데이트
                    if feedback_state.data.get("should_retry"):
                        context["retry_context"] = feedback_state.data.get("modifications", {})

                # 컨텍스트 업데이트
                context = self._update_context(
                    context,
                    thought_state,
                    action_state,
                    observation_state
                )

                # 체크포인트 저장
                if self.enable_checkpointing:
                    self._save_checkpoint(iteration, context)

            # 최대 반복 도달
            if not self._should_stop:
                yield LoopState(
                    phase=LoopPhase.COMPLETE,
                    iteration=self.max_iterations,
                    data={"status": "max_iterations_reached", "context": context}
                )

        finally:
            self._is_running = False

    async def _execute_phase(
        self,
        phase: LoopPhase,
        iteration: int,
        fn: callable,
        **kwargs
    ) -> LoopState:
        """단일 단계 실행"""
        try:
            if asyncio.iscoroutinefunction(fn):
                result = await fn(**kwargs)
            else:
                result = fn(**kwargs)

            state = LoopState(
                phase=phase,
                iteration=iteration,
                data=result if isinstance(result, dict) else {"result": result}
            )

        except Exception as e:
            state = LoopState(
                phase=phase,
                iteration=iteration,
                data={"error": str(e), "phase": phase.value}
            )

        self.history.append(state)
        return state

    def _update_context(
        self,
        context: Dict,
        thought: LoopState,
        action: LoopState,
        observation: LoopState
    ) -> Dict:
        """컨텍스트 업데이트"""
        # 이전 단계 결과를 컨텍스트에 추가
        if "history" not in context:
            context["history"] = []

        context["history"].append({
            "iteration": thought.iteration,
            "thought": thought.data,
            "action": action.data,
            "observation": observation.data,
            "timestamp": datetime.now().isoformat()
        })

        # 최근 5개만 유지 (컨텍스트 윈도우 관리)
        context["history"] = context["history"][-5:]

        # 마지막 결과 저장
        context["last_observation"] = observation.data

        return context

    def _save_checkpoint(self, iteration: int, context: Dict):
        """체크포인트 저장"""
        checkpoint = {
            "iteration": iteration,
            "context": context.copy(),
            "timestamp": datetime.now().isoformat()
        }
        self.checkpoints.append(checkpoint)

        # 최대 10개 체크포인트 유지
        if len(self.checkpoints) > 10:
            self.checkpoints = self.checkpoints[-10:]

    def stop(self):
        """루프 중지"""
        self._should_stop = True

    def reset(self):
        """상태 초기화"""
        self.history = []
        self.checkpoints = []
        self._is_running = False
        self._should_stop = False

    def get_history(self) -> List[Dict]:
        """실행 이력 조회"""
        return [
            {
                "phase": state.phase.value,
                "iteration": state.iteration,
                "data": state.data,
                "timestamp": state.timestamp.isoformat()
            }
            for state in self.history
        ]


# =============================================================
# LangGraph 호환 노드 정의 헬퍼
# =============================================================

def create_react_graph(
    thought_node: callable,
    action_node: callable,
    observation_node: callable,
    feedback_node: Optional[callable] = None,
    should_continue: Optional[callable] = None
) -> Dict:
    """
    LangGraph 스타일 그래프 정의 생성

    향후 LangGraph로 마이그레이션할 때 사용할 수 있는 구조
    """
    nodes = {
        "thought": thought_node,
        "action": action_node,
        "observation": observation_node,
    }

    if feedback_node:
        nodes["feedback"] = feedback_node

    edges = [
        ("thought", "action"),
        ("action", "observation"),
    ]

    if feedback_node:
        edges.append(("observation", "feedback"))
        edges.append(("feedback", "thought"))  # Loop back
    else:
        edges.append(("observation", "thought"))  # Loop back

    conditional_edges = []
    if should_continue:
        conditional_edges.append({
            "source": "thought",
            "condition": should_continue,
            "targets": {
                True: "action",
                False: "__end__"
            }
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "conditional_edges": conditional_edges,
        "entry_point": "thought"
    }


# =============================================================
# CrewAI 호환 태스크 래퍼
# =============================================================

class CrewAITaskWrapper:
    """
    CrewAI Task 호환 래퍼

    기존 ReActLoop를 CrewAI Task로 감싸서 사용

    Usage:
        task = CrewAITaskWrapper(
            description="트렌드 분석",
            react_loop=loop,
            expected_output="분석 리포트"
        )
    """

    def __init__(
        self,
        description: str,
        react_loop: ReActLoop,
        expected_output: str,
        agent_name: Optional[str] = None
    ):
        self.description = description
        self.react_loop = react_loop
        self.expected_output = expected_output
        self.agent_name = agent_name
        self.output = None

    async def execute(self, context: Optional[Dict] = None) -> Dict:
        """태스크 실행"""
        results = []

        async for state in self.react_loop.run(self.description, context):
            results.append(state)

            if state.phase == LoopPhase.COMPLETE:
                self.output = state.data.get("result")
                break

        return {
            "description": self.description,
            "expected_output": self.expected_output,
            "actual_output": self.output,
            "iterations": len([r for r in results if r.phase == LoopPhase.THOUGHT])
        }

    def to_crewai_format(self) -> Dict:
        """CrewAI Task 포맷으로 변환"""
        return {
            "description": self.description,
            "expected_output": self.expected_output,
            "agent": self.agent_name,
            "output": self.output
        }
