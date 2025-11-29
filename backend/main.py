#!/usr/bin/env python3
"""
Main entry point for the AgentGraph Backend

FastAPI REST API server for the AI Agent system.
Designed to work with the React frontend.
"""

import argparse
import sys
import os
from posthog import host
import uvicorn 

from dotenv import load_dotenv
load_dotenv()

# 127.0.0.1
def run_fastapi(host=os.getenv("BASE_URL"), port=os.getenv("PORT"), reload=True):
    """Run the FastAPI application"""
    print(f"Starting FastAPI server on {host}:{port}")
    print(f"API will be available at: http://{host}:{port}")
    print(f"Interactive docs at: http://{host}:{port}/docs")
    uvicorn.run(
        "apps.fastapi_app:app",
        host=host,
        port=port,
        reload=reload
    )

def main():
    parser = argparse.ArgumentParser(description="AgentGraph FastAPI Backend Server")
    parser.add_argument(
        "--host", 
        default=os.getenv("BASE_URL"),
        help="Host to bind to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port", 
        type=int,
        default=os.getenv("PORT"),
        help="Port to bind to (default: 9000)"
    )
    parser.add_argument(
        "--no-reload",
        action="store_true",
        help="Disable auto-reload for development"
    )

    args = parser.parse_args()
    
    reload = not args.no_reload
    run_fastapi(args.host, args.port, reload)

if __name__ == "__main__":
    main()
