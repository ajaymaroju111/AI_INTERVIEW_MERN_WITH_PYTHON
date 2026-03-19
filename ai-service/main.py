import uvicorn
import os
import io
import json
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import ollama
import whisper
from pydub import AudioSegment
load_dotenv()

AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 8000))
OLLAMA_SERVICE_NAME = os.getenv("OLLAMA_SERVICE_NAME", "mistral")
app = FastAPI(title="AI Interview Microservice", version="1.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WHISPER_MODEL=none
try : 
    print("Loading Whisper model...")
    WHISPER_MODEL = whisper.load_model("base")
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    raise e

class QuestionRequest(BaseModel):
    question: str