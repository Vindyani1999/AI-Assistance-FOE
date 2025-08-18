from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig

TOOLS_CFG = LoadToolsConfig()


class ByLawRAGTool:
    """
    A tool for retrieving relevant sections from the university by-laws using a Retrieval-Augmented Generation (RAG) approach with vector embeddings.

    Automatically selects between OpenAI and HuggingFace embeddings based on config.
    """

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
        """
        Initializes the ByLawRAGTool with the necessary configurations.

        Args:
            embedding_model (str): Embedding model name (e.g., "text-embedding-ada-002" for OpenAI
                                   or "sentence-transformers/all-MiniLM-L6-v2" for HuggingFace)
            vectordb_dir (str): Path where the Chroma DB is stored.
            k (int): Number of results to return.
            collection_name (str): Name of the Chroma DB collection.
        """
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k

        # Choose embedding model
        if self.embedding_model.startswith("text-embedding"):
            embedder = OpenAIEmbeddings(model=self.embedding_model)
            print(f"[INFO] Loaded OpenAI embedding model for ByLaw: {self.embedding_model}")
        else:
            embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
            print(f"[INFO] Loaded HuggingFace embedding model for ByLaw: {self.embedding_model}")

        # Load Chroma vectordb
        self.vectordb = Chroma(
            collection_name=collection_name,
            persist_directory=self.vectordb_dir,
            embedding_function=embedder
        )
        print("Number of vectors in vectordb:", self.vectordb._collection.count(), "\n\n")


@tool
def lookup_by_law(query: str) -> str:
    """
    Search among the university by-laws and find the answer to the query.
    Input should be the query text.
    """
    rag_tool = ByLawRAGTool(
        embedding_model=TOOLS_CFG.by_law_rag_embedding_model,
        vectordb_dir=TOOLS_CFG.by_law_rag_vectordb_directory,
        k=TOOLS_CFG.by_law_rag_k,
        collection_name=TOOLS_CFG.by_law_rag_collection_name
    )
    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
    return "\n\n".join([doc.page_content for doc in docs])
