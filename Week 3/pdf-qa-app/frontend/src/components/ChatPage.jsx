import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MessageSquare,
  PlusCircle
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TEST_USER_ID = '05c1ac4b-c792-4097-852f-b2b8f36b7873'

export default function ChatPage({ userId, activePdfId }) {
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedSources, setExpandedSources] = useState({})
  const chatEndRef = useRef(null)

  const fetchConversations = async () => {
    if (!userId) return
    try {
      const res = await axios.get(`${API_URL}/conversations/${userId}`)
      setConversations(res.data)
      if (res.data.length > 0 && !activeConversationId) {
        loadConversationMessages(res.data[0].conversation_id, res.data[0].pdf_id)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  }

  const loadConversationMessages = async (convId, pdfId) => {
    if (!userId) return
    try {
      const res = await axios.get(`${API_URL}/conversations/${userId}?conversation_id=${convId}`)
      setMessages(res.data)
      setActiveConversationId(convId)
      if (pdfId) {
        localStorage.setItem('documind_active_pdf_id', pdfId)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [userId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const toggleSources = (msgId) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || sending || !activePdfId || !userId) return

    const userText = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    // Optimistically add user message to list
    const tempUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        pdf_id: activePdfId,
        user_id: userId,
        message: userText,
        conversation_id: activeConversationId || undefined
      })

      if (!activeConversationId && res.data.conversation_id) {
        setActiveConversationId(res.data.conversation_id)
        fetchConversations()
      }

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer,
        tokens_used: res.data.telemetry.tokens_used,
        cost: res.data.telemetry.cost_usd,
        latency_ms: res.data.telemetry.total_latency_ms,
        retrieved_chunks: res.data.retrieved_chunks,
        hallucination_detected: res.data.telemetry.hallucination_detected,
        precision_score: res.data.telemetry.precision_score,
        created_at: new Date().toISOString()
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error processing your question. Please try again.',
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const startNewChat = () => {
    setActiveConversationId(null)
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] max-w-7xl mx-auto px-4 py-4 gap-6">
      {/* Sidebar Conversation List */}
      <div className="w-72 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col backdrop-blur-md">
        <button
          onClick={startNewChat}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition mb-4 shadow-md shadow-indigo-600/20"
        >
          <PlusCircle className="w-4 h-4" /> New Session
        </button>

        <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 px-2">History</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-500 px-2 py-4">No past conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.conversation_id}
                onClick={() => loadConversationMessages(c.conversation_id, c.pdf_id)}
                className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1 border ${
                  activeConversationId === c.conversation_id
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  <span className="text-xs font-medium truncate">{c.filename}</span>
                </div>
                <span className="text-[10px] text-slate-500 pl-6">
                  {c.message_count} messages • {new Date(c.created_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col backdrop-blur-md overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Bot className="w-12 h-12 mb-3 text-indigo-400 opacity-80" />
              <h3 className="text-xl font-semibold text-slate-200 mb-1">DocuMind AI Ready</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Ask any question about your uploaded document. The assistant retrieves exact context chunks from ChromaDB and cites telemetry.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user'
              const chunks = typeof msg.retrieved_chunks === 'string'
                ? JSON.parse(msg.retrieved_chunks)
                : msg.retrieved_chunks

              return (
                <div key={msg.id || index} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`max-w-2xl flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Telemetry & Sources Drawer for Assistant */}
                    {!isUser && msg.tokens_used !== undefined && (
                      <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2 mt-1">
                        {/* Telemetry Badges */}
                        <div className="flex flex-wrap items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                            <Zap className="w-3 h-3 text-amber-400" /> {msg.tokens_used} tokens
                          </span>
                          <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                            <DollarSign className="w-3 h-3 text-emerald-400" /> ${Number(msg.cost).toFixed(6)}
                          </span>
                          <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                            <Clock className="w-3 h-3 text-blue-400" /> {msg.latency_ms}ms
                          </span>
                          {msg.precision_score && (
                            <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                              Sim: {msg.precision_score}
                            </span>
                          )}
                          {msg.hallucination_detected !== undefined && (
                            <span
                              className={`flex items-center gap-1 px-2 py-1 rounded-md border ${
                                msg.hallucination_detected
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              }`}
                            >
                              {msg.hallucination_detected ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" /> Hallucination Warning
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Grounded Answer
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Collapsible Retrieved Chunks */}
                        {chunks && chunks.length > 0 && (
                          <div className="pt-1">
                            <button
                              onClick={() => toggleSources(msg.id)}
                              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition text-xs"
                            >
                              {expandedSources[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              Retrieved Context ({chunks.length} chunks)
                            </button>

                            {expandedSources[msg.id] && (
                              <div className="mt-2 space-y-2 pl-2 border-l-2 border-indigo-500/30">
                                {chunks.map((chunk, cIdx) => (
                                  <div key={cIdx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px] text-slate-300">
                                    <div className="flex justify-between font-mono text-slate-400 mb-1">
                                      <span>Chunk #{cIdx + 1}</span>
                                      {chunk.score && <span>Similarity: {chunk.score}</span>}
                                    </div>
                                    <p className="italic text-slate-400 line-clamp-3">{chunk.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              )
            })
          )}
          {sending && (
            <div className="flex gap-4 items-center text-slate-400 text-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <span>Searching ChromaDB & generating response...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about the document..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition text-sm"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
