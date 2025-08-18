import os
import json
import time
import numpy as np
from dotenv import load_dotenv
from pyprojroot import here
from tabulate import tabulate
from sklearn.metrics.pairwise import cosine_similarity
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document

# --- Metrics ---
def recall_at_k(relevant_ids, retrieved_ids, k):
    return 1.0 if any(r in retrieved_ids[:k] for r in relevant_ids) else 0.0

def reciprocal_rank(relevant_ids, retrieved_ids):
    for i, rid in enumerate(retrieved_ids, start=1):
        if rid in relevant_ids:
            return 1.0 / i
    return 0.0

def precision_at_k(relevant_ids, retrieved_ids, k):
    return sum(1 for r in retrieved_ids[:k] if r in relevant_ids) / k

# --- Config ---
load_dotenv(here(".env"))
os.environ['HUGGINGFACEHUB_API_TOKEN'] = os.getenv("HUGGINGFACEHUB_API_TOKEN")

chunk_json_path = here("by_law_chunks_350_50.json")
k = 4

# --- Load pre-chunked JSON ---
with open(chunk_json_path, "r", encoding="utf-8") as f:
    chunk_data = json.load(f)

docs = [
    Document(page_content=item["text"], metadata=item["metadata"])
    for item in chunk_data
]

# # ---bylaw Ground truth queries 200/30 ---
# ground_truth = {
#     "What is the minimum attendance required to sit for theory classes?": ["ByLaw_chunk_53"],
#     "What is the abbreviation of the Bachelor of the Science of Engineering Honours degree?": ["ByLaw_chunk_15"],
#     "What is the minimum SGPA required to earn credits for a C- grade?": ["ByLaw_chunk_64"],
#     "What does grade A+ signify?": ["ByLaw_chunk_62"],
#     "What is the credit distribution for core, elective, and industrial training modules in Civil Engineering?": ["ByLaw_chunk_28"],
#     "What are the fields of specialisation available?": ["ByLaw_chunk_4"],
#     "Who decides the syllabus and mode of evaluation for each course module?": ["ByLaw_chunk_24"]
# }

# ---bylaw Ground truth queries 500/70 ---

# ground_truth = {
#     "What is the minimum attendance required to sit for theory classes?": ["ByLaw_chunk_18"],
#     "What is the abbreviation of the Bachelor of the Science of Engineering Honours degree?": ["ByLaw_chunk_5"],
#     "What is the minimum SGPA required to earn credits for a C- grade?": ["ByLaw_chunk_22"],
#     "What does grade A+ signify?": ["ByLaw_chunk_22"],
#     "What is the credit distribution for core, elective, and industrial training modules in Civil Engineering?": ["ByLaw_chunk_10"],
#     "What are the fields of specialisation available?": ["ByLaw_chunk_8"],
#     "Who decides the syllabus and mode of evaluation for each course module?": ["ByLaw_chunk_9"]
# }

# ---bylaw Ground truth queries 300/50 ---

# ground_truth = {
#     "What is the minimum attendance required to sit for theory classes?": ["ByLaw_chunk_33"],
#     "What is the abbreviation of the Bachelor of the Science of Engineering Honours degree?": ["ByLaw_chunk_10"],
#     "What is the minimum SGPA required to earn credits for a C- grade?": ["ByLaw_chunk_42"],
#     "What does grade A+ signify?": ["ByLaw_chunk_40"],
#     "What is the credit distribution for core, elective, and industrial training modules in Civil Engineering?": ["ByLaw_chunk_18"],
#     "What are the fields of specialisation available?": ["ByLaw_chunk_16"],
#     "Who decides the syllabus and mode of evaluation for each course module?": ["ByLaw_chunk_16"]
# }

# --- bylaw Ground truth queries 350/50 ---

# ground_truth = {
#   "What is the minimum attendance required to sit for theory classes?": ["ByLaw_chunk_28"],
#   "What is the abbreviation of the Bachelor of the Science of Engineering Honours degree?": ["ByLaw_chunk_8"],
#   "What is the minimum SGPA required to earn credits for a C- grade?": ["ByLaw_chunk_34"],
#   "What does grade A+ signify?": ["ByLaw_chunk_33"],
#   "What is the credit distribution for core, elective, and industrial training modules in Civil Engineering?": ["ByLaw_chunk_15"],
#   "What are the fields of specialisation available?": ["ByLaw_chunk_2"],
#   "Who decides the syllabus and mode of evaluation for each course module?": ["ByLaw_chunk_13"]
# }


