import os
import json
from pyprojroot import here
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def save_chunks_with_ids(doc_dir, chunk_size=350, chunk_overlap=50, output_json="chunks.json"):
    # Step 1: Load PDFs
    file_list = os.listdir(here(doc_dir))
    docs = []
    for fn in file_list:
        file_path = os.path.join(here(doc_dir), fn)
        pdf_docs = PyPDFLoader(file_path).load_and_split()
        docs.extend(pdf_docs)

    # Step 2: Chunk documents
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
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

    print(f"✅ Saved {len(chunk_data)} chunks to {output_json}")

# Example usage
if __name__ == "__main__":
    save_chunks_with_ids(
        doc_dir="data/documents/student_handbook",  # Change to your folder
        chunk_size=350,
        chunk_overlap=50,
        output_json="student_handbook_chunks_350_50.json"
    )
