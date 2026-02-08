"""
Vercel Serverless Function Handler
"""
import sys
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from main import app

# Vercel requires a handler
handler = app