# --- exam manual Ground truth queries 400/60 ---

# ground_truth = {
    
#   "Who serves as the Controlling Chief of examinations for a Department?": ["Examinations-Manual_chunk_38"],
#   "At least how long before the end of the semester teaching schedule must the Registrar prepare the draft examination timetables?": ["Examinations-Manual_chunk_45"],
#   "By when must Admission Cards be issued to eligible candidates?": ["Examinations-Manual_chunk_52"],
#   "What attendance document must be prepared for each paper, and who signs it?": ["Examinations-Manual_chunk_53"],
#   "Who is appointed as the Course Coordinator and what other role do they hold for that course?": ["Examinations-Manual_chunk_41"],
#   "By when should revisions to examination dates normally be made?": ["Examinations-Manual_chunk_35"],
#   "Who coordinates all examinations of the Faculty and under whose supervision?": ["Examinations-Manual_chunk_37"],
#   "When should the Registrar commence calling applications for examinations?": ["Examinations-Manual_chunk_48"],
#   "What approvals are required for the appointment of Examiners, and by when?": ["Examinations-Manual_chunk_57"],
#   "Within what time frame must the Supervision, Invigilation and Hall Staff timetable (EX-01) be prepared after the exam timetable is finalized?": ["Examinations-Manual_chunk_46"]

# }


# --- exam manual Ground truth queries 350/50 ---

# ground_truth = {
#   "Who serves as the Controlling Chief of examinations for a Department?": ["Examinations-Manual_chunk_44"],
#   "At least how long before the end of the semester teaching schedule must the Registrar prepare the draft examination timetables?": ["Examinations-Manual_chunk_52"],
#   "By when must Admission Cards be issued to eligible candidates?": ["Examinations-Manual_chunk_61"],
#   "What attendance document must be prepared for each paper, and who signs it?": ["Examinations-Manual_chunk_62"],
#   "Who is appointed as the Course Coordinator and what other role do they hold for that course?": ["Examinations-Manual_chunk_28"],
#   "By when should revisions to examination dates normally be made?": ["Examinations-Manual_chunk_41"],
#   "Who coordinates all examinations of the Faculty and under whose supervision?": ["Examinations-Manual_chunk_43"],
#   "When should the Registrar commence calling applications for examinations?": ["Examinations-Manual_chunk_56"],
#   "What approvals are required for the appointment of Examiners, and by when?": ["Examinations-Manual_chunk_66", "Examinations-Manual_chunk_67"],
#   "Within what time frame must the Supervision, Invigilation and Hall Staff timetable (EX-01) be prepared after the exam timetable is finalized?": ["Examinations-Manual_chunk_54"]
# }


# --- student handbook Ground truth queries 350/50 ---

# ground_truth = {
#   "When was the University of Ruhuna established?": ["Student_Handbook_2022-2023_24th_Batch_chunk_29"],
#   "How many faculties are there in the University of Ruhuna?": ["Student_Handbook_2022-2023_24th_Batch_chunk_29"],
#   "What is the total student population of the University as of 2022?": ["Student_Handbook_2022-2023_24th_Batch_chunk_35"],
#   "Where is the main campus of the University of Ruhuna located?": ["Student_Handbook_2022-2023_24th_Batch_chunk_35"],
#   "What are the admission requirements mentioned in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_99", "Student_Handbook_2022-2023_24th_Batch_chunk_100"],
#   "What sports facilities are available in the Faculty of Engineering?": ["Student_Handbook_2022-2023_24th_Batch_chunk_372", "Student_Handbook_2022-2023_24th_Batch_chunk_373"],
#   "What student societies are listed in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_22", "Student_Handbook_2022-2023_24th_Batch_chunk_26"],
#   "What are the graduation requirements for the BSc Eng(Hons) degree?": ["Student_Handbook_2022-2023_24th_Batch_chunk_429", "Student_Handbook_2022-2023_24th_Batch_chunk_430", "Student_Handbook_2022-2023_24th_Batch_chunk_431"],
#   "What is the attendance requirement for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_88"],
#   "What scholarships are available for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_158", "Student_Handbook_2022-2023_24th_Batch_chunk_159", "Student_Handbook_2022-2023_24th_Batch_chunk_160"]
# }


# --- student handbook Ground truth queries 500/70 ---


