from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig

TOOLS_CFG = LoadToolsConfig()


class ExamManualRAGTool:
    """
    Retrieves relevant exam manual sections using a Retrieval-Augmented Generation (RAG) approach.

    This tool supports both OpenAI and HuggingFace embedding models. It transforms user queries into
    vector embeddings and queries a Chroma-based vector database to retrieve the top-k most relevant
    passages from the exam manual.

    Attributes:
        embedding_model (str): The name of the embedding model (OpenAI or HuggingFace) used to generate vector embeddings.
        vectordb_dir (str): Directory path where the Chroma vector database is persisted.
        k (int): Number of nearest neighbor passages to retrieve.
        collection_name (str): Name of the Chroma collection storing exam manual embeddings.
        vectordb (Chroma): The loaded Chroma vector database instance.
    """

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
        """
        Initializes the ExamManualRAGTool with embedding model selection and Chroma vector database.

        Args:
            embedding_model (str): Name of the embedding model (e.g., "text-embedding-ada-002" or HF model name).
            vectordb_dir (str): Path to the Chroma persistent storage directory.
            k (int): Number of nearest neighbor documents to retrieve.
            collection_name (str): Chroma collection name containing the embeddings.
        """
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k

        # Load the correct embedding model based on config
        if self.embedding_model.startswith("text-embedding"):
            embedder = OpenAIEmbeddings(model=self.embedding_model)
            print("[INFO] Loaded OpenAI embedding model")
        else:
            embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
            print("[INFO] Loaded HuggingFace embedding model")

        # Initialize Chroma vector database
        self.vectordb = Chroma(
            collection_name=collection_name,
            persist_directory=self.vectordb_dir,
            embedding_function=embedder
        )

        print("Number of vectors in vectordb:", self.vectordb._collection.count(), "\n\n")


@tool
def lookup_exam_manual(query: str) -> str:
    """Search the exam manual and return relevant sections. Input should be a natural language query."""
    rag_tool = ExamManualRAGTool(
        embedding_model=TOOLS_CFG.exam_manual_rag_embedding_model,
        vectordb_dir=TOOLS_CFG.exam_manual_rag_vectordb_directory,
        k=TOOLS_CFG.exam_manual_rag_k,
        collection_name=TOOLS_CFG.exam_manual_rag_collection_name
    )
    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
    return "\n\n".join([doc.page_content for doc in docs])
