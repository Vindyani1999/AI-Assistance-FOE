from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig

TOOLS_CFG = LoadToolsConfig()


class UGCCircularsRAGTool:
    """RAG tool to retrieve relevant UGC Circular sections using HuggingFace embeddings."""

    def __init__(self, embedding_model: str, vectordb_dir: str, k: int, collection_name: str):
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.k = k

        embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)
        print(f"[INFO] Loaded HuggingFace embedding model: {self.embedding_model}")

        self.vectordb = Chroma(
            collection_name=collection_name,
            persist_directory=self.vectordb_dir,
            embedding_function=embedder
        )

        print("Number of vectors in UGC Circulars vectordb:", self.vectordb._collection.count(), "\n\n")


@tool
def lookup_ugc_circulars(query: str) -> str:
    """Search UGC Circulars and return relevant sections based on user query."""
    rag_tool = UGCCircularsRAGTool(
        embedding_model=TOOLS_CFG.ugc_circulars_rag_embedding_model,
        vectordb_dir=TOOLS_CFG.ugc_circulars_rag_vectordb_directory,
        k=TOOLS_CFG.ugc_circulars_rag_k,
        collection_name=TOOLS_CFG.ugc_circulars_rag_collection_name
    )
    docs = rag_tool.vectordb.similarity_search(query, k=rag_tool.k)
    return "\n\n".join([doc.page_content for doc in docs])
