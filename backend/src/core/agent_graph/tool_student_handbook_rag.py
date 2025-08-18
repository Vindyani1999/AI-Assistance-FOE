from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.tools import tool
from langchain_community.embeddings import HuggingFaceEmbeddings
from .load_tools_config import LoadToolsConfig

TOOLS_CFG = LoadToolsConfig()

# Load embedding model ONCE when module loads
if TOOLS_CFG.student_handbook_rag_embedding_model.startswith("text-embedding"):
    EMBEDDER = OpenAIEmbeddings(
        model=TOOLS_CFG.student_handbook_rag_embedding_model
    )
    print("[INFO] Loaded OpenAI embedding model:", TOOLS_CFG.student_handbook_rag_embedding_model)
else:
    EMBEDDER = HuggingFaceEmbeddings(
        model_name=TOOLS_CFG.student_handbook_rag_embedding_model,
        # Optional: run on GPU if available
        # model_kwargs={"device": "cuda"}
    )
    print("[INFO] Loaded Hugging Face embedding model:", TOOLS_CFG.student_handbook_rag_embedding_model)

# Load Chroma vectordb ONCE when module loads
VECTORDB = Chroma(
    collection_name=TOOLS_CFG.student_handbook_rag_collection_name,
    persist_directory=TOOLS_CFG.student_handbook_rag_vectordb_directory,
    embedding_function=EMBEDDER
)

print("[INFO] Number of vectors in vectordb:", VECTORDB._collection.count(), "\n\n")


class StudentHandbookRAGTool:
    """Retrieves Student Handbook information using RAG."""

    def __init__(self, k: int) -> None:
        self.k = k
        self.vectordb = VECTORDB  # reuse already-loaded vectordb


@tool
def lookup_student_handbook(query: str) -> str:
    """Search the student handbook for answers to queries."""
    rag_tool = StudentHandbookRAGTool(k=TOOLS_CFG.student_handbook_rag_k)
    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
    return "\n\n".join([doc.page_content for doc in docs])
