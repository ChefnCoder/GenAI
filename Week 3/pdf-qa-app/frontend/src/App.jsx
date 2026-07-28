import React, { useState } from 'react'
import UploadPage from './components/UploadPage'
import ChatPage from './components/ChatPage'
import MetricsPage from './components/MetricsPage'
import { FileText, MessageSquare, BarChart3, Sparkles } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [activePdfId, setActivePdfId] = useState(null)

  const handleUploadSuccess = (pdfId) => {
    setActivePdfId(pdfId)
    setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-purple-300">
                DocuMind
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono rounded-md">
                v1.0 RAG
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" /> Upload
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat Q&A
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'metrics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Telemetry
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'upload' && <UploadPage onUploadSuccess={handleUploadSuccess} />}
        {activeTab === 'chat' && <ChatPage activePdfId={activePdfId} />}
        {activeTab === 'metrics' && <MetricsPage activePdfId={activePdfId} />}
      </main>
    </div>
  )
}
