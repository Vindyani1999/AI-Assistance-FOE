import os
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig

TOOLS_CFG = LoadToolsConfig()


class EstablishmentCodeRAGTool:
    """
    Tool for retrieving relevant sections from Establishment Code Vol I & II using RAG (Retrieval-Augmented Generation).
    """

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
        """
        Initialize Establishment Code RAG Tool.

        Args:
            embedding_model (str): Name of embedding model.
            vectordb_dir (str): Directory path where Chroma vector DB is stored.
            k (int): Number of retrieved chunks.
            collection_name (str): Name of the Chroma collection.
        """
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k

        # Select embedding model
        if self.embedding_model.startswith("text-embedding"):
            embedder = OpenAIEmbeddings(model=self.embedding_model)
            print(f"[INFO] Loaded OpenAI embedding model for Establishment Code: {self.embedding_model}")
        else:
            embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
            print(f"[INFO] Loaded HuggingFace embedding model for Establishment Code: {self.embedding_model}")

        # Load Chroma database
        self.vectordb = Chroma(
            collection_name=collection_name,
            persist_directory=self.vectordb_dir,
            embedding_function=embedder
        )
        print("Number of vectors in vectordb:", self.vectordb._collection.count(), "\n\n")


@tool
def lookup_establishment_code(query: str) -> str:
    """
    Search the Establishment Code Vol I & II and return the most relevant sections for a given query.
    The input should be a natural language question.
    """
    rag_tool = EstablishmentCodeRAGTool(
        embedding_model=TOOLS_CFG.establishment_code_rag_embedding_model,
        vectordb_dir=TOOLS_CFG.establishment_code_rag_vectordb_directory,
        k=TOOLS_CFG.establishment_code_rag_k,
        collection_name=TOOLS_CFG.establishment_code_rag_collection_name
    )

    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)

    # Include volume information in the response if available
    responses = []
    for doc in docs:
        volume = doc.metadata.get("volume", "Unknown Volume")
        responses.append(f"📘 **{volume}**:\n{doc.page_content.strip()}")

    return "\n\n".join(responses)
