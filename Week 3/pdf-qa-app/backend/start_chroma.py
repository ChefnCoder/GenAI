# start_chroma.py
# run this to start ChromaDB server on Windows
import chromadb
from chromadb.config import Settings

# creates persistent client — saves to ./chromadb_data folder
client = chromadb.PersistentClient(path="./chromadb_data")

# start the server
import uvicorn
from chromadb.app import app

uvicorn.run(app, host="0.0.0.0", port=8000)