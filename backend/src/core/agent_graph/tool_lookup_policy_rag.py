# #==============================================================================================================================================================
# #---- 87s->5s ------- Create EMBEDDER once at module import time (outside any class) and reuse it in all instances -----------------------------------------------------------------
# #==============================================================================================================================================================


# from langchain_chroma import Chroma
# from langchain_openai import OpenAIEmbeddings
# from langchain_core.tools import tool
# from .load_tools_config import LoadToolsConfig
# from langchain_community.embeddings import HuggingFaceEmbeddings

# TOOLS_CFG = LoadToolsConfig()

# # Load embedding model ONCE when module loads
# if TOOLS_CFG.policy_rag_embedding_model.startswith("text-embedding"):
#     EMBEDDER = OpenAIEmbeddings(model=TOOLS_CFG.policy_rag_embedding_model)
#     print("[INFO] Loaded OpenAI embedding model")
# else:
#     EMBEDDER = HuggingFaceEmbeddings(
#         model_name=TOOLS_CFG.policy_rag_embedding_model,
#         # Optional: run on GPU if available
#         #model_kwargs={"device": "cuda"}
#     )
#     print("[INFO] Loaded Hugging Face embedding model")

# # Load Chroma vectordb ONCE when module loads
# VECTORDB = Chroma(
#     collection_name=TOOLS_CFG.policy_rag_collection_name,
#     persist_directory=TOOLS_CFG.policy_rag_vectordb_directory,
#     embedding_function=EMBEDDER
# )

# print("Number of vectors in vectordb:", VECTORDB._collection.count(), "\n\n")


# class SwissAirlinePolicyRAGTool:
#     """
#     Retrieves Swiss Airline policy documents using RAG.
#     """

#     def __init__(self, k: int) -> None:
#         self.k = k
#         self.vectordb = VECTORDB  # reuse already-loaded vectordb


# @tool
# def lookup_swiss_airline_policy(query: str) -> str:
#     """Consult the company policies to check whether certain options are permitted."""
#     rag_tool = SwissAirlinePolicyRAGTool(k=TOOLS_CFG.policy_rag_k)
#     docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
#     return "\n\n".join([doc.page_content for doc in docs])


# #==============================================================================================================================================================
# #---- 5s->2s ------- with GPU Access ----- Persistent DB fallback ----- Single initialization -----------------------------------------------------------------
# #==============================================================================================================================================================


# # from langchain_chroma import Chroma
# # from langchain_openai import OpenAIEmbeddings
# # from langchain_core.tools import tool
# # from .load_tools_config import LoadToolsConfig
# # from langchain_community.embeddings import HuggingFaceEmbeddings
# # import torch
# # import os

# # TOOLS_CFG = LoadToolsConfig()

# # # Detect device automatically
# # device = "cuda" if torch.cuda.is_available() else "cpu"
# # print(f"[INFO] Using device for embeddings: {device}")

# # # Load embedding model ONCE
# # if TOOLS_CFG.policy_rag_embedding_model.startswith("text-embedding"):
# #     EMBEDDER = OpenAIEmbeddings(model=TOOLS_CFG.policy_rag_embedding_model)
# # else:
# #     EMBEDDER = HuggingFaceEmbeddings(
# #         model_name=TOOLS_CFG.policy_rag_embedding_model,
# #         model_kwargs={"device": device}
# #     )

# # # Load Chroma vector DB ONCE
# # # Try to load in-memory for fastest search; fall back to persisted DB
# # try:
# #     VECTORDB = Chroma(
# #         collection_name=TOOLS_CFG.policy_rag_collection_name,
# #         persist_directory=None,  # in-memory for max speed
# #         embedding_function=EMBEDDER
# #     )

# #     # Optional: If you still want to preload from persisted DB data
# #     if os.path.exists(TOOLS_CFG.policy_rag_vectordb_directory):
# #         temp_db = Chroma(
# #             collection_name=TOOLS_CFG.policy_rag_collection_name,
# #             persist_directory=TOOLS_CFG.policy_rag_vectordb_directory,
# #             embedding_function=EMBEDDER
# #         )
# #         # Copy all docs into memory-based DB
# #         VECTORDB.add_documents(temp_db.get())
# #         print("[INFO] Loaded Chroma into memory from persisted DB")

