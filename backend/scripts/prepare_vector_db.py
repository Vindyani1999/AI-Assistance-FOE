####################### we want to next enhancement --- three results with correct matrics -----------------------------

import datetime
import os
import time  
import yaml
import re
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



# ===============================
# Preprocessing Function
# ===============================
def clean_text(text: str) -> str:
    """
    Cleans extracted text before chunking:
    - Remove headers/footers (batch/year lines)
    - Remove excessive dot leaders (TOC)
    - Fix only *true* word splits (hyphenation or line-break splits)
    - Preserve normal spaces and paragraph boundaries
    """
    text = text.replace("\u00ad", "")  # remove discretionary/soft hyphens
    text = re.sub(r"\.{4,}", " ", text)  # remove dot leaders

    # remove repeated headers like "Academic Year 2022/2023, 24th Batch"
    text = re.sub(
        r"(?im)^[^\n]*Academic\s*Year\s*20\d{2}\s*/\s*20\d{2}[^\n]*Batch[^\n]*\n?",
        "",
        text,
    )

    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)  # fix hyphenated words
    text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1\2", text)  # fix line breaks in words

    text = re.sub(r"[ \t]+", " ", text)  # collapse spaces
    text = re.sub(r"\n{3,}", "\n\n", text).strip()  # normalize paragraph breaks

    return text


# ===============================
# Main VectorDB Class
# ===============================
class PrepareVectorDB:
    def __init__(
        self,
        name: str,
        doc_dir: str,
        chunk_size: int,
        chunk_overlap: int,
        embedding_model: str,
        vectordb_dir: str,
        collection_name: str,
    ):
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

        # --- PREPROCESSING STEP ---
        for doc in docs_list:
            doc.page_content = clean_text(doc.page_content)

        # Split into chunks
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
            persist_directory=str(here(self.vectordb_dir)),
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
                sims.append(
                    cosine_similarity([query_embedding], [doc_embedding])[0][0]
                )
            cosines.append(np.mean(sims))

        avg_cosine = float(np.mean(cosines))

        # Table output
        table_data = [
            ["Model", self.embedding_model],
            ["Chunk Size", self.chunk_size],
            ["Chunk Overlap", self.chunk_overlap],
            ["Documents Loaded", len(docs_list)],
            ["Total Chunks", len(doc_splits)],
            ["Number of Vectors", num_vectors],
            ["Embedding Time (s)", embed_time],
            ["Avg Cosine Similarity", round(avg_cosine, 4)],
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
            "Avg Cosine": avg_cosine,
        }


# ===============================
# Main Script
# ===============================
if __name__ == "__main__":
    load_dotenv(here(".env"))
    os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

    config_path = here("config/tools_config.yml")
    with open(config_path) as cfg:
        app_config = yaml.load(cfg, Loader=yaml.FullLoader)

    # Test queries aligned with your docs
    queries_exam = [
        "What are the general rules that examiners must follow during an examination?",
        "How should examiners handle conflicts of interest?",
    ]
    queries_handbook = [
        "What is the minimum attendance requirement for theory classes?",
        "When should medical certificates be submitted for absences?",
    ]
    procurement_guidelines = [
        "What are the main steps in the national procurement process?",
        "What are the thresholds for different procurement methods?",
        "How is bid evaluation carried out according to the NPA manual?",
    ]
    queries_by_law = [
        "How many core modules are there in the Civil and Environmental Engineering ?",
        "How many core modules are there in the Electrical and Information Engineering  ?",
    ]

    datasets = [
        ("Exam Manual", "exam_manual_rag", queries_exam),
        ("Student Handbook", "student_handbook_rag", queries_handbook),
        # ("Swiss Airline Policy", "swiss_airline_policy_rag", queries_airline),
        ("By Law", "by_law_rag", queries_by_law),
        ("Procurement Guidelines and Manual", "procurement_guidelines_rag", procurement_guidelines )
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
            collection_name=cfg["collection_name"],
        )
        metrics = prepare.run(test_queries=queries, k=cfg["k"])
        summary_results.append(metrics)

    # Final summary table
    print("\n=== Final Summary Comparison ===")
    table = []
    for r in summary_results:
        table.append(
            [
                r["Document"],
                r["Model"],
                r["Chunk Size"],
                r["Overlap"],
                r["Documents Loaded"],
                r["Total Chunks"],
                r["Embedding Time (s)"],
                round(r["Avg Cosine"], 4),
            ]
        )
    print(
        tabulate(
            table,
            headers=[
                "Document",
                "Model",
                "Chunk",
                "Overlap",
                "Doc Loaded",
                "Total Chunks",
                "Time(s)",
                "Avg Cosine",
            ],
            tablefmt="pretty",
        )
    )


