
#--------------3 pdf avg cosine----=================================----------------------------------=======================================----------------

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
                 name: str,
                 doc_dir: str,
                 chunk_size: int,
                 chunk_overlap: int,
                 embedding_model: str,
                 vectordb_dir: str,
                 collection_name: str):
        self.name = name
        self.doc_dir = doc_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model
        self.vectordb_dir = vectordb_dir
        self.collection_name = collection_name

    def path_maker(self, file_name: str, doc_dir: str) -> str:
        return os.path.join(here(doc_dir), file_name)

    def run(self, test_queries, k=3):
        print(f"\n=== Running for {self.name} [{self.embedding_model}] ===")
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

        # Split
        text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
        )
        doc_splits = text_splitter.split_documents(docs_list)

        # Embedder
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

        # Avg cosine similarity calculation
        retriever = vectordb.as_retriever(search_kwargs={"k": k})
        cosines = []

        for q in test_queries:
            retrieved_docs = retriever.invoke(q)
            query_embedding = embedder.embed_query(q)

            sims = []
            for doc in retrieved_docs:
                doc_embedding = embedder.embed_query(doc.page_content)
                sims.append(cosine_similarity([query_embedding], [doc_embedding])[0][0])
            cosines.append(np.mean(sims))

        avg_cosine = float(np.mean(cosines))

        # Table output (only Avg Cosine + basic info)
        table_data = [
            ["Model", self.embedding_model],
            ["Chunk Size", self.chunk_size],
            ["Chunk Overlap", self.chunk_overlap],
            ["Documents Loaded", len(docs_list)],
            ["Total Chunks", len(doc_splits)],
            ["Number of Vectors", num_vectors],
            ["Embedding Time (s)", embed_time],
            ["Avg Cosine Similarity", round(avg_cosine, 4)]
        ]
        print(tabulate(table_data, headers=["Metric", "Value"], tablefmt="pretty"))
        print("VectorDB created and evaluated.\n")

        return {
            "Document": self.name,
            "Model": self.embedding_model,
            "Chunk Size": self.chunk_size,
            "Overlap": self.chunk_overlap,
            "Documents Loaded": len(docs_list),
            "Total Chunks": len(doc_splits),
            "Embedding Time (s)": embed_time,
            "Avg Cosine": avg_cosine
        }


if __name__ == "__main__":
    load_dotenv(here(".env"))
    os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

    config_path = here("config/tools_config.yml")
    with open(config_path) as cfg:
        app_config = yaml.load(cfg, Loader=yaml.FullLoader)

    # Test queries aligned with your docs
    queries_exam = [
        "What are the general rules that examiners must follow during an examination?",
        "How should examiners handle conflicts of interest?"
    ]
    queries_handbook = [
        "What is the minimum attendance requirement for theory classes?",
        "When should medical certificates be submitted for absences?"
    ]
    queries_airline = [
        "How can I cancel a Swiss Air flight?",
        "What is the Swiss Airlines cancellation policy for different fare types?"
    ]

    datasets = [
        ("Exam Manual", "exam_manual_rag", queries_exam),
        ("Student Handbook", "student_handbook_rag", queries_handbook),
        ("Swiss Airline Policy", "swiss_airline_policy_rag", queries_airline)
    ]

    summary_results = []

    for name, key, queries in datasets:
        cfg = app_config[key]
        prepare = PrepareVectorDB(
            name=name,
            doc_dir=cfg["unstructured_docs"],
            chunk_size=cfg["chunk_size"],
            chunk_overlap=cfg["chunk_overlap"],
            embedding_model=cfg["embedding_model"],
            vectordb_dir=cfg["vectordb"],
            collection_name=cfg["collection_name"]
        )
        metrics = prepare.run(test_queries=queries, k=cfg["k"])
        summary_results.append(metrics)

    # Final summary table (only Avg Cosine + basic info)
    print("\n=== Final Summary Comparison ===")
    table = []
    for r in summary_results:
        table.append([
            r["Document"], r["Model"], r["Chunk Size"], r["Overlap"],
            r["Documents Loaded"], r["Total Chunks"], r["Embedding Time (s)"],
            round(r["Avg Cosine"], 4)
        ])
    print(tabulate(table, headers=[
        "Document", "Model", "Chunk", "Overlap", "Doc Loaded", "Total Chunks", "Time(s)", "Avg Cosine"
    ], tablefmt="pretty"))

