# start_server.py
import os
import uvicorn
import chromadb
from chromadb.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
