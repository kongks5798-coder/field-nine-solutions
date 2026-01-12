"""
모니터링 및 알림 시스템
성능 메트릭 수집, 알림 전송
"""
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import os

# 데이터베이스
try:
    from core.database import db
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    db = None

class MonitoringSystem:
    """
    모니터링 시스템
    - 성능 메트릭 수집
    - 알림 전송
    - 통계 분석
    """
    
    def __init__(self):
        self.metrics: Dict[str, List] = {
            'execution_times': [],
            'profit_history': [],
            'error_count': 0,
            'success_count': 0,
        }
        self.alerts: List[Dict] = []
        
        # 알림 설정
        self.email_enabled = os.getenv("EMAIL_NOTIFICATIONS", "false").lower() == "true"
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL", "")
    
    async def record_execution(
        self,
        execution_time_ms: float,
        profit: Decimal,
        success: bool,
        error_message: Optional[str] = None
    ):
        """실행 기록"""
        self.metrics['execution_times'].append(execution_time_ms)
        if success:
            self.metrics['success_count'] += 1
            self.metrics['profit_history'].append(float(profit))
        else:
            self.metrics['error_count'] += 1
            if error_message:
                self.alerts.append({
                    'type': 'error',
                    'message': error_message,
                    'timestamp': datetime.now(),
                })
        
        # 최근 1000개만 유지
        if len(self.metrics['execution_times']) > 1000:
            self.metrics['execution_times'] = self.metrics['execution_times'][-1000:]
        if len(self.metrics['profit_history']) > 1000:
            self.metrics['profit_history'] = self.metrics['profit_history'][-1000:]
    
    async def get_statistics(self) -> Dict:
        """통계 조회"""
        execution_times = self.metrics['execution_times']
        profit_history = self.metrics['profit_history']
        
        stats = {
            'total_executions': self.metrics['success_count'] + self.metrics['error_count'],
            'success_count': self.metrics['success_count'],
            'error_count': self.metrics['error_count'],
            'success_rate': (
                self.metrics['success_count'] / 
                (self.metrics['success_count'] + self.metrics['error_count'])
                if (self.metrics['success_count'] + self.metrics['error_count']) > 0
                else 0
            ),
            'avg_execution_time_ms': (
                sum(execution_times) / len(execution_times)
                if execution_times else 0
            ),
            'min_execution_time_ms': min(execution_times) if execution_times else 0,
            'max_execution_time_ms': max(execution_times) if execution_times else 0,
            'total_profit_usd': sum(profit_history),
            'avg_profit_usd': (
                sum(profit_history) / len(profit_history)
                if profit_history else 0
            ),
            'alerts_count': len(self.alerts),
        }
        
        return stats
    
    async def check_health(self) -> Dict:
        """헬스 체크"""
        stats = await self.get_statistics()
        
        health = {
            'status': 'healthy',
            'issues': [],
            'timestamp': datetime.now().isoformat(),
        }
        
        # 성공률 체크
        if stats['success_rate'] < 0.8:
            health['status'] = 'degraded'
            health['issues'].append('Low success rate')
        
        # 평균 실행 시간 체크
        if stats['avg_execution_time_ms'] > 1000:
            health['status'] = 'degraded'
            health['issues'].append('High execution time')
        
        # 에러율 체크
        if stats['error_count'] > 10:
            health['status'] = 'unhealthy'
            health['issues'].append('High error count')
        
        return health
    
    async def send_alert(self, message: str, level: str = 'info'):
        """알림 전송"""
        alert = {
            'level': level,
            'message': message,
            'timestamp': datetime.now().isoformat(),
        }
        
        self.alerts.append(alert)
        
        # Slack 알림 (webhook이 있는 경우)
        if self.slack_webhook and level in ['error', 'critical']:
            await self._send_slack_notification(alert)
        
        # 이메일 알림 (설정된 경우)
        if self.email_enabled and level in ['error', 'critical']:
            await self._send_email_notification(alert)
    
    async def _send_slack_notification(self, alert: Dict):
        """Slack 알림 전송"""
        try:
            import httpx
            
            payload = {
                'text': f"🚨 Field Nine Arbitrage Alert",
                'blocks': [
                    {
                        'type': 'section',
                        'text': {
                            'type': 'mrkdwn',
                            'text': f"*Level:* {alert['level']}\n*Message:* {alert['message']}\n*Time:* {alert['timestamp']}"
                        }
                    }
                ]
            }
            
            async with httpx.AsyncClient() as client:
                await client.post(self.slack_webhook, json=payload, timeout=5.0)
        except Exception as e:
            print(f"Slack 알림 전송 오류: {e}")
    
    async def _send_email_notification(self, alert: Dict):
        """이메일 알림 전송"""
        # TODO: 이메일 전송 구현 (SMTP 또는 SendGrid 등)
        print(f"이메일 알림: {alert['message']}")
    
    async def get_recent_alerts(self, limit: int = 10) -> List[Dict]:
        """최근 알림 조회"""
        return self.alerts[-limit:]
    
    async def clear_alerts(self):
        """알림 초기화"""
        self.alerts = []

# 전역 인스턴스
monitoring = MonitoringSystem()
