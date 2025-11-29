import os
import re
import time
import platform
import shutil
import numpy as np
from pyprojroot import here
from PIL import Image
from pdf2image import convert_from_path, pdfinfo_from_path
import pytesseract
from tabulate import tabulate
from sklearn.metrics.pairwise import cosine_similarity

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# ===============================
# Configure Tesseract (Windows)
# ===============================
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"

# ===============================
# Configure Poppler path (Windows)
# ===============================
if platform.system() == "Windows":
    POPPLER_PATH = r"C:\Release-25.11.0-0\poppler-25.11.0\Library\bin"
else:
    POPPLER_PATH = None


# ===============================
# Preprocessing Function
# ===============================
def clean_text(text: str) -> str:
    """
    Cleans extracted text before chunking.
    Removes headers/footers, fixes broken words, removes dot leaders, etc.
    """
    text = text.replace("\u00ad", "")
    text = re.sub(r"\.{4,}", " ", text)
    text = re.sub(
        r"(?im)^[^\n]*Academic\s*Year\s*20\d{2}\s*/\s*20\d{2}[^\n]*Batch[^\n]*\n?",
        "",
        text,
    )
    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)
    text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1\2", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


# ===============================
# Load PDF with OCR (Batched)
# ===============================
def load_pdf_with_ocr(pdf_path: str, batch_size: int = 10):
    print(f"OCR Extracting → {os.path.basename(pdf_path)}")
    ocr_texts = []
    
    try:
        # Get total page count first
        info = pdfinfo_from_path(pdf_path, poppler_path=POPPLER_PATH)
        max_pages = info["Pages"]
        print(f"  - Total pages: {max_pages}")

        for i in range(1, max_pages + 1, batch_size):
            last_page = min(i + batch_size - 1, max_pages)
            print(f"  - Processing batch: pages {i} to {last_page}...")
            
            # Convert only this batch of pages
            pages = convert_from_path(
                pdf_path, 
                first_page=i, 
                last_page=last_page, 
                dpi=200,  # Reduced DPI for memory efficiency
                poppler_path=POPPLER_PATH
            )
            
            for page in pages:
                text = pytesseract.image_to_string(page, lang="eng")
                ocr_texts.append(text)
            
            # Explicitly clear memory
            del pages
            
        print("  - OCR complete.")
        return ocr_texts

    except Exception as e:
        print(f"ERROR in load_pdf_with_ocr: {e}")
        return []


# ===============================
# Main VectorDB Class
# ===============================
class PrepareEstablishmentCodeVectorDB:
    def __init__(
        self,
        name,
        doc_dir,
        vectordb_dir,
        collection_name,
        volume_files=None,
        chunk_size=400,
        chunk_overlap=60,
        embedding_model="intfloat/e5-base-v2",
    ):
        self.name = name
        self.doc_dir = doc_dir
        self.vectordb_dir = vectordb_dir
        self.collection_name = collection_name
        self.volume_files = volume_files or []
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model

    def path_maker(self, file_name: str) -> str:
        return os.path.join(here(self.doc_dir), file_name)

    def run(self, test_queries, k=3):

        print(f"\n=== Running for {self.name} [{self.embedding_model}] ===")

        # Clean up existing DB to prevent corruption/version issues
        db_path = here(self.vectordb_dir)
        if os.path.exists(db_path):
             print(f"Removing existing database at {db_path}")
             shutil.rmtree(db_path)

        if not os.path.exists(here(self.vectordb_dir)):
            os.makedirs(here(self.vectordb_dir))

        docs_list = []

        for file_name in self.volume_files:
            pdf_path = self.path_maker(file_name)
            ocr_pages = load_pdf_with_ocr(pdf_path)

            volume_tag = "Vol I" if "I" in file_name.upper() else "Vol II"

            for text in ocr_pages:
                doc = Document(
                    page_content=clean_text(text),
                    metadata={"volume": volume_tag, "source": file_name},
                )
                docs_list.append(doc)

        # Chunking
        splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
        )
        doc_splits = splitter.split_documents(docs_list)

        # Embedding model
        embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)

        # Create VectorDB
        start = time.time()

        vectordb = Chroma.from_documents(
            documents=doc_splits,
            collection_name=self.collection_name,
            embedding=embedder,
            persist_directory=str(here(self.vectordb_dir)),
        )
        end = time.time()

        num_vectors = vectordb._collection.count()
        embed_time = round(end - start, 2)

        # Evaluate with cosine similarity
        retriever = vectordb.as_retriever(search_kwargs={"k": k})
        cosines = []
        for q in test_queries:
            retrieved_docs = retriever.invoke(q)
            q_emb = embedder.embed_query(q)
            sims = [
                cosine_similarity([q_emb], [embedder.embed_query(doc.page_content)])[0][0]
                for doc in retrieved_docs
            ]
            cosines.append(np.mean(sims))

        avg_cosine = float(np.mean(cosines))

        table = [
            ["Model", self.embedding_model],
            ["Chunk Size", self.chunk_size],
            ["Overlap", self.chunk_overlap],
            ["Loaded Docs", len(docs_list)],
            ["Total Chunks", len(doc_splits)],
            ["Vectors Stored", num_vectors],
            ["Embedding Time (s)", embed_time],
            ["Avg Cosine Similarity", round(avg_cosine, 4)],
        ]

        print(tabulate(table, headers=["Metric", "Value"], tablefmt="pretty"))
        print("VectorDB creation completed.\n")

        return {
            "Document": self.name,
            "Model": self.embedding_model,
            "Chunks": len(doc_splits),
            "Vectors": num_vectors,
            "AvgCosine": avg_cosine,
        }


