# ---------------------------------------------------------
# Field Nine OS: Quality Agent (Self-Criticism)
# 결과물 품질 검수 및 자기 비판 로직
# ---------------------------------------------------------

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from enum import Enum
import json
import re


class QualityCriteria(Enum):
    """품질 검수 기준"""
    COMPLETENESS = "completeness"      # 완성도
    ACCURACY = "accuracy"              # 정확성
    RELEVANCE = "relevance"            # 관련성
    CONSISTENCY = "consistency"        # 일관성
    SAFETY = "safety"                  # 안전성
    PERFORMANCE = "performance"        # 성능


@dataclass
class QualityCheck:
    """개별 품질 검사 결과"""
    criteria: QualityCriteria
    passed: bool
    score: float  # 0.0 ~ 1.0
    details: str
    weight: float = 1.0  # 중요도 가중치


class QualityAgent:
    """
    품질 검수 에이전트

    다른 에이전트의 출력물을 검토하고 품질 점수를 부여
    기준 미달 시 개선 프롬프트를 생성하여 재시도 유도

    Usage:
        quality_agent = QualityAgent(
            llm_provider=openai_client,
            criteria_weights={
                QualityCriteria.ACCURACY: 1.5,
                QualityCriteria.COMPLETENESS: 1.2,
            }
        )
        feedback = await quality_agent.review(task, thought, action, observation)
    """

    def __init__(
        self,
        llm_provider: Any = None,
        criteria_weights: Optional[Dict[QualityCriteria, float]] = None,
        min_quality_threshold: float = 0.7,
        max_retries: int = 3,
        custom_rules: Optional[List[Dict]] = None
    ):
        self.llm = llm_provider
        self.min_quality_threshold = min_quality_threshold
        self.max_retries = max_retries
        self._retry_count = 0

        # 기본 가중치 설정
        self.criteria_weights = criteria_weights or {
            QualityCriteria.COMPLETENESS: 1.0,
            QualityCriteria.ACCURACY: 1.5,
            QualityCriteria.RELEVANCE: 1.2,
            QualityCriteria.CONSISTENCY: 0.8,
            QualityCriteria.SAFETY: 2.0,  # 안전성은 항상 최우선
            QualityCriteria.PERFORMANCE: 0.5
        }

        # 커스텀 규칙 (비즈니스 로직)
        self.custom_rules = custom_rules or []

    async def review(
        self,
        task: str,
        thought: 'ThoughtProcess',
        action: 'Action',
        observation: 'Observation'
    ) -> 'Feedback':
        """
        메인 검수 프로세스
        """
        from .agent_controller import Feedback

        checks: List[QualityCheck] = []

        # 1. 기본 품질 검사
        checks.extend(self._run_basic_checks(task, thought, action, observation))

        # 2. LLM 기반 심층 검사 (활성화된 경우)
        if self.llm:
            llm_checks = await self._run_llm_checks(task, thought, action, observation)
            checks.extend(llm_checks)

        # 3. 커스텀 규칙 검사
        checks.extend(self._run_custom_checks(task, observation))

        # 4. 최종 점수 계산
        quality_score = self._calculate_weighted_score(checks)
        issues = [c.details for c in checks if not c.passed]
        suggestions = self._generate_suggestions(checks, task)

        # 5. 재시도 여부 결정
        should_retry = (
            quality_score < self.min_quality_threshold and
            self._retry_count < self.max_retries
        )

        if should_retry:
            self._retry_count += 1
            retry_modifications = self._build_retry_modifications(checks, task)
        else:
            retry_modifications = None
            self._retry_count = 0  # Reset for next task

        return Feedback(
            quality_score=quality_score,
            issues=issues,
            suggestions=suggestions,
            should_retry=should_retry,
            retry_modifications=retry_modifications
        )

    def _run_basic_checks(
        self,
        task: str,
        thought: 'ThoughtProcess',
        action: 'Action',
        observation: 'Observation'
    ) -> List[QualityCheck]:
        """기본 품질 검사"""
        checks = []

        # 1. 완성도 검사 - 결과가 비어있지 않은지
        completeness_passed = (
            observation.success and
            observation.result is not None and
            (not isinstance(observation.result, str) or len(observation.result) > 0)
        )
        checks.append(QualityCheck(
            criteria=QualityCriteria.COMPLETENESS,
            passed=completeness_passed,
            score=1.0 if completeness_passed else 0.0,
            details="Result is empty or failed" if not completeness_passed else "Result is complete"
        ))

        # 2. 관련성 검사 - 액션이 태스크와 관련 있는지
        task_keywords = set(task.lower().split())
        action_keywords = set(action.expected_outcome.lower().split())
        relevance_overlap = len(task_keywords & action_keywords)
        relevance_score = min(relevance_overlap / max(len(task_keywords), 1), 1.0)
        checks.append(QualityCheck(
            criteria=QualityCriteria.RELEVANCE,
            passed=relevance_score >= 0.3,
            score=relevance_score,
            details=f"Relevance score: {relevance_score:.2f}"
        ))

        # 3. 일관성 검사 - Thought의 plan과 실제 action이 일치하는지
        if thought.plan:
            action_in_plan = any(
                action.tool_name.lower() in step.lower() or
                action.expected_outcome.lower() in step.lower()
                for step in thought.plan
            )
            consistency_score = 1.0 if action_in_plan else 0.5
        else:
            consistency_score = 0.7  # No plan is acceptable but not ideal

        checks.append(QualityCheck(
            criteria=QualityCriteria.CONSISTENCY,
            passed=consistency_score >= 0.5,
            score=consistency_score,
            details="Action aligns with plan" if consistency_score >= 0.8 else "Action may deviate from plan"
        ))

        # 4. 성능 검사 - 실행 시간
        performance_score = 1.0
        if observation.execution_time_ms > 30000:  # 30초 초과
            performance_score = 0.3
        elif observation.execution_time_ms > 10000:  # 10초 초과
            performance_score = 0.6
        elif observation.execution_time_ms > 5000:  # 5초 초과
            performance_score = 0.8

        checks.append(QualityCheck(
            criteria=QualityCriteria.PERFORMANCE,
            passed=performance_score >= 0.5,
            score=performance_score,
            details=f"Execution time: {observation.execution_time_ms:.0f}ms"
        ))

        # 5. 안전성 검사 - 위험한 작업 감지
        dangerous_patterns = [
            r"delete\s+all",
            r"drop\s+table",
            r"rm\s+-rf",
            r"format\s+",
            r"sudo\s+",
            r"eval\(",
            r"exec\("
        ]

        action_str = json.dumps(action.parameters).lower()
        is_safe = not any(re.search(p, action_str) for p in dangerous_patterns)

        checks.append(QualityCheck(
            criteria=QualityCriteria.SAFETY,
            passed=is_safe,
            score=1.0 if is_safe else 0.0,
            details="Action appears safe" if is_safe else "Potentially dangerous action detected",
            weight=self.criteria_weights.get(QualityCriteria.SAFETY, 2.0)
        ))

        return checks

    async def _run_llm_checks(
        self,
        task: str,
        thought: 'ThoughtProcess',
        action: 'Action',
        observation: 'Observation'
    ) -> List[QualityCheck]:
        """LLM 기반 심층 품질 검사"""
        if not self.llm:
            return []

        prompt = f"""You are a quality assurance agent reviewing the work of another AI agent.

ORIGINAL TASK: {task}

AGENT'S REASONING: {thought.reasoning}
AGENT'S PLAN: {json.dumps(thought.plan)}
ACTION TAKEN: {action.tool_name} with params {json.dumps(action.parameters)}
EXPECTED OUTCOME: {action.expected_outcome}
ACTUAL RESULT: {str(observation.result)[:1000]}

Please evaluate the following criteria and respond with JSON:

1. ACCURACY (0.0-1.0): Does the result accurately address the task?
2. COMPLETENESS (0.0-1.0): Is the task fully completed?
3. REASONING_QUALITY (0.0-1.0): Was the reasoning sound and logical?

Respond ONLY with JSON:
{{
    "accuracy": {{"score": 0.0-1.0, "reason": "..."}},
    "completeness": {{"score": 0.0-1.0, "reason": "..."}},
    "reasoning_quality": {{"score": 0.0-1.0, "reason": "..."}}
}}
"""

        try:
            # LLM 호출 (실제 구현 시 교체)
            response = await self._call_llm(prompt)
            evaluation = json.loads(response)

            checks = []

            if "accuracy" in evaluation:
                checks.append(QualityCheck(
                    criteria=QualityCriteria.ACCURACY,
                    passed=evaluation["accuracy"]["score"] >= 0.7,
                    score=evaluation["accuracy"]["score"],
                    details=evaluation["accuracy"].get("reason", "LLM accuracy check")
                ))

            return checks

        except Exception as e:
            # LLM 실패 시 기본 체크만 사용
            return []

    def _run_custom_checks(self, task: str, observation: 'Observation') -> List[QualityCheck]:
        """커스텀 비즈니스 규칙 검사"""
        checks = []

        for rule in self.custom_rules:
            rule_name = rule.get("name", "custom_rule")
            rule_func = rule.get("check_function")
            rule_weight = rule.get("weight", 1.0)

            if rule_func and callable(rule_func):
                try:
                    passed, score, details = rule_func(task, observation)
                    checks.append(QualityCheck(
                        criteria=QualityCriteria.COMPLETENESS,  # Custom criteria
                        passed=passed,
                        score=score,
                        details=f"[{rule_name}] {details}",
                        weight=rule_weight
                    ))
                except Exception as e:
                    checks.append(QualityCheck(
                        criteria=QualityCriteria.COMPLETENESS,
                        passed=False,
                        score=0.0,
                        details=f"[{rule_name}] Rule check failed: {str(e)}"
                    ))

        return checks

    def _calculate_weighted_score(self, checks: List[QualityCheck]) -> float:
        """가중 평균 점수 계산"""
        if not checks:
            return 1.0

        total_weight = 0
        weighted_sum = 0

        for check in checks:
            weight = check.weight * self.criteria_weights.get(check.criteria, 1.0)
            weighted_sum += check.score * weight
            total_weight += weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _generate_suggestions(self, checks: List[QualityCheck], task: str) -> List[str]:
        """개선 제안 생성"""
        suggestions = []
        failed_checks = [c for c in checks if not c.passed]

        for check in failed_checks:
            if check.criteria == QualityCriteria.COMPLETENESS:
                suggestions.append("Try to provide a more complete response to the task")

            elif check.criteria == QualityCriteria.ACCURACY:
                suggestions.append("Verify the accuracy of the result against the original task requirements")

            elif check.criteria == QualityCriteria.RELEVANCE:
                suggestions.append(f"Focus more directly on the task: '{task[:100]}...'")

            elif check.criteria == QualityCriteria.CONSISTENCY:
                suggestions.append("Ensure your actions align with your stated plan")

            elif check.criteria == QualityCriteria.SAFETY:
                suggestions.append("Avoid potentially dangerous operations; use safer alternatives")

            elif check.criteria == QualityCriteria.PERFORMANCE:
                suggestions.append("Consider optimizing for faster execution")

        return suggestions[:5]  # Limit to 5 suggestions

    def _build_retry_modifications(self, checks: List[QualityCheck], task: str) -> Dict:
        """재시도를 위한 수정 지침 생성"""
        failed_checks = [c for c in checks if not c.passed]

        return {
            "retry_number": self._retry_count,
            "failed_criteria": [c.criteria.value for c in failed_checks],
            "improvement_focus": self._generate_suggestions(checks, task),
            "previous_issues": [c.details for c in failed_checks],
            "instruction": "Please address the issues above and try a different approach if necessary"
        }

    async def _call_llm(self, prompt: str) -> str:
        """LLM 호출 (추상화)"""
        # TODO: 실제 LLM 호출 구현
        # Mock response for testing
        return json.dumps({
            "accuracy": {"score": 0.8, "reason": "Result addresses the main task"},
            "completeness": {"score": 0.7, "reason": "Most requirements met"},
            "reasoning_quality": {"score": 0.85, "reason": "Logical reasoning process"}
        })

    def add_custom_rule(
        self,
        name: str,
        check_function: callable,
        weight: float = 1.0
    ):
        """커스텀 검사 규칙 추가"""
        self.custom_rules.append({
            "name": name,
            "check_function": check_function,
            "weight": weight
        })

    def reset(self):
        """상태 초기화"""
        self._retry_count = 0