######################## we want to next enhancement --- three results with correct matrics -----------------------------

# import datetime
# import os
# import time
# import yaml
# import numpy as np
# from dotenv import load_dotenv
# from pyprojroot import here
# from tabulate import tabulate
# from sklearn.metrics.pairwise import cosine_similarity
# from langsmith import Client

# from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import Chroma
# from langchain_openai import OpenAIEmbeddings
# from langchain_community.embeddings import HuggingFaceEmbeddings

# # ------------------ Metrics ------------------
# def recall_at_k(relevant_ids, retrieved_ids, k):
#     if not relevant_ids:
#         return 0.0
#     return 1.0 if any(r in retrieved_ids[:k] for r in relevant_ids) else 0.0

# def reciprocal_rank(relevant_ids, retrieved_ids):
#     if not relevant_ids:
#         return 0.0
#     for i, rid in enumerate(retrieved_ids, start=1):
#         if rid in relevant_ids:
#             return 1.0 / i
#     return 0.0

# def precision_at_k(relevant_ids, retrieved_ids, k):
#     if not relevant_ids:
#         return 0.0
#     return sum(1 for r in retrieved_ids[:k] if r in relevant_ids) / k


# class PrepareVectorDB:
#     def __init__(self,
#                  name: str,
#                  doc_dir: str,
#                  chunk_size: int,
#                  chunk_overlap: int,
#                  embedding_model: str,
#                  vectordb_dir: str,
#                  collection_name: str,
#                  ground_truth: dict):
#         self.name = name
#         self.doc_dir = doc_dir
#         self.chunk_size = chunk_size
#         self.chunk_overlap = chunk_overlap
#         self.embedding_model = embedding_model
#         self.vectordb_dir = vectordb_dir
#         self.collection_name = collection_name
#         self.ground_truth = ground_truth

#     def path_maker(self, file_name: str, doc_dir: str) -> str:
#         return os.path.join(here(doc_dir), file_name)

#     def run(self, test_queries, k=3):
#         print(f"\n=== Running for {self.name} [{self.embedding_model}] ===")
#         if not os.path.exists(here(self.vectordb_dir)):
#             os.makedirs(here(self.vectordb_dir))
#             print(f"Directory '{self.vectordb_dir}' was created.")

#         # Load PDFs
#         file_list = os.listdir(here(self.doc_dir))
#         docs = [
#             PyPDFLoader(self.path_maker(fn, self.doc_dir)).load_and_split()
#             for fn in file_list
#         ]
#         docs_list = [item for sublist in docs for item in sublist]

#         # Split
#         text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
#             chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
#         )
#         doc_splits = text_splitter.split_documents(docs_list)

#         # Embedder
#         if self.embedding_model.startswith("text-embedding"):
#             embedder = OpenAIEmbeddings(model=self.embedding_model)
#         else:
#             embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)

#         # Create VectorDB
#         start_time = time.time()
#         vectordb = Chroma.from_documents(
#             documents=doc_splits,
#             collection_name=self.collection_name,
#             embedding=embedder,
#             persist_directory=str(here(self.vectordb_dir))
#         )
#         end_time = time.time()

#         num_vectors = vectordb._collection.count()
#         embed_time = round(end_time - start_time, 2)

#         # Evaluation metrics
#         retriever = vectordb.as_retriever(search_kwargs={"k": k})
#         recalls, mrrs, precisions, cosines = [], [], [], []

#         for q in test_queries:
#             retrieved_docs = retriever.invoke(q)
#             query_embedding = embedder.embed_query(q)
#             retrieved_ids = [doc.metadata.get("source", str(i)) for i, doc in enumerate(retrieved_docs)]

#             # Get real ground truth IDs
#             relevant_ids = self.ground_truth.get(q, [])

#             recalls.append(recall_at_k(relevant_ids, retrieved_ids, k))
#             mrrs.append(reciprocal_rank(relevant_ids, retrieved_ids))
#             precisions.append(precision_at_k(relevant_ids, retrieved_ids, k))

#             sims = []
#             for doc in retrieved_docs:
#                 doc_embedding = embedder.embed_query(doc.page_content)
#                 sims.append(cosine_similarity([query_embedding], [doc_embedding])[0][0])
#             cosines.append(np.mean(sims))

