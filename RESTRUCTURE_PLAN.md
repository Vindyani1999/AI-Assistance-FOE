# Project Restructuring Plan

## Current Issues
- Root folder has too many files and folders mixed together
- No clear separation between frontend and backend
- Configuration files scattered
- Documentation files not organized
- No proper development/build structure

## Proposed Professional Structure

```
agent-graph-system/
├── README.md                          # Main project documentation
├── LICENSE                           # Project license
├── .gitignore                        # Git ignore rules
├── .env.example                      # Environment variables template
├── requirements.txt                   # Python dependencies (root level for easy setup)
├── package.json                      # Root package.json for workspace management
├── docker-compose.yml                # Docker setup (if needed)
│
├── docs/                             # Documentation
│   ├── README.md                     # Documentation index
│   ├── setup/                        # Setup guides
│   │   ├── REACT_SETUP.md
│   │   └── README_React.md
│   ├── api/                          # API documentation
│   └── guides/                       # User guides
│       └── sample_questions.txt
│
├── backend/                          # Python backend
│   ├── README.md                     # Backend specific docs
│   ├── requirements.txt              # Backend dependencies
│   ├── pyproject.toml               # Python project config
│   ├── main.py                       # Main entry point
│   ├── config/                       # Configuration files
│   │   ├── project_config.yml
│   │   └── tools_config.yml
│   ├── src/                          # Source code
│   │   ├── __init__.py
│   │   ├── api/                      # API layer
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   ├── core/                     # Core business logic
│   │   │   ├── __init__.py
│   │   │   ├── agent_graph/          # Agent graph system
│   │   │   ├── chatbot/              # Chatbot logic
│   │   │   └── utils/                # Utilities
│   │   ├── models/                   # Data models
│   │   ├── services/                 # Business services
│   │   └── database/                 # Database layer
│   ├── tests/                        # Backend tests
│   ├── scripts/                      # Utility scripts
│   │   └── prepare_vector_db.py
│   └── apps/                         # Different app interfaces
│       ├── fastapi_app.py           # FastAPI application
│       ├── streamlit_app.py         # Streamlit application
│       └── gradio_app.py            # Gradio application
│
├── frontend/                         # React frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   ├── src/
│   └── build/                       # Build output
│
├── data/                            # Data files
│   ├── databases/                   # Database files
│   │   ├── Chinook.db
│   │   └── travel.sqlite
│   ├── vectordb/                    # Vector databases
│   │   ├── airline_policy_vectordb/
│   │   └── stories_vectordb/
│   ├── documents/                   # Source documents
│   │   └── unstructured_docs/
│   └── memory/                      # Chat memory/logs
│       └── *.csv
│
├── notebooks/                       # Jupyter notebooks
│   ├── README.md                    # Notebook documentation
│   ├── exploratory/                 # Research/development notebooks
│   │   └── full_graph.ipynb
│   └── tools/                       # Tool development notebooks
│       ├── rag/
│       ├── sql_agents/
│       └── search/
│
├── assets/                          # Static assets
│   ├── images/
│   └── icons/
│
├── scripts/                         # Build and deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── setup.sh
│
├── tests/                           # Integration tests
│   ├── backend/
│   ├── frontend/
│   └── e2e/
│
└── .vscode/                         # VS Code settings
    ├── settings.json
    ├── launch.json
    └── tasks.json
```

## Migration Steps

1. Create new folder structure
2. Move backend files to appropriate locations
3. Update import paths in Python files
4. Move frontend files
5. Reorganize data and documentation
6. Update configuration files
7. Create new entry points
8. Update documentation
9. Test functionality

## Benefits

- Clear separation of concerns
- Professional project structure
- Better maintainability
- Easier onboarding for new developers
- Standard development practices
- Improved CI/CD setup potential
