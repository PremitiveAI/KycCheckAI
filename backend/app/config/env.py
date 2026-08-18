# app/config/env.py
import os
from dotenv import load_dotenv

# Detect project root automatically
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..",".."))

load_dotenv(os.path.join(ROOT_DIR, ".env"))

# Expose a global getter
def env(key: str, default=None):
    return os.getenv(key, default)