#         results = {
#             "recall": float(np.mean(recalls)),
#             "mrr": float(np.mean(mrrs)),
#             "precision": float(np.mean(precisions)),
#             "avg_cosine": float(np.mean(cosines))
#         }

#         # Table output
#         table_data = [
#             ["Model", self.embedding_model],
#             ["Chunk Size", self.chunk_size],
#             ["Chunk Overlap", self.chunk_overlap],
#             ["Documents Loaded", len(docs_list)],
#             ["Total Chunks", len(doc_splits)],
#             ["Number of Vectors", num_vectors],
#             ["Embedding Time (s)", embed_time],
#             [f"Recall@{k}", round(results["recall"], 4)],
#             ["MRR", round(results["mrr"], 4)],
#             [f"Precision@{k}", round(results["precision"], 4)],
#             ["Avg Cosine Similarity", round(results["avg_cosine"], 4)]
#         ]
#         print(tabulate(table_data, headers=["Metric", "Value"], tablefmt="pretty"))
#         print("VectorDB created and evaluated.\n")

#         return results


# if __name__ == "__main__":
#     load_dotenv(here(".env"))
#     os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

#     config_path = here("config/tools_config.yml")
#     with open(config_path) as cfg:
#         app_config = yaml.load(cfg, Loader=yaml.FullLoader)

#     # === Ground truth labels from PDF content ===
#     ground_truth = {
#         "What are the general rules that examiners must follow during an examination?": ["manual_chunk_8_rules"],
#         "How should examiners handle conflicts of interest?": ["manual_chunk_3_conflict"],

#         "What is the minimum attendance requirement for theory classes?": ["handbook_chunk_3_attendance"],
#         "When should medical certificates be submitted for absences?": ["handbook_chunk_3_medical"],

#         "How can I cancel a Swiss Air flight?": ["airline_chunk_cancel"],
#         "What is the Swiss Airlines cancellation policy for different fare types?": ["airline_chunk_policy"]
#     }

#     # Test queries aligned with your docs
#     queries_exam = [
#         "What are the general rules that examiners must follow during an examination?",
#         "How should examiners handle conflicts of interest?"
#     ]
#     queries_handbook = [
#         "What is the minimum attendance requirement for theory classes?",
#         "When should medical certificates be submitted for absences?"
#     ]
#     queries_airline = [
#         "How can I cancel a Swiss Air flight?",
#         "What is the Swiss Airlines cancellation policy for different fare types?"
#     ]

#     datasets = [
#         ("Exam Manual", "exam_manual_rag", queries_exam),
#         ("Student Handbook", "student_handbook_rag", queries_handbook),
#         ("Swiss Airline Policy", "swiss_airline_policy_rag", queries_airline)
#     ]

#     summary_results = []

#     for name, key, queries in datasets:
#         cfg = app_config[key]
#         prepare = PrepareVectorDB(
#             name=name,
#             doc_dir=cfg["unstructured_docs"],
#             chunk_size=cfg["chunk_size"],
#             chunk_overlap=cfg["chunk_overlap"],
#             embedding_model=cfg["embedding_model"],
#             vectordb_dir=cfg["vectordb"],
#             collection_name=cfg["collection_name"],
#             ground_truth=ground_truth
#         )
#         metrics = prepare.run(test_queries=queries, k=cfg["k"])

#         summary_results.append({
#             "Document": name,
#             "Model": cfg["embedding_model"],
#             "Chunk Size": cfg["chunk_size"],
#             "Overlap": cfg["chunk_overlap"],
#             f"Recall@{cfg['k']}": metrics["recall"],
#             "Precision": metrics["precision"],
#             "MRR": metrics["mrr"],
#             "Avg Cosine": metrics["avg_cosine"]
#         })

#     # Final summary table
#     print("\n=== Final Summary Comparison ===")
#     table = []
#     for r in summary_results:
#         table.append([
#             r["Document"], r["Model"], r["Chunk Size"], r["Overlap"],
#             round(r[f"Recall@{cfg['k']}"], 4),
#             round(r["Precision"], 4),
#             round(r["MRR"], 4),
#             round(r["Avg Cosine"], 4)
#         ])
#     print(tabulate(table, headers=[
#         "Document", "Model", "Chunk", "Overlap", "Recall", "Precision", "MRR", "Avg Cosine"
#     ], tablefmt="pretty"))