# ground_truth = {
#   "When was the University of Ruhuna established?": ["Student_Handbook_2022-2023_24th_Batch_chunk_24"],
#   "How many faculties are there in the University of Ruhuna?": ["Student_Handbook_2022-2023_24th_Batch_chunk_24"],
#   "What is the total student population of the University as of 2022?": ["Student_Handbook_2022-2023_24th_Batch_chunk_28"],
#   "Where is the main campus of the University of Ruhuna located?": ["Student_Handbook_2022-2023_24th_Batch_chunk_29"],
#   "What are the admission requirements mentioned in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_5"],
#   "What is the attendance requirement for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_6"],
#   "What scholarships are available for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_7"],
#   "What are the graduation requirements?": ["Student_Handbook_2022-2023_24th_Batch_chunk_15"],
#   "What sports facilities are available in the Faculty of Engineering?": ["Student_Handbook_2022-2023_24th_Batch_chunk_14"],
#   "What student societies are listed in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_18"]
# }


# --- student handbook Ground truth queries 400/60 ---

# ground_truth = {
#   "When was the University of Ruhuna established?": ["Student_Handbook_2022-2023_24th_Batch_chunk_30"],
#   "How many faculties are there in the University of Ruhuna?": ["Student_Handbook_2022-2023_24th_Batch_chunk_30"],
#   "What is the total student population of the University as of 2022?": ["Student_Handbook_2022-2023_24th_Batch_chunk_35"],
#   "Where is the main campus of the University of Ruhuna located?": ["Student_Handbook_2022-2023_24th_Batch_chunk_36"],
#   "What are the admission requirements mentioned in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_98"],
#   "What sports facilities are available in the Faculty of Engineering?": ["Student_Handbook_2022-2023_24th_Batch_chunk_393"],
#   "What student societies are listed in the handbook?": ["Student_Handbook_2022-2023_24th_Batch_chunk_23"],
#   "What are the graduation requirements for the BSc Eng(Hons) degree?": ["Student_Handbook_2022-2023_24th_Batch_chunk_440"],
#   "What is the attendance requirement for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_142"],
#   "What scholarships are available for students?": ["Student_Handbook_2022-2023_24th_Batch_chunk_173"]
# }






# --- Models to benchmark ---
embedding_models = [
    "all-MiniLM-L6-v2",  # small, fast
    "BAAI/bge-base-en-v1.5",                  # medium accuracy
    # "microsoft/phi-2",                  
    "intfloat/e5-base-v2",
    "intfloat/e5-large-v2"
]

# --- Benchmark ---
results_table = []

for embedding_model in embedding_models:
    print(f"\n=== Running for {embedding_model} ===")

    # Create embedder
    if embedding_model.startswith("text-embedding"):
        embedder = OpenAIEmbeddings(model=embedding_model)
    else:
        embedder = HuggingFaceEmbeddings(model_name=embedding_model)

    # Create Vector DB directly from JSON chunks
    vectordb = Chroma.from_documents(
        documents=docs,
        embedding=embedder,
        collection_name=f"student_handbook_test_{embedding_model.replace('/', '_')}"
    )
    retriever = vectordb.as_retriever(search_kwargs={"k": k})

    recalls, mrrs, precisions, cosines, times = [], [], [], [], []

    for query, relevant_ids in ground_truth.items():
        start_time = time.time()

        query_emb = embedder.embed_query(query)  # query embedding
        retrieved_docs = retriever.invoke(query)  # vector search

        end_time = time.time()
        times.append(end_time - start_time)

        retrieved_ids = [doc.metadata.get("chunk_id") for doc in retrieved_docs]

        recalls.append(recall_at_k(relevant_ids, retrieved_ids, k))
        mrrs.append(reciprocal_rank(relevant_ids, retrieved_ids))
        precisions.append(precision_at_k(relevant_ids, retrieved_ids, k))

        sims = [
            cosine_similarity([query_emb], [embedder.embed_query(doc.page_content)])[0][0]
            for doc in retrieved_docs
        ]
        cosines.append(np.mean(sims))

    results_table.append([
        embedding_model,
        round(np.mean(recalls), 4),
        round(np.mean(mrrs), 4),
        round(np.mean(precisions), 4),
        round(np.mean(cosines), 4),
        round(np.mean(times), 4)
    ])

# --- Print final results ---
print("\n=== Final Model Comparison ===")
print(tabulate(
    results_table,
    headers=["Model", "Recall", "MRR", "Precision", "Avg Cosine", "Avg Time (s)"],
    tablefmt="pretty"
))
