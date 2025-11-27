from prepare_vector_db_with_ocr import PrepareVectorDBOCR
import os

if __name__ == "__main__":
    base_folder = "data/documents/ugc_circulars"

    # Recursively collect all PDFs under ugc_circulars
    all_pdf_files = []
    for root, dirs, files in os.walk(base_folder):
        for file in files:
            if file.lower().endswith(".pdf"):
                # store relative path from base_folder
                rel_path = os.path.relpath(os.path.join(root, file), base_folder)
                all_pdf_files.append(rel_path)

    print(f"Found PDFs: {all_pdf_files}")

    test_queries = [
        "What statement is made about the signed paper copy of circulars on the UGC “Commission Circulars” page?",
        "How are the circulars on the UGC page organized in terms of years for easy access?",
    ]

    # One vector DB for all PDFs
    creator = PrepareVectorDBOCR(
        name="ugc_circulars_vectordb",
        doc_dir=base_folder,  # base folder
        vectordb_dir="data/vectordb/ugc_circulars_vectordb",
        collection_name="ugc_circulars_rag",
        volume_files=all_pdf_files,  # all PDFs
    )

    creator.run(test_queries=test_queries, k=3)
