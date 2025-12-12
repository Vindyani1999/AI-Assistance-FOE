import os
import yaml
from dotenv import load_dotenv
from pyprojroot import here

load_dotenv()


class LoadToolsConfig:

    def __init__(self) -> None:
        # Config file is in the backend/config directory relative to the backend root
        # Use a path relative to this file's location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "../../../config/tools_config.yml")
        with open(config_path) as cfg:
            app_config = yaml.load(cfg, Loader=yaml.FullLoader)

        # Set environment variables
        os.environ['OPENAI_API_KEY'] = os.getenv("OPENAI_API_KEY")
        os.environ['TAVILY_API_KEY'] = os.getenv("TAVILY_API_KEY")

        # Primary agent
        self.primary_agent_llm = app_config["primary_agent"]["llm"]
        self.primary_agent_llm_temperature = app_config["primary_agent"]["llm_temperature"]

        # Internet Search config
        self.tavily_search_max_results = int(
            app_config["tavily_search_api"]["tavily_search_max_results"])

    
        # Graph configs
        self.thread_id = str(
            app_config["graph_configs"]["thread_id"])


#...................................................................................


         # By Law RAG configs
        self.by_law_rag_llm = app_config["by_law_rag"]["llm"]
        self.by_law_rag_llm_temperature = float(
            app_config["by_law_rag"]["llm_temperature"])
        self.by_law_rag_embedding_model = app_config["by_law_rag"]["embedding_model"]
        self.by_law_rag_vectordb_directory = str(here(
            app_config["by_law_rag"]["vectordb"]))  
        self.by_law_rag_unstructured_docs_directory = str(here(
            app_config["by_law_rag"]["unstructured_docs"]))
        self.by_law_rag_k = app_config["by_law_rag"]["k"]
        self.by_law_rag_chunk_size = app_config["by_law_rag"]["chunk_size"]
        self.by_law_rag_chunk_overlap = app_config["by_law_rag"]["chunk_overlap"]
        self.by_law_rag_collection_name = app_config["by_law_rag"]["collection_name"]


        # Student Handbook RAG configs
        self.student_handbook_rag_llm = app_config["student_handbook_rag"]["llm"]
        self.student_handbook_rag_llm_temperature = float(
            app_config["student_handbook_rag"]["llm_temperature"])
        self.student_handbook_rag_embedding_model = app_config["student_handbook_rag"]["embedding_model"]
        self.student_handbook_rag_vectordb_directory = str(here(
            app_config["student_handbook_rag"]["vectordb"]))
        self.student_handbook_rag_unstructured_docs_directory = str(here(
            app_config["student_handbook_rag"]["unstructured_docs"]))
        self.student_handbook_rag_k = app_config["student_handbook_rag"]["k"]
        self.student_handbook_rag_chunk_size = app_config["student_handbook_rag"]["chunk_size"]
        self.student_handbook_rag_chunk_overlap = app_config["student_handbook_rag"]["chunk_overlap"]
        self.student_handbook_rag_collection_name = app_config["student_handbook_rag"]["collection_name"]


        # Exam Manual RAG configs
        self.exam_manual_rag_llm = app_config["exam_manual_rag"]["llm"]
        self.exam_manual_rag_llm_temperature = float(
            app_config["exam_manual_rag"]["llm_temperature"])
        self.exam_manual_rag_embedding_model = app_config["exam_manual_rag"]["embedding_model"]
        self.exam_manual_rag_vectordb_directory = str(here(
            app_config["exam_manual_rag"]["vectordb"]))  
        self.exam_manual_rag_unstructured_docs_directory = str(here(
            app_config["exam_manual_rag"]["unstructured_docs"]))
        self.exam_manual_rag_k = app_config["exam_manual_rag"]["k"]
        self.exam_manual_rag_chunk_size = app_config["exam_manual_rag"]["chunk_size"]
        self.exam_manual_rag_chunk_overlap = app_config["exam_manual_rag"]["chunk_overlap"]
        self.exam_manual_rag_collection_name = app_config["exam_manual_rag"]["collection_name"] 
        

        # Procurement Guidelines RAG configs
        self.procurement_guidelines_rag_llm = app_config["procurement_guidelines_rag"]["llm"]
        self.procurement_guidelines_rag_llm_temperature = float(
            app_config["procurement_guidelines_rag"]["llm_temperature"]
        )
        self.procurement_guidelines_rag_embedding_model = app_config["procurement_guidelines_rag"]["embedding_model"]
        self.procurement_guidelines_rag_vectordb_directory = str(here(
            app_config["procurement_guidelines_rag"]["vectordb"]
        ))
        self.procurement_guidelines_rag_unstructured_docs_directory = str(here(
            app_config["procurement_guidelines_rag"]["unstructured_docs"]
        ))
        self.procurement_guidelines_rag_k = app_config["procurement_guidelines_rag"]["k"]
        self.procurement_guidelines_rag_chunk_size = app_config["procurement_guidelines_rag"]["chunk_size"]
        self.procurement_guidelines_rag_chunk_overlap = app_config["procurement_guidelines_rag"]["chunk_overlap"]
        self.procurement_guidelines_rag_collection_name = app_config["procurement_guidelines_rag"]["collection_name"]

        # Establishment Code RAG configs
        self.establishment_code_rag_llm = app_config["establishment_code_rag"]["llm"]
        self.establishment_code_rag_llm_temperature = float(
            app_config["establishment_code_rag"]["llm_temperature"]
        )
        self.establishment_code_rag_embedding_model = app_config["establishment_code_rag"]["embedding_model"]
        self.establishment_code_rag_vectordb_directory = str(here(
            app_config["establishment_code_rag"]["vectordb"]
        ))
        self.establishment_code_rag_unstructured_docs_directory = str(here(
            app_config["establishment_code_rag"]["unstructured_docs"]
        ))
        self.establishment_code_rag_k = app_config["establishment_code_rag"]["k"]
        self.establishment_code_rag_chunk_size = app_config["establishment_code_rag"]["chunk_size"]
        self.establishment_code_rag_chunk_overlap = app_config["establishment_code_rag"]["chunk_overlap"]
        self.establishment_code_rag_collection_name = app_config["establishment_code_rag"]["collection_name"]


        # UGC Circulars RAG configs
        self.ugc_circulars_rag_llm = app_config["ugc_circulars_rag"]["llm"]
        self.ugc_circulars_rag_llm_temperature = float(
            app_config["ugc_circulars_rag"]["llm_temperature"]
        )
        self.ugc_circulars_rag_embedding_model = app_config["ugc_circulars_rag"]["embedding_model"]
        self.ugc_circulars_rag_vectordb_directory = str(here(
            app_config["ugc_circulars_rag"]["vectordb"]
        ))
        self.ugc_circulars_rag_unstructured_docs_directory = str(here(
            app_config["ugc_circulars_rag"]["unstructured_docs"]
        ))
        self.ugc_circulars_rag_k = app_config["ugc_circulars_rag"]["k"]
        self.ugc_circulars_rag_chunk_size = app_config["ugc_circulars_rag"]["chunk_size"]
        self.ugc_circulars_rag_chunk_overlap = app_config["ugc_circulars_rag"]["chunk_overlap"]
        self.ugc_circulars_rag_collection_name = app_config["ugc_circulars_rag"]["collection_name"]

#===============================================================