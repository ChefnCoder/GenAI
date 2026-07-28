import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { createRequire } from 'module'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { ChromaClient } from 'chromadb'
import pool from '../config/db.js'
import dotenv from 'dotenv'
dotenv.config()

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-embedding-001'
})

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
})

export const processPDF = async (file, user_id) => {
  const startTime = Date.now()
  const filePath = file.path

  try {
    // extract text from PDF
    const dataBuffer = fs.readFileSync(filePath)
    const pdfData = await pdfParse(dataBuffer)
    const rawText = pdfData.text

    if (!rawText || rawText.trim().length === 0) {
      throw Object.assign(new Error('PDF has no extractable text'), { status: 400 })
    }

    // chunk the text
    const chunkTexts = await splitter.splitText(rawText)
    const pdf_id = uuidv4()

    // connect to ChromaDB and create collection
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
    const urlObj = new URL(chromaUrl)
    const isSsl = urlObj.protocol === 'https:'
    const port = urlObj.port ? parseInt(urlObj.port) : (isSsl ? 443 : 80)
    
    const client = new ChromaClient({
      host: urlObj.hostname,
      port: port,
      ssl: isSsl
    })
    const collection = await client.getOrCreateCollection({
      name: `pdf_${pdf_id}`,
      metadata: { 'hnsw:space': 'cosine' },
      embeddingFunction: { generate: async (texts) => [] }
    })

    // embed each chunk and store in ChromaDB
    const ids = []
    const embeddingsArray = []
    const documents = []
    const metadatas = []

    for (let i = 0; i < chunkTexts.length; i++) {
      const vector = await embeddings.embedQuery(chunkTexts[i])
      ids.push(`chunk_${i}`)
      embeddingsArray.push(vector)
      documents.push(chunkTexts[i])
      metadatas.push({ chunk_index: i, source: file.originalname, pdf_id })
    }

    // store all chunks in ChromaDB
    await collection.add({
      ids,
      embeddings: embeddingsArray,
      documents,
      metadatas
    })

    // save PDF record to PostgreSQL
    await pool.query(
      `INSERT INTO pdfs (id, user_id, filename, chunk_count, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [pdf_id, user_id, file.originalname, chunkTexts.length]
    )

    // cleanup temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    return {
      success: true,
      pdf_id,
      filename: file.originalname,
      chunk_count: chunkTexts.length,
      processing_time_ms: Date.now() - startTime
    }

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    throw err
  }
}