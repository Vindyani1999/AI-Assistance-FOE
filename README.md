# Agentic AI-Powered Workflow Automation System

An AI assistant platform containing multi-agent system

## Project Structure

- `backend/` — Python backend (FastAPI)
- `frontend/` — React TypeScript frontend
- `data/` — Databases, documents, vector stores
- `assets/` — Images and static files
- `scripts/` — Utility scripts
- `docs/` — Documentation
- `notebooks/` — Jupyter notebooks

## Completed sections

- [x] Database integration
- [x] Vector database preparation
- [x] Backend setup (FastAPI)
    - [ ] Web search tool for Guidance Agent
    - [ ] RAG tool for Guidance Agent
    - [ ] SQL tool (mini databases) for Guidance Agent
- [ ] Frontend setup with React + Typescript
    - [ ] Chat interface for GA
    - [ ] Landing page 
    - [ ] University email login
    - [ ] User separated chat interfaces
- [x] Agent can select required tool based on user query
- [ ] Agent can understand user queries whether they are grammatically wrong
- [ ] Agent has chat history
- [x] Rearrange folder structure

## Quick Start

1. **Backend:**
   - `cd backend`
   - Create and activate a Python 3.9+ virtual environment
   - `pip install -r requirements.txt`
   - Run: `python main.py fastapi` or `python main.py gradio`

2. **Frontend (optional):**
   - `cd frontend`
   - `npm install`
   - `npm start`

3. **Prepare vector DB:**
   - `cd backend`
   - `python scripts/prepare_vector_db.py`

## Requirements

- Python 3.9+
- Node.js 16+
- API keys for OpenAI, Tavily, LangChain (see `.env.example`)

## Databases

- Student Handbook Database
- ByLaw Database
- Examination Manual VectorDB