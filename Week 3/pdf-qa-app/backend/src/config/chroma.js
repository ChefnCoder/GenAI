// ChromaClient is the official Node.js client for ChromaDB
import { ChromaClient } from 'chromadb'

// load .env variables
import dotenv from 'dotenv'
dotenv.config()

// create a ChromaDB client pointing to the running ChromaDB server
// ChromaDB runs as a separate process on port 8000
// your Express app talks to it over HTTP via this client
const client = new ChromaClient({
    path: process.env.CHROMA_URL
})

// export so any route can import and interact with ChromaDB
// usage: await client.createCollection({ name: "pdf_abc123" })
export default client