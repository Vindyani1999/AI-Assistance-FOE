
# AgentGraph: Intelligent SQL-agent Q&A and RAG System for Chatting with Multiple Databases

This project demonstrates how to build an agentic system using Large Language Models (LLMs) that can interact with multiple databases and utilize various tools. It highlights the use of SQL agents to efficiently query large databases. The key frameworks used in this project include OpenAI, LangChain, LangGraph, LangSmith, and various web frameworks.

The system provides multiple interfaces:

- **FastAPI**: REST API for programmatic access
- **React Frontend**: Modern web interface
- **Gradio**: Interactive demo interface

---

## 🏗️ Project Structure

```
agent-graph-system/
├── backend/           # Python backend services
├── frontend/          # React TypeScript frontend
├── data/             # Databases, documents, vector stores
├── notebooks/        # Jupyter notebooks for development
├── docs/             # Documentation
├── assets/           # Static assets (images, icons)
├── scripts/          # Build and deployment scripts
└── tests/            # Integration tests
```

## Video Explanation

A detailed explanation of the project is available in the following YouTube video:

Automating LLM Agents to Chat with Multiple/Large Databases (Combining RAG and SQL Agents): [Link](https://youtu.be/xsCedrNP9w8?si=v-3k-BoDky_1IRsg)

## Requirements

- **Operating System:** Linux or Windows (Tested on Windows 11 with Python 3.9+)
- **Node.js:** Version 16+ (for React frontend)
- **Python:** Version 3.9+
- **API Keys Required:**
  - OpenAI API Key (for GPT functionality)
  - Tavily API Key (for search tools - free from Tavily profile)
  - LangChain API Key (for LangSmith monitoring - free from LangChain profile)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo_address>
cd agent-graph-system
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Setup (Optional)

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and configure your API keys:

```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY=your_openai_api_key`
- `TAVILY_API_KEY=your_tavily_api_key`
- `LANGCHAIN_API_KEY=your_langchain_api_key`

### 5. Prepare Vector Database

```bash
cd backend
python scripts/prepare_vector_db.py
```

### 6. Run the Application

Choose your preferred interface:

```bash
# FastAPI (REST API) - http://localhost:8000
python main.py fastapi

# Gradio (Demo UI) - http://localhost:7860
python main.py gradio
```

### 7. React Frontend (Optional)

```bash
cd frontend
npm start  # http://localhost:3000
```

All configurations are managed through YAML files in the `configs` folder, loaded by `src\chatbot\load_config.py` and `src\agent_graph\load_tools_config.py`. These modules are used for a clean distribution of configurations throughout the project.

Once your databases are ready, you can either connect the current agents to the databases or create new agents. More details can be found in the accompanying YouTube video.

---

## Project Schemas

### High-level overview

<div align="center">
  <img src="images/high-level.png" alt="high-level">
</div>

### Detailed Schema

<div align="center">
  <img src="images/detailed_schema.png" alt="detailed_schema">
</div>

### Graph Schema

<div align="center">
  <img src="images/graph_image.png" alt="graph_image">
</div>

### SQL-agent for large databases strategies

<div align="center">
  <img src="images/large_db_strategy.png" alt="large_db_strategy">
</div>

---

## Chatbot User Interface

<div align="center">
  <img src="images/UI.png" alt="ChatBot UI">
</div>

---

## LangSmith Monitoring System

<div align="center">
  <img src="images/langsmith.png" alt="langsmith">
</div>

---

## Databases Used

- **Travel SQL Database:** [Kaggle Link](https://www.kaggle.com/code/mpwolke/airlines-sqlite)
- **Chinook SQL Database:** [Sample Database](https://database.guide/2-sample-databases-sqlite/)
- **stories VectorDB**
- **Airline Policy FAQ VectorDB**
---

## Key Frameworks and Libraries

- **LangChain:** [Introduction](https://python.langchain.com/docs/get_started/introduction)
- **LangGraph**
- **LangSmith**
- **Gradio:** [Documentation](https://www.gradio.app/docs/interface)
- **OpenAI:** [Developer Quickstart](https://platform.openai.com/docs/quickstart?context=python)
- **Tavily Search**
---