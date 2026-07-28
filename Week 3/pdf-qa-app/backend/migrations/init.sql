-- create users table
-- stores basic user info, everything else references this
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- auto generate unique ID
  email VARCHAR(255) UNIQUE NOT NULL,             -- unique email per user
  created_at TIMESTAMP DEFAULT NOW()              -- when user signed up
);

-- create pdfs table
-- every uploaded PDF gets a row here
CREATE TABLE IF NOT EXISTS pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- unique pdf ID (also used as ChromaDB collection name)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- which user uploaded it
  filename VARCHAR(255) NOT NULL,                 -- original filename e.g. "company_policy.pdf"
  chunk_count INTEGER DEFAULT 0,                  -- how many chunks were created during processing
  created_at TIMESTAMP DEFAULT NOW()              -- when it was uploaded
);

-- create conversations table
-- one conversation = one user chatting with one PDF
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- unique conversation ID
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- which user
  pdf_id UUID REFERENCES pdfs(id) ON DELETE CASCADE,   -- which PDF
  created_at TIMESTAMP DEFAULT NOW()              -- when conversation started
);

-- create messages table
-- every single message (user + assistant) stored here
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),        -- unique message ID
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE, -- which conversation
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')), -- only allow these two values
  content TEXT NOT NULL,                                -- the actual message text
  tokens_used INTEGER,                                  -- null for user messages, filled for assistant
  cost DECIMAL(10, 6),                                  -- cost in dollars e.g. 0.000312
  latency_ms INTEGER,                                   -- how long LLM took to respond
  retrieved_chunks JSONB,                               -- which chunks were used (array of JSON)
  hallucination_detected BOOLEAN DEFAULT FALSE,         -- Week 2 V3 hallucination check result
  precision_score DECIMAL(5, 4),                        -- similarity score of top chunk (0-1)
  created_at TIMESTAMP DEFAULT NOW()                    -- when message was sent
);

-- indexes for fast queries
-- without indexes, every query scans entire table (slow at scale)
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON pdfs(user_id);                        -- "get all PDFs by user"
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);       -- "get all conversations by user"
CREATE INDEX IF NOT EXISTS idx_conversations_pdf_id ON conversations(pdf_id);         -- "get all conversations for a PDF"
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id); -- "get all messages in a conversation"