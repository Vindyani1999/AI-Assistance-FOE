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

    
        
        # Swiss Airline Policy RAG configs
        self.policy_rag_llm = app_config["swiss_airline_policy_rag"]["llm"]
        self.policy_rag_llm_temperature = float(
            app_config["swiss_airline_policy_rag"]["llm_temperature"])
        self.policy_rag_embedding_model = app_config["swiss_airline_policy_rag"]["embedding_model"]
        self.policy_rag_vectordb_directory = str(here(
            app_config["swiss_airline_policy_rag"]["vectordb"]))  # needs to be strin for summation in chromadb backend: self._settings.require("persist_directory") + "/chroma.sqlite3"
        self.policy_rag_unstructured_docs_directory = str(here(
            app_config["swiss_airline_policy_rag"]["unstructured_docs"]))
        self.policy_rag_k = app_config["swiss_airline_policy_rag"]["k"]
        self.policy_rag_chunk_size = app_config["swiss_airline_policy_rag"]["chunk_size"]
        self.policy_rag_chunk_overlap = app_config["swiss_airline_policy_rag"]["chunk_overlap"]
        self.policy_rag_collection_name = app_config["swiss_airline_policy_rag"]["collection_name"]


        # Stories RAG configs
        self.stories_rag_llm = app_config["stories_rag"]["llm"]
        self.stories_rag_llm_temperature = float(
            app_config["stories_rag"]["llm_temperature"])
        self.stories_rag_embedding_model = app_config["stories_rag"]["embedding_model"]
        self.stories_rag_vectordb_directory = str(here(
            app_config["stories_rag"]["vectordb"]))  # needs to be strin for summation in chromadb backend: self._settings.require("persist_directory") + "/chroma.sqlite3"
        self.stories_rag_unstructured_docs_directory = str(here(
            app_config["stories_rag"]["unstructured_docs"]))
        self.stories_rag_k = app_config["stories_rag"]["k"]
        self.stories_rag_chunk_size = app_config["stories_rag"]["chunk_size"]
        self.stories_rag_chunk_overlap = app_config["stories_rag"]["chunk_overlap"]
        self.stories_rag_collection_name = app_config["stories_rag"]["collection_name"]

        # Travel SQL Agent configs
        self.travel_sqldb_directory = str(here(
            app_config["travel_sqlagent_configs"]["travel_sqldb_dir"]))
        self.travel_sqlagent_llm = app_config["travel_sqlagent_configs"]["llm"]
        self.travel_sqlagent_llm_temperature = float(
            app_config["travel_sqlagent_configs"]["llm_temperature"])

        # Chinook SQL agent configs
        self.chinook_sqldb_directory = str(here(
            app_config["chinook_sqlagent_configs"]["chinook_sqldb_dir"]))
        self.chinook_sqlagent_llm = app_config["chinook_sqlagent_configs"]["llm"]
        self.chinook_sqlagent_llm_temperature = float(
            app_config["chinook_sqlagent_configs"]["llm_temperature"])

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
        
        
#===============================================================