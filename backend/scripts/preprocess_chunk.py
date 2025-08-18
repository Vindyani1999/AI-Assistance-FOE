import os
import re
import json
from pyprojroot import here
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def clean_text(text: str) -> str:
    """
    Cleans extracted text before chunking:
    - Remove headers/footers (batch/year lines)
    - Remove excessive dot leaders (TOC)
    - Fix only *true* word splits (hyphenation or line-break splits)
    - Preserve normal spaces and paragraph boundaries
    """

    # remove discretionary/soft hyphens
    text = text.replace("\u00ad", "")

    # remove dot leaders (e.g. ".....")
    text = re.sub(r"\.{4,}", " ", text)

    # remove repeated headers like "Academic Year 2022/2023, 24th Batch"
    text = re.sub(
        r"(?im)^[^\n]*Academic\s*Year\s*20\d{2}\s*/\s*20\d{2}[^\n]*Batch[^\n]*\n?", 
        "", 
        text
    )

    # join words split with hyphen + newline: infor-\nmation → information
    text = re.sub(r"(\w+)-\s*\n\s*(\w+)", r"\1\2", text)

    # join words split across newline only: infor\nmation → information
    text = re.sub(r"([a-z])\s*\n\s*([a-z])", r"\1\2", text)

    # normalize spaces but keep paragraph structure
    text = re.sub(r"[ \t]+", " ", text)            # collapse multiple spaces
    text = re.sub(r"\n{3,}", "\n\n", text).strip() # keep double newlines as paragraph breaks

    return text

def save_chunks_with_ids(doc_dir, chunk_size=400, chunk_overlap=60, output_json="chunks.json"):
    # Step 1: Load PDFs
    file_list = os.listdir(here(doc_dir))
    docs = []
    for fn in file_list:
        file_path = os.path.join(here(doc_dir), fn)
        pdf_docs = PyPDFLoader(file_path).load_and_split()

        # Clean text of each document before chunking
        for d in pdf_docs:
            d.page_content = clean_text(d.page_content)
        docs.extend(pdf_docs)

    # Step 2: Chunk documents
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],  # prefer semantic boundaries
    )
    doc_splits = splitter.split_documents(docs)

    # Step 3: Assign chunk IDs
    chunk_data = []
    for idx, chunk in enumerate(doc_splits):
        chunk_id = f"{os.path.splitext(os.path.basename(chunk.metadata.get('source', 'doc')))[0]}_chunk_{idx}"
        chunk.metadata["chunk_id"] = chunk_id

        chunk_data.append({
            "chunk_id": chunk_id,
            "text": chunk.page_content.strip(),
            "metadata": chunk.metadata
        })

    # Step 4: Save to JSON
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(chunk_data, f, indent=4, ensure_ascii=False)

    print(f"✅ Saved {len(chunk_data)} cleaned chunks to {output_json}")

# Example usage
if __name__ == "__main__":
    save_chunks_with_ids(
        doc_dir="data/documents/student_handbook",  # adjust folder path
        chunk_size=400,
        chunk_overlap=60,
        output_json="student_handbook_chunks_400_60.json"
    )









# import os
# import re
# import json
# from pyprojroot import here
# from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import RecursiveCharacterTextSplitter

# def clean_text(text: str) -> str:
#     """
#     Cleans extracted text before chunking:
#     - Fix multiple spaces / broken words
#     - Remove headers/footers
#     - Remove excessive dot leaders in TOC
#     """
#     # Remove repeated headers/footers like "Academic Year 2022/2023, 24th Batch"
#     text = re.sub(r"Academic Year\s*20\d{2}\s*/\s*20\d{2}.*Batch", "", text, flags=re.IGNORECASE)

#     # Remove long dot leader lines from TOC
#     text = re.sub(r"\.{4,}", " ", text)

#     # Fix broken words across line breaks ("inform ation" → "information")
#     text = re.sub(r"(\w)\s+(\w)", r"\1 \2", text)  # normalize spacing
#     text = re.sub(r"(\w)\s+(\w{2,})", lambda m: m.group(1) + m.group(2) if len(m.group(2)) > 2 else m.group(0), text)

#     # Collapse multiple spaces/newlines
#     text = re.sub(r"\s+", " ", text).strip()

#     return text

# def save_chunks_with_ids(doc_dir, chunk_size=400, chunk_overlap=60, output_json="chunks.json"):
#     # Step 1: Load PDFs
#     file_list = os.listdir(here(doc_dir))
#     docs = []
#     for fn in file_list:
#         file_path = os.path.join(here(doc_dir), fn)
#         pdf_docs = PyPDFLoader(file_path).load_and_split()

#         # Clean text of each document before chunking
#         for d in pdf_docs:
#             d.page_content = clean_text(d.page_content)
#         docs.extend(pdf_docs)

#     # Step 2: Chunk documents
#     splitter = RecursiveCharacterTextSplitter(
#         chunk_size=chunk_size,
#         chunk_overlap=chunk_overlap
#     )
#     doc_splits = splitter.split_documents(docs)

#     # Step 3: Assign chunk IDs
#     chunk_data = []
#     for idx, chunk in enumerate(doc_splits):
#         chunk_id = f"{os.path.splitext(os.path.basename(chunk.metadata.get('source', 'doc')))[0]}_chunk_{idx}"
#         chunk.metadata["chunk_id"] = chunk_id

#         chunk_data.append({
#             "chunk_id": chunk_id,
#             "text": chunk.page_content.strip(),
#             "metadata": chunk.metadata
#         })

#     # Step 4: Save to JSON
#     with open(output_json, "w", encoding="utf-8") as f:
#         json.dump(chunk_data, f, indent=4, ensure_ascii=False)

#     print(f"✅ Saved {len(chunk_data)} cleaned chunks to {output_json}")

# # Example usage
# if __name__ == "__main__":
#     save_chunks_with_ids(
#         doc_dir="data/documents/student_handbook",  # Change to your folder
#         chunk_size=400,
#         chunk_overlap=60,
#         output_json="student_handbook_chunks_400_60.json"
#     )
