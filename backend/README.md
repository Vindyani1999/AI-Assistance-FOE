# AI Assitance Backend

3. Run the Application

The backend provides a FastAPI REST API interface designed to work with the React frontend:

```bash
python main.py
```

Access at: <http://localhost:8000>

### 4. Start the React Frontend

```bash
cd ../frontend
npm start
```

Access at: <http://localhost:3000>raph system - an intelligent SQL-agent Q&A and RAG system for chatting with multiple databases.

## Architecture

The backend is organized into the following components:

- **apps/**: FastAPI application interface
- **src/**: Core source code
  - **core/**: Business logic (agent_graph, chatbot, utils)
  - **api/**: API routes and endpoints
  - **models/**: Data models and schemas
  - **services/**: Business services
  - **database/**: Database layer
- **config/**: Configuration files
- **scripts/**: Utility scripts
- **tests/**: Backend tests

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment

Copy the `.env.example` to `.env` and configure your API keys:

```bash
cp ../.env.example ../.env
```

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `TAVILY_API_KEY`: Your Tavily search API key
- `LANGCHAIN_API_KEY`: Your LangChain API key

### 3. Prepare Vector Database

```bash
python scripts/prepare_vector_db.py
```

### 4. Run the Application

Choose one of the available interfaces:

#### FastAPI (REST API)

```bash
python main.py fastapi
```

Access at: <http://localhost:8000>

## API Documentation

When running the FastAPI application, API documentation is available at:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## Configuration

Configuration files are located in the `config/` directory:
- `project_config.yml`: Main project configuration
- `tools_config.yml`: Tool-specific configurations

## Development

### Running in Development Mode

```bash
# FastAPI with auto-reload
python main.py fastapi --host localhost --port 8000

# Gradio
python main.py gradio
```

### Testing

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_specific.py
```

## Features

- Multi-database SQL agent support
- RAG (Retrieval-Augmented Generation) system
- Multiple document types support
- Vector database integration
- LangSmith monitoring
- FastAPI REST API for React frontend integration
- RESTful API

## Tools and Agents

The system includes several specialized tools:
- SQL agents for database querying
- RAG tools for document retrieval
- Search tools for web information
- Policy and handbook lookup tools
