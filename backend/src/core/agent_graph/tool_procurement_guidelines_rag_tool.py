# procurement_guidelines_rag_tool.py
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig

# Load configuration
TOOLS_CFG = LoadToolsConfig()


class ProcurementGuidelinesRAGTool:
    """
    A tool for retrieving relevant sections from the Procurement Guidelines and Manual
    using a Retrieval-Augmented Generation (RAG) approach with vector embeddings.
    """

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
        """
        Initializes the ProcurementGuidelinesRAGTool with the necessary configurations.

        Args:
            embedding_model (str): Embedding model name (OpenAI or HuggingFace)
            vectordb_dir (str): Path to the Chroma DB directory
            k (int): Number of results to return
            collection_name (str): Name of the Chroma DB collection
        """
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k

        # Choose embedding model
        if self.embedding_model.startswith("text-embedding"):
            embedder = OpenAIEmbeddings(model=self.embedding_model)
            print(f"[INFO] Loaded OpenAI embedding model for Procurement Guidelines: {self.embedding_model}")
        else:
            embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
            print(f"[INFO] Loaded HuggingFace embedding model for Procurement Guidelines: {self.embedding_model}")

        # Load Chroma vector database
        self.vectordb = Chroma(
            collection_name=collection_name,
            persist_directory=self.vectordb_dir,
            embedding_function=embedder
        )
        print("Number of vectors in vectordb:", self.vectordb._collection.count(), "\n\n")


@tool
def lookup_procurement_guidelines(query: str) -> str:
    """
    Search among the procurement guidelines and find the answer to the query.

    Args:
        query (str): Query text

    Returns:
        str: Concatenated retrieved documents
    """
    rag_tool = ProcurementGuidelinesRAGTool(
        embedding_model=TOOLS_CFG.procurement_guidelines_rag_embedding_model,
        vectordb_dir=TOOLS_CFG.procurement_guidelines_rag_vectordb_directory,
        k=TOOLS_CFG.procurement_guidelines_rag_k,
        collection_name=TOOLS_CFG.procurement_guidelines_rag_collection_name
    )
    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
    return "\n\n".join([doc.page_content for doc in docs])



# from langchain_chroma import Chroma
# from langchain_openai import OpenAIEmbeddings
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_core.tools import tool
# from .load_tools_config import LoadToolsConfig

# TOOLS_CFG = LoadToolsConfig()


# class ProcurementGuidelinesRAGTool:
#     """
#     A tool for retrieving relevant sections from the Procurement Guidelines & Manual
#     using a Retrieval-Augmented Generation (RAG) approach with vector embeddings.
#     """

#     def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
#         """
#         Initializes the ProcurementGuidelinesRAGTool with necessary configurations.

#         Args:
#             embedding_model (str): Embedding model name (e.g., HuggingFace or OpenAI model).
#             vectordb_dir (str): Path where the Chroma DB is stored.
#             k (int): Number of results to return.
#             collection_name (str): Name of the Chroma DB collection.
#         """
#         self.embedding_model = embedding_model
#         self.vectordb_dir = vectordb_dir
#         self.k = k

#         # Choose embedding model type
#         if self.embedding_model.startswith("text-embedding"):
#             embedder = OpenAIEmbeddings(model=self.embedding_model)
#             print(f"[INFO] Loaded OpenAI embedding model for Procurement Guidelines: {self.embedding_model}")
#         else:
#             embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
#             print(f"[INFO] Loaded HuggingFace embedding model for Procurement Guidelines: {self.embedding_model}")

#         # Load Chroma vectordb
#         self.vectordb = Chroma(
#             collection_name=collection_name,
#             persist_directory=self.vectordb_dir,
#             embedding_function=embedder
#         )
#         print(f"[INFO] Loaded Procurement Guidelines vectordb from: {self.vectordb_dir}")
#         print("Number of vectors in vectordb:", self.vectordb._collection.count(), "\n\n")


# @tool
# def lookup_procurement_guidelines(query: str) -> str:
#     """
#     Search among the Procurement Guidelines and Manual to find the answer to a query.
#     Input should be the query text.
#     """
#     rag_tool = ProcurementGuidelinesRAGTool(
#         embedding_model=TOOLS_CFG.procurement_guidelines_rag_embedding_model,
#         vectordb_dir=TOOLS_CFG.procurement_guidelines_rag_vectordb_directory,
#         k=TOOLS_CFG.procurement_guidelines_rag_k,
#         collection_name=TOOLS_CFG.procurement_guidelines_rag_collection_name
#     )
#     docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
#     return "\n\n".join([doc.page_content for doc in docs])
