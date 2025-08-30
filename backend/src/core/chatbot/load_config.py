
import os
import yaml
from dotenv import load_dotenv
from pyprojroot import here

load_dotenv()

# Config file is in the backend/config directory relative to the backend root
# Use a path relative to this file's location
current_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(current_dir, "../../../config/project_config.yml")
with open(config_path) as cfg:
    app_config = yaml.load(cfg, Loader=yaml.FullLoader)


class LoadProjectConfig:
    def __init__(self) -> None:

        # Load langsmith config
        os.environ["LANGCHAIN_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
        os.environ["LANGCHAIN_TRACING_V2"] = app_config["langsmith"]["tracing"]
        os.environ["LANGCHAIN_PROJECT"] = app_config["langsmith"]["project_name"]

        # Load memory config
        self.memory_dir = here(app_config["memory"]["directory"])
