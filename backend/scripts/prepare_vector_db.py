import datetime
import os
import time
import yaml
import numpy as np
from dotenv import load_dotenv
from pyprojroot import here
from tabulate import tabulate
from sklearn.metrics.pairwise import cosine_similarity
from langsmith import Client

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings


class PrepareVectorDB:
    def __init__(self,
                 doc_dir: str,
                 chunk_size: int,
                 chunk_overlap: int,
                 embedding_model: str,
                 vectordb_dir: str,
                 collection_name: str):
        self.doc_dir = doc_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.collection_name = collection_name

    def path_maker(self, file_name: str, doc_dir: str) -> str:
        """Create a full file path."""
        return os.path.join(here(doc_dir), file_name)

    def run(self, test_query=None, k=3):
        print("Run method started")
        client = Client()

        if not os.path.exists(here(self.vectordb_dir)):
            os.makedirs(here(self.vectordb_dir))
            print(f"Directory '{self.vectordb_dir}' was created.")

            # Load PDFs
            file_list = os.listdir(here(self.doc_dir))
            docs = [
                PyPDFLoader(self.path_maker(fn, self.doc_dir)).load_and_split()
                for fn in file_list
            ]
            docs_list = [item for sublist in docs for item in sublist]

            # Split into chunks
            text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
            )
            doc_splits = text_splitter.split_documents(docs_list)

            # Choose embedder
            if self.embedding_model.startswith("text-embedding"):
                embedder = OpenAIEmbeddings(model=self.embedding_model)
            else:
                embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)

            # Create VectorDB
            start_time = time.time()
            vectordb = Chroma.from_documents(
                documents=doc_splits,
                collection_name=self.collection_name,
                embedding=embedder,
                persist_directory=str(here(self.vectordb_dir))
            )
            end_time = time.time()

            num_vectors = vectordb._collection.count()
            embed_time = round(end_time - start_time, 2)

            # --- Similarity quality check ---
            avg_similarity = None
            if test_query:
                retriever = vectordb.as_retriever(search_kwargs={"k": k})
                retrieved_docs = retriever.invoke(test_query)  # Updated API

                query_embedding = embedder.embed_query(test_query)
                similarities = []
                for doc in retrieved_docs:
                    doc_embedding = embedder.embed_query(doc.page_content)
                    sim = cosine_similarity([query_embedding], [doc_embedding])[0][0]
                    similarities.append(sim)

                avg_similarity = round(float(np.mean(similarities)), 4)

            # Log to LangSmith
            # client.create_run(
                
            #     name="Embedding Run",
            #     run_type="embedding",  # Required now
            #     inputs={
            #         "model": self.embedding_model,
            #         "chunk_size": self.chunk_size,
            #         "chunk_overlap": self.chunk_overlap,
            #         "num_docs": len(docs_list),
            #         "test_query": test_query
            #     },
            #     outputs={
            #         "num_vectors": num_vectors,
            #         "embedding_time_sec": embed_time,
            #         "avg_cosine_similarity": avg_similarity
            #     },
            #     tags=["embedding-eval"]


                 
            # )
            
           

            # Terminal table output
            table_data = [
                ["Model", self.embedding_model],
                ["Chunk Size", self.chunk_size],
                ["Chunk Overlap", self.chunk_overlap],
                ["Documents Loaded", len(docs_list)],
                ["Total Chunks", len(doc_splits)],
                ["Number of Vectors", num_vectors],
                ["Embedding Time (s)", embed_time]
            ]
            if avg_similarity is not None:
                table_data.append(["Avg Cosine Similarity", avg_similarity])

            print(tabulate(table_data, headers=["Metric", "Value"], tablefmt="pretty"))
            print("\nVectorDB is created and saved.")
        else:
            print(f"Directory '{self.vectordb_dir}' already exists.")


if __name__ == "__main__":
    # Load environment variables
    load_dotenv(here("backend/.env"))
    os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

    # Load config from tools_config.yml
    config_path = here("backend/config/tools_config.yml")
    with open(config_path) as cfg:
        app_config = yaml.load(cfg, Loader=yaml.FullLoader)

    chunk_size = app_config["swiss_airline_policy_rag"]["chunk_size"]
    chunk_overlap = app_config["swiss_airline_policy_rag"]["chunk_overlap"]
    embedding_model = app_config["swiss_airline_policy_rag"]["embedding_model"]
    vectordb_dir = app_config["swiss_airline_policy_rag"]["vectordb"]
    collection_name = app_config["swiss_airline_policy_rag"]["collection_name"]
    doc_dir = app_config["swiss_airline_policy_rag"]["unstructured_docs"]

    # Run embedding and evaluation
    prepare_db_instance = PrepareVectorDB(
        doc_dir=doc_dir,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        embedding_model=embedding_model,
        vectordb_dir=vectordb_dir,
        collection_name=collection_name
    )

    prepare_db_instance.run(
        test_query="What is the Swiss Airlines 24-hour cancellation policy?",
        k=3
    )

    