# import os
# import re
# import time
# import platform
# import numpy as np
# from pyprojroot import here
# from PIL import Image
# import pytesseract
# import fitz  # PyMuPDF
# from tabulate import tabulate
# from sklearn.metrics.pairwise import cosine_similarity

# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import Chroma
# from langchain_community.embeddings import HuggingFaceEmbeddings
# from langchain_core.documents import Document

# # ===============================
# # Configure Tesseract (Windows)
# # ===============================
# if platform.system() == "Windows":
#     pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"


# # ===============================
# # Preprocessing Function
# # ===============================
# def clean_text(text: str) -> str:
#     text = text.replace("\u00ad", "")
#     text = re.sub(r"\.{4,}", " ", text)
#     text = re.sub(
#         r"(?im)^[^\n]*Academic\s*Year\s*20\d{2}\s*/\s*20\d{2}[^\n]*Batch[^\n]*\n?",
#         "",
#         text,
#     )
#     text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)
#     text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1\2", text)
#     text = re.sub(r"[ \t]+", " ", text)
#     text = re.sub(r"\n{3,}", "\n\n", text).strip()
#     return text


# # ===============================
# # Load PDF with PyMuPDF + OCR
# # ===============================
# def load_pdf_with_ocr(pdf_path: str):
#     print(f"OCR Extracting → {os.path.basename(pdf_path)}")
#     ocr_texts = []

#     try:
#         doc = fitz.open(pdf_path)
#     except Exception as e:
#         print(f"❌ Failed to open PDF: {e}")
#         return []

#     for page_number in range(len(doc)):
#         page = doc.load_page(page_number)
#         pix = page.get_pixmap(dpi=300)

#         img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

#         text = pytesseract.image_to_string(img, lang="eng")
#         ocr_texts.append(text)

#     return ocr_texts


# # ===============================
# # Main VectorDB Class
# # ===============================
# class PrepareEstablishmentCodeVectorDB:
#     def __init__(
#         self,
#         name,
#         doc_dir,
#         vectordb_dir,
#         collection_name,
#         volume_files=None,
#         chunk_size=400,
#         chunk_overlap=60,
#         embedding_model="intfloat/e5-base-v2",
#     ):
#         self.name = name
#         self.doc_dir = doc_dir
#         self.vectordb_dir = vectordb_dir
#         self.collection_name = collection_name
#         self.volume_files = volume_files or []
#         self.chunk_size = chunk_size
#         self.chunk_overlap = chunk_overlap
#         self.embedding_model = embedding_model

#     def path_maker(self, file_name: str) -> str:
#         return os.path.join(here(self.doc_dir), file_name)

#     def run(self, test_queries, k=3):

#         print(f"\n=== Running for {self.name} [{self.embedding_model}] ===")

#         if not os.path.exists(here(self.vectordb_dir)):
#             os.makedirs(here(self.vectordb_dir))

#         docs_list = []

#         for file_name in self.volume_files:
#             pdf_path = self.path_maker(file_name)
#             ocr_pages = load_pdf_with_ocr(pdf_path)

#             volume_tag = "Vol I" if "I" in file_name.upper() else "Vol II"

#             for text in ocr_pages:
#                 doc = Document(
#                     page_content=clean_text(text),
#                     metadata={"volume": volume_tag, "source": file_name},
#                 )
#                 docs_list.append(doc)

#         splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
#             chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap
#         )
#         doc_splits = splitter.split_documents(docs_list)

#         embedder = HuggingFaceEmbeddings(model_name=self.embedding_model)

#         start = time.time()
#         vectordb = Chroma.from_documents(
#             documents=doc_splits,
#             collection_name=self.collection_name,
#             embedding=embedder,
#             persist_directory=str(here(self.vectordb_dir)),
#         )
#         end = time.time()

#         num_vectors = vectordb._collection.count()
#         embed_time = round(end - start, 2)

#         retriever = vectordb.as_retriever(search_kwargs={"k": k})
#         cosines = []
#         for q in test_queries:
#             retrieved_docs = retriever.invoke(q)
#             q_emb = embedder.embed_query(q)
#             sims = [
#                 cosine_similarity([q_emb], [embedder.embed_query(doc.page_content)])[0][0]
#                 for doc in retrieved_docs
#             ]
#             cosines.append(np.mean(sims))

#         avg_cosine = float(np.mean(cosines))

#         table = [
#             ["Model", self.embedding_model],
#             ["Chunk Size", self.chunk_size],
#             ["Overlap", self.chunk_overlap],
#             ["Loaded Docs", len(docs_list)],
#             ["Total Chunks", len(doc_splits)],
#             ["Vectors Stored", num_vectors],
#             ["Embedding Time (s)", embed_time],
#             ["Avg Cosine Similarity", round(avg_cosine, 4)],
#         ]

#         print(tabulate(table, headers=["Metric", "Value"], tablefmt="pretty"))
#         print("VectorDB creation completed.\n")

#         return {
#             "Document": self.name,
#             "Model": self.embedding_model,
#             "Chunks": len(doc_splits),
#             "Vectors": num_vectors,
#             "AvgCosine": avg_cosine,
#         }


