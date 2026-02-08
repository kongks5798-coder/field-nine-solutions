# Field Nine OS: Quality Agent
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class Feedback:
    quality_score: float
    issues: List[str]
    suggestions: List[str]
    should_retry: bool
    retry_modifications: Optional[Dict] = None


class QualityAgent:
    def __init__(self, min_quality_threshold: float = 0.7, max_retries: int = 3):
        self.min_quality_threshold = min_quality_threshold
        self.max_retries = max_retries
        self._retry_count = 0

    async def review(self, task: str, thought: Any, action: Any, observation: Any) -> Feedback:
        # Basic quality checks
        checks = []

        # Completeness
        if observation.success and observation.result:
            checks.append(1.0)
        else:
            checks.append(0.0)

        # Calculate score
        score = sum(checks) / len(checks) if checks else 1.0

        issues = []
        if not observation.success:
            issues.append("Action failed")
        if not observation.result:
            issues.append("Empty result")

        should_retry = score < self.min_quality_threshold and self._retry_count < self.max_retries

        if should_retry:
            self._retry_count += 1
        else:
            self._retry_count = 0

        return Feedback(
            quality_score=score,
            issues=issues,
            suggestions=["Try a different approach"] if issues else [],
            should_retry=should_retry,
            retry_modifications={"issues": issues} if should_retry else None
        )

    def reset(self):
        self._retry_count = 0
