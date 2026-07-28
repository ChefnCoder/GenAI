import pool from '../config/db.js'

export const getPDFMetrics = async (pdf_id) => {
    const result = await pool.query(
        `SELECT
      COUNT(m.id) as total_queries,
      AVG(m.precision_score) as avg_precision,
      AVG(CASE WHEN m.hallucination_detected THEN 1 ELSE 0 END) as hallucination_rate,
      SUM(m.cost) as total_cost,
      AVG(m.latency_ms) as avg_latency_ms,
      AVG(m.tokens_used) as avg_tokens_used
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE c.pdf_id = $1
     AND m.role = 'assistant'`,
        [pdf_id]
    )

    return {
        pdf_id,
        ...result.rows[0]
    }
}