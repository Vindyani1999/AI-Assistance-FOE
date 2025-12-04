from datetime import datetime, date, time
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from models.booking import MRBSEntry
from models.room import MRBSRoom
from utils.database import get_db
import logging
import os
from langchain_core.language_models import BaseLLM
from langchain_core.outputs import LLMResult, Generation
import requests
from pydantic import BaseModel
from config.app_config import settings

from typing import Optional, List, Any
from api.routes.chat_routes import router 
from fastapi.middleware.cors import CORSMiddleware
from core.booking_service import fetch_user_profile_by_email as fetch_profile_logic
from api.routes.swap_routes import router as swap_router
from api.routes.booking_routes import router as booking_router
from middleware.auth import get_current_user_email
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-access-token"],
)

app.include_router(router)
app.include_router(swap_router)
app.include_router(booking_router)