# import datetime
# import os
# import time
# import yaml
# import re
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


# # ===============================
# # Preprocessing Function
# # ===============================
# def clean_text(text: str) -> str:
#     """
#     Cleans extracted text before chunking:
#     - Remove headers/footers (batch/year lines)
#     - Remove excessive dot leaders (TOC)
#     - Fix only *true* word splits (hyphenation or line-break splits)
#     - Preserve normal spaces and paragraph boundaries
#     """
#     text = text.replace("\u00ad", "")  # remove discretionary/soft hyphens
#     text = re.sub(r"\.{4,}", " ", text)  # remove dot leaders

#     # remove repeated headers like "Academic Year 2022/2023, 24th Batch"
#     text = re.sub(
#         r"(?im)^[^\n]*Academic\s*Year\s*20\d{2}\s*/\s*20\d{2}[^\n]*Batch[^\n]*\n?",
#         "",
#         text,
#     )

#     text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)  # fix hyphenated words
#     text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1\2", text)  # fix line breaks in words

#     text = re.sub(r"[ \t]+", " ", text)  # collapse spaces
#     text = re.sub(r"\n{3,}", "\n\n", text).strip()  # normalize paragraph breaks

#     return text


# # ===============================
# # Main VectorDB Class
# # ===============================
# class PrepareVectorDB:
#     def __init__(
#         self,
#         name: str,
#         doc_dir: str,
#         chunk_size: int,
#         chunk_overlap: int,
#         embedding_model: str,
#         vectordb_dir: str,
#         collection_name: str,
#         volume_files: list = None,  # NEW: optional for multi-volume support
#     ):
#         self.name = name
#         self.doc_dir = doc_dir
#         self.chunk_size = chunk_size
#         self.chunk_overlap = chunk_overlap
#         self.embedding_model = embedding_model
#         self.vectordb_dir = vectordb_dir
#         self.collection_name = collection_name
#         self.volume_files = volume_files or []

#     def path_maker(self, file_name: str, doc_dir: str) -> str:
#         return os.path.join(here(doc_dir), file_name)

#     def run(self, test_queries, k=3):
#         print(f"\n=== Running for {self.name} [{self.embedding_model}] ===")
#         if not os.path.exists(here(self.vectordb_dir)):
#             os.makedirs(here(self.vectordb_dir))
#             print(f"Directory '{self.vectordb_dir}' was created.")

#         docs_list = []

#         # ===============================
#         # Load PDFs (with optional volume tagging)
#         # ===============================
#         if self.volume_files:
#             print(f"Loading multiple volumes: {', '.join(self.volume_files)}")
#             for file_name in self.volume_files:
#                 loader = PyPDFLoader(self.path_maker(file_name, self.doc_dir))
#                 loaded_docs = loader.load_and_split()
#                 volume_tag = (
#                     "Vol I" if "I" in file_name else "Vol II"
#                 )  # basic auto-tagging
#                 for doc in loaded_docs:
#                     doc.metadata["volume"] = volume_tag
#                 docs_list.extend(loaded_docs)
#         else:
#             file_list = os.listdir(here(self.doc_dir))
#             docs = [
#                 PyPDFLoader(self.path_maker(fn, self.doc_dir)).load_and_split()
#                 for fn in file_list
#             ]
#             docs_list = [item for sublist in docs for item in sublist]

#         # --- PREPROCESSING STEP ---
#         for doc in docs_list:
#             doc.page_content = clean_text(doc.page_content)

#         # Split into chunks
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
#             persist_directory=str(here(self.vectordb_dir)),
#         )
#         end_time = time.time()

#         num_vectors = vectordb._collection.count()
#         embed_time = round(end_time - start_time, 2)

#         # Avg cosine similarity calculation
#         retriever = vectordb.as_retriever(search_kwargs={"k": k})
#         cosines = []

#         for q in test_queries:
#             retrieved_docs = retriever.invoke(q)
#             query_embedding = embedder.embed_query(q)

#             sims = []
#             for doc in retrieved_docs:
#                 doc_embedding = embedder.embed_query(doc.page_content)
#                 sims.append(
#                     cosine_similarity([query_embedding], [doc_embedding])[0][0]
#                 )
#             cosines.append(np.mean(sims))

#         avg_cosine = float(np.mean(cosines))

