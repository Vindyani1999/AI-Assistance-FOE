from prepare_establishment_code_vectordb import PrepareEstablishmentCodeVectorDB
import os

if __name__ == "__main__":

    base_folder = "data/documents/establishments_code_volume"

    # Find all PDF files
    volume_files = [
        file for file in os.listdir(base_folder) if file.lower().endswith(".pdf")
    ]

    print("Found Establishment Code PDFs:", volume_files)

    test_queries = [
        "What is meant by “undivided allegiance” required from a Public Officer under Section 1:1?",
        "According to Section 1:5, how should a Public Officer avoid conflicts between private interest and public duty?",
        "What disciplinary consequences can arise if an officer canvasses for appointments, promotions, or transfers as stated in Section 1:6?"
    ]

    creator = PrepareEstablishmentCodeVectorDB(
        name="Establishment Code Vol I & II",
        doc_dir=base_folder,
        vectordb_dir="data/vectordb/establishment_code_vectordb",
        collection_name="establishment_code-rag-chroma",
        volume_files=volume_files,
        chunk_size=400,
        chunk_overlap=60,
        embedding_model="intfloat/e5-base-v2"
    )

    creator.run(test_queries=test_queries, k=3)