# # except Exception as e:
# #     print(f"[WARN] In-memory DB load failed: {e}")
# #     print("[INFO] Falling back to persisted Chroma DB...")
# #     VECTORDB = Chroma(
# #         collection_name=TOOLS_CFG.policy_rag_collection_name,
# #         persist_directory=TOOLS_CFG.policy_rag_vectordb_directory,
# #         embedding_function=EMBEDDER
# #     )

# # print("Number of vectors in vectordb:", VECTORDB._collection.count(), "\n\n")


# # class SwissAirlinePolicyRAGTool:
# #     """
# #     Retrieves Swiss Airline policy documents using RAG.
# #     """

# #     def __init__(self, k: int) -> None:
# #         self.k = k
# #         self.vectordb = VECTORDB  # reuse already-loaded vectordb


# # @tool
# # def lookup_swiss_airline_policy(query: str) -> str:
# #     """Consult the company policies to check whether certain options are permitted."""
# #     rag_tool = SwissAirlinePolicyRAGTool(k=TOOLS_CFG.policy_rag_k)
# #     docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
# #     return "\n\n".join([doc.page_content for doc in docs])



# #==============================================================================================================================================================
# #---- 87s------- First pure code ------------------------------------------------------------------------------------------------------------------------------
# #==============================================================================================================================================================



# # from langchain_chroma import Chroma
# # from langchain_openai import OpenAIEmbeddings
# # from langchain_core.tools import tool
# # from .load_tools_config import LoadToolsConfig
# # from langchain_community.embeddings import HuggingFaceEmbeddings


# # TOOLS_CFG = LoadToolsConfig()


# # class SwissAirlinePolicyRAGTool:
# #     """
# #     A tool for retrieving relevant Swiss Airline policy documents using a 
# #     Retrieval-Augmented Generation (RAG) approach with vector embeddings.

# #     This tool uses a pre-trained OpenAI embedding model to transform queries into 
# #     vector representations. These vectors are then used to query a Chroma-based 
# #     vector database (persisted on disk) to retrieve the top-k most relevant 
# #     documents or entries from a specific collection, such as Swiss Airline policies.

# #     Attributes:
# #         embedding_model (str): The name of the OpenAI embedding model used for 
# #             generating vector representations of the queries.
# #         vectordb_dir (str): The directory where the Chroma vector database is 
# #             persisted on disk.
# #         k (int): The number of top-k nearest neighbors (most relevant documents) 
# #             to retrieve from the vector database.
# #         vectordb (Chroma): The Chroma vector database instance connected to the 
# #             specified collection and embedding model.

# #     Methods:
# #         __init__: Initializes the tool by setting up the embedding model, 
# #             vector database, and retrieval parameters.
# #     """

# #     def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str) -> None:
# #         """
# #         Initializes the SwissAirlinePolicyRAGTool with the necessary configuration.

# #         Args:
# #             embedding_model (str): The name of the embedding model (e.g., "text-embedding-ada-002")
# #                 used to convert queries into vector representations.
# #             vectordb_dir (str): The directory path where the Chroma vector database is stored 
# #                 and persisted on disk.
# #             k (int): The number of nearest neighbor documents to retrieve based on query similarity.
# #             collection_name (str): The name of the collection inside the vector database that holds 
# #                 the Swiss Airline policy documents.
# #         """
# #         self.embedding_model = embedding_model
# #         self.vectordb_dir = vectordb_dir
# #         self.k = k

# #         if embedding_model.startswith("text-embedding"):
# #             embedder = OpenAIEmbeddings(model=embedding_model)
# #         else:
# #             embedder = HuggingFaceEmbeddings(model_name=embedding_model)

# #         self.vectordb = Chroma(
# #             collection_name=collection_name,
# #             persist_directory=self.vectordb_dir,
# #             embedding_function=embedder     
# #         )
# #         print("Number of vectors in vectordb:",
# #               self.vectordb._collection.count(), "\n\n")


# # @tool
# # def lookup_swiss_airline_policy(query: str) -> str:
# #     """Consult the company policies to check whether certain options are permitted."""
# #     rag_tool = SwissAirlinePolicyRAGTool(
# #         embedding_model=TOOLS_CFG.policy_rag_embedding_model,
# #         vectordb_dir=TOOLS_CFG.policy_rag_vectordb_directory,
# #         k=TOOLS_CFG.policy_rag_k,
# #         collection_name=TOOLS_CFG.policy_rag_collection_name)
# #     docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
# #     return "\n\n".join([doc.page_content for doc in docs])




