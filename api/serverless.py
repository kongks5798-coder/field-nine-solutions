"""
Vercel Serverless Function for FastAPI
"""
from main import app

# Vercel requires a handler function
handler = app
