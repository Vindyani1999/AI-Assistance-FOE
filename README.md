# Agentic AI-Powered Workflow Automation System

An AI assistant platform containing multi-agent system

![alt text](image.png)

![alt text](image-1.png)
<!-- Image 5 -->
<img src="https://github.com/user-attachments/assets/feffae57-3ee0-4833-88db-e832659b9950" width="800" style="margin-bottom: 20px;" />
<br>
</br>
<!-- Image 6 -->
<img src="https://github.com/user-attachments/assets/949ace59-c6f4-4af9-86c9-003aadb87c0d" width="800" style="margin-bottom: 20px;" />
<br>
</br>
<img src="https://github.com/user-attachments/assets/b8f517b2-2066-4525-b548-b932c313cee6" width="800" style="margin-bottom: 10;" />
<br>
</br>

<!-- Image 2 -->
<img src="https://github.com/user-attachments/assets/331cd8cc-51ac-41c4-a67f-125a28c53c1c" width="800" style="margin-bottom: 20px;" />
<br>
</br>
<img src="https://github.com/user-attachments/assets/3a1ed740-f6b6-448d-a686-58130a586c1d" width="800" style="margin-bottom: 20px;" />

<br>
</br>
<!-- Image 3 -->
<img src="https://github.com/user-attachments/assets/92c66f4f-a1f2-46b3-a4ac-b3cefcbaed1e" width="800" style="margin-bottom: 20px;" />


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
    - [x] Web search tool for Guidance Agent
    - [x] RAG tool for Guidance Agent
    - [x] SQL tool (mini databases) for Guidance Agent
- [x] Frontend setup with React + Typescript
    - [x] Chat interface for GA
    - [x] Landing page 
    - [ ] University email login
    - [ ] User separated chat interfaces
- [x] Agent can select required tool based on user query
- [x] Agent can understand user queries whether they are grammatically wrong
- [x] Agent has chat history
- [x] Rearrange folder structure

## Quick Start

1. **Backend:**
   
   The backend provides a FastAPI REST API interface designed to work with the React frontend:

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `TAVILY_API_KEY`: Your Tavily search API key
- `LANGCHAIN_API_KEY`: Your LangChain API key

2. **Frontend (optional):**

```bash
cd frontend
npm install
npm start
```

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