# =============================================================
# 프리셋 품질 검사 규칙
# =============================================================

def check_json_valid(task: str, observation: 'Observation') -> tuple:
    """결과가 유효한 JSON인지 확인"""
    if not observation.result:
        return False, 0.0, "No result to validate"

    try:
        if isinstance(observation.result, str):
            json.loads(observation.result)
        return True, 1.0, "Valid JSON structure"
    except:
        return False, 0.0, "Invalid JSON structure"


def check_min_length(min_chars: int = 100):
    """최소 길이 검사 규칙 팩토리"""
    def check(task: str, observation: 'Observation') -> tuple:
        if not observation.result:
            return False, 0.0, f"No result (expected min {min_chars} chars)"

        result_str = str(observation.result)
        length = len(result_str)

        if length >= min_chars:
            return True, 1.0, f"Length {length} >= {min_chars}"
        else:
            score = length / min_chars
            return False, score, f"Length {length} < {min_chars} required"

    return check


def check_no_placeholder():
    """플레이스홀더 텍스트 감지"""
    placeholders = [
        "lorem ipsum", "placeholder", "todo:", "fixme:",
        "[insert", "xxx", "tbd", "coming soon"
    ]

    def check(task: str, observation: 'Observation') -> tuple:
        if not observation.result:
            return True, 1.0, "No result to check"

        result_lower = str(observation.result).lower()
        found = [p for p in placeholders if p in result_lower]

        if found:
            return False, 0.3, f"Placeholder text found: {found}"
        return True, 1.0, "No placeholder text detected"

    return check


def check_korean_response():
    """한국어 응답 여부 확인"""
    def check(task: str, observation: 'Observation') -> tuple:
        if not observation.result:
            return True, 1.0, "No result to check"

        result_str = str(observation.result)
        korean_chars = len([c for c in result_str if '\uac00' <= c <= '\ud7a3'])
        total_chars = len([c for c in result_str if c.isalpha()])

        if total_chars == 0:
            return True, 1.0, "No text content"

        ratio = korean_chars / total_chars

        if ratio >= 0.3:
            return True, 1.0, f"Korean content ratio: {ratio:.1%}"
        return False, ratio, f"Low Korean content: {ratio:.1%}"

    return check
