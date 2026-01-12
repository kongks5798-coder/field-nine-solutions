@app.get("/api/stats")
async def get_statistics():
    """통계 조회"""
    if not MONITORING_AVAILABLE or not monitoring:
        return {
            "error": "Monitoring system not available",
            "timestamp": datetime.now().isoformat(),
        }
    
    stats = await monitoring.get_statistics()
    return {
        **stats,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/alerts")
async def get_alerts(limit: int = 10):
    """최근 알림 조회"""
    if not MONITORING_AVAILABLE or not monitoring:
        return {
            "alerts": [],
            "timestamp": datetime.now().isoformat(),
        }
    
    alerts = await monitoring.get_recent_alerts(limit)
    return {
        "alerts": alerts,
        "count": len(alerts),
        "timestamp": datetime.now().isoformat(),
    }
