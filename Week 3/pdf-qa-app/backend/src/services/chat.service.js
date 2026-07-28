import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChromaClient } from 'chromadb'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/db.js'
import dotenv from 'dotenv'
dotenv.config()

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'gemini-embedding-001'
})

export const processChat = async ({ pdf_id, user_id, message, conversation_id }) => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    maxOutputTokens: 1024
  })

  const startTime = Date.now()

  // STEP 1: create conversation if first message
  let conv_id = conversation_id
  if (!conv_id) {
    const convResult = await pool.query(
      `INSERT INTO conversations (id, user_id, pdf_id, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [uuidv4(), user_id, pdf_id]
    )
    conv_id = convResult.rows[0].id
  }

  // STEP 2: fetch last N messages from PostgreSQL for memory
  const historyResult = await pool.query(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [conv_id, parseInt(process.env.HISTORY_LIMIT) || 6]
  )
  const history = historyResult.rows.reverse()

  // STEP 3: embed the user query
  const queryVector = await embeddings.embedQuery(message)

  // STEP 4: retrieve top-k chunks from ChromaDB
  const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
  const urlObj = new URL(chromaUrl)
  const isSsl = urlObj.protocol === 'https:'
  const port = urlObj.port ? parseInt(urlObj.port) : (isSsl ? 443 : 80)

  const client = new ChromaClient({
    host: urlObj.hostname,
    port: port,
    ssl: isSsl
  })
  const collection = await client.getCollection({
    name: `pdf_${pdf_id}`,
    embeddingFunction: { generate: async (texts) => [] }
  })
  const results = await collection.query({
    queryEmbeddings: [queryVector],
    nResults: parseInt(process.env.TOP_K_CHUNKS) || 3,
    include: ['documents', 'distances', 'metadatas']
  })

  const chunks = (results.documents && results.documents[0]) || []
  const distances = (results.distances && results.distances[0]) || []
  const metadatas = (results.metadatas && results.metadatas[0]) || []

  // precision score = 1 - distance (cosine distance → similarity)
  const precisionScore = distances.length > 0 ? (1 - distances[0]).toFixed(4) : null

  // STEP 5: build conversation history string
  const historyText = history
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  // STEP 6: build prompt
  const context = chunks.join('\n\n')
  const prompt = `You are a helpful assistant that answers questions based only on the provided PDF context.
If the answer is not in the context, say "I could not find this information in the document."

Context from PDF:
${context}

${historyText ? `Conversation so far:\n${historyText}\n` : ''}
User: ${message}
Assistant:`

  // STEP 7: call LLM and measure latency
  const llmStart = Date.now()
  const response = await llm.invoke(prompt)
  const llmLatency = Date.now() - llmStart
  const answer = response.content

  // STEP 8: calculate telemetry
  const totalLatency = Date.now() - startTime
  const inputTokens = Math.ceil(prompt.length / 4)
  const outputTokens = Math.ceil(answer.length / 4)
  const totalTokens = inputTokens + outputTokens
  const cost = (totalTokens / 1000000) * 0.075 // gemini-1.5-flash pricing

  // STEP 9: hallucination detection (simple reference check)
  const hallucinationDetected = !chunks.some(chunk =>
    answer.toLowerCase().split(' ').some(word =>
      word.length > 4 && chunk.toLowerCase().includes(word)
    )
  )

  // STEP 10: save user message to PostgreSQL
  await pool.query(
    `INSERT INTO messages (id, conversation_id, role, content, created_at)
     VALUES ($1, $2, 'user', $3, NOW())`,
    [uuidv4(), conv_id, message]
  )

  // STEP 11: save assistant response with full telemetry
  const retrievedChunksJson = chunks.map((doc, i) => ({
    text: doc,
    score: distances[i] !== undefined ? (1 - distances[i]).toFixed(4) : null,
    metadata: metadatas[i] || {}
  }))

  await pool.query(
    `INSERT INTO messages
      (id, conversation_id, role, content, tokens_used, cost, latency_ms,
       retrieved_chunks, hallucination_detected, precision_score, created_at)
     VALUES ($1, $2, 'assistant', $3, $4, $5, $6, $7, $8, $9, NOW())`,
    [
      uuidv4(), conv_id, answer, totalTokens,
      cost, totalLatency, JSON.stringify(retrievedChunksJson),
      hallucinationDetected, precisionScore
    ]
  )

  // STEP 12: return response
  return {
    answer,
    conversation_id: conv_id,
    retrieved_chunks: retrievedChunksJson,
    telemetry: {
      tokens_used: totalTokens,
      cost_usd: cost.toFixed(6),
      total_latency_ms: totalLatency,
      llm_latency_ms: llmLatency,
      precision_score: precisionScore,
      hallucination_detected: hallucinationDetected
    }
  }
}