#         # Table output
#         table_data = [
#             ["Model", self.embedding_model],
#             ["Chunk Size", self.chunk_size],
#             ["Chunk Overlap", self.chunk_overlap],
#             ["Documents Loaded", len(docs_list)],
#             ["Total Chunks", len(doc_splits)],
#             ["Number of Vectors", num_vectors],
#             ["Embedding Time (s)", embed_time],
#             ["Avg Cosine Similarity", round(avg_cosine, 4)],
#         ]
#         print(tabulate(table_data, headers=["Metric", "Value"], tablefmt="pretty"))
#         print("VectorDB created and evaluated.\n")

#         return {
#             "Document": self.name,
#             "Model": self.embedding_model,
#             "Chunk Size": self.chunk_size,
#             "Overlap": self.chunk_overlap,
#             "Documents Loaded": len(docs_list),
#             "Total Chunks": len(doc_splits),
#             "Embedding Time (s)": embed_time,
#             "Avg Cosine": avg_cosine,
#         }


# # ===============================
# # Main Script
# # ===============================
# if __name__ == "__main__":
#     load_dotenv(here(".env"))
#     os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

#     config_path = here("config/tools_config.yml")
#     with open(config_path) as cfg:
#         app_config = yaml.load(cfg, Loader=yaml.FullLoader)

#     # Test queries aligned with your docs
#     queries_exam = [
#         "What are the general rules that examiners must follow during an examination?",
#         "How should examiners handle conflicts of interest?",
#     ]
#     queries_handbook = [
#         "What is the minimum attendance requirement for theory classes?",
#         "When should medical certificates be submitted for absences?",
#     ]
#     procurement_guidelines = [
#         "What are the thresholds for different procurement methods?",
#         "How is bid evaluation carried out according to the NPA manual?",
#     ]
#     queries_by_law = [
#         "How many core modules are there in the Civil and Environmental Engineering?",
#         "How many core modules are there in the Electrical and Information Engineering?",
#     ]
#     # queries_establishment = [
#     #     "What are the rules for employee transfers under the Establishment Code?",
#     #     "Who is responsible for approving leave in the Establishment Code?",
#     # ]

#     datasets = [
#         ("Exam Manual", "exam_manual_rag", queries_exam),
#         ("Student Handbook", "student_handbook_rag", queries_handbook),
#         ("By Law", "by_law_rag", queries_by_law),
#         ("Procurement Guidelines and Manual", "procurement_guidelines_rag", procurement_guidelines),
#         #(
#         #     "Establishment Code (Vol I & II)",
#         #     "establishment_code_rag",
#         #     queries_establishment,
#         # ),
#     ]

#     summary_results = []

#     for name, key, queries in datasets:
#         cfg = app_config[key]

#         # Add Establishment Code multi-volume support
#         if name.startswith("Establishment Code"):
#             prepare = PrepareVectorDB(
#                 name=name,
#                 doc_dir=cfg["unstructured_docs"],
#                 chunk_size=cfg["chunk_size"],
#                 chunk_overlap=cfg["chunk_overlap"],
#                 embedding_model=cfg["embedding_model"],
#                 vectordb_dir=cfg["vectordb"],
#                 collection_name=cfg["collection_name"],
#                 volume_files=["Establishment_Code_Vol_I.pdf", "Establishment_Code_Vol_II.pdf"],
#             )
#         else:
#             prepare = PrepareVectorDB(
#                 name=name,
#                 doc_dir=cfg["unstructured_docs"],
#                 chunk_size=cfg["chunk_size"],
#                 chunk_overlap=cfg["chunk_overlap"],
#                 embedding_model=cfg["embedding_model"],
#                 vectordb_dir=cfg["vectordb"],
#                 collection_name=cfg["collection_name"],
#             )

#         metrics = prepare.run(test_queries=queries, k=cfg["k"])
#         summary_results.append(metrics)

#     # Final summary table
#     print("\n=== Final Summary Comparison ===")
#     table = []
#     for r in summary_results:
#         table.append(
#             [
#                 r["Document"],
#                 r["Model"],
#                 r["Chunk Size"],
#                 r["Overlap"],
#                 r["Documents Loaded"],
#                 r["Total Chunks"],
#                 r["Embedding Time (s)"],
#                 round(r["Avg Cosine"], 4),
#             ]
#         )
#     print(
#         tabulate(
#             table,
#             headers=[
#                 "Document",
#                 "Model",
#                 "Chunk",
#                 "Overlap",
#                 "Doc Loaded",
#                 "Total Chunks",
#                 "Time(s)",
#                 "Avg Cosine",
#             ],
#             tablefmt="pretty",
#         )
#     )
