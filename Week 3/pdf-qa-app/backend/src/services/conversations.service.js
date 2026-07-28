import pool from '../config/db.js'

// get all conversations for a user with PDF info
export const getUserConversations = async (user_id) => {
    const result = await pool.query(
        `SELECT 
      c.id as conversation_id,
      c.created_at,
      p.filename,
      p.id as pdf_id,
      COUNT(m.id) as message_count
     FROM conversations c
     JOIN pdfs p ON c.pdf_id = p.id
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id, p.filename, p.id
     ORDER BY c.created_at DESC`,
        [user_id]
    )
    return result.rows
}

// get all messages in a conversation
export const getConversationMessages = async (conversation_id) => {
    const result = await pool.query(
        `SELECT 
      id,
      role,
      content,
      tokens_used,
      cost,
      latency_ms,
      retrieved_chunks,
      hallucination_detected,
      precision_score,
      created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
        [conversation_id]
    )
    return result.rows
}