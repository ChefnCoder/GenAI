import React, { useState } from 'react'
import axios from 'axios'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TEST_USER_ID = '05c1ac4b-c792-4097-852f-b2b8f36b7873'

export default function UploadPage({ userId, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please upload a valid PDF document.')
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError(null)
    } else if (selectedFile) {
      setError('Please upload a valid PDF document.')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(10)
    setError(null)

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('user_id', userId)

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 90) / progressEvent.total)
          setProgress(percentCompleted)
        }
      })

      setProgress(100)
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to upload and process PDF.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-3">
          Upload Your PDF Document
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          DocuMind automatically parses, chunks, and embeds your document vectors into ChromaDB for context-aware Q&A.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        {!result ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
              }`}
              onClick={() => document.getElementById('pdf-input').click()}
            >
              <input
                id="pdf-input"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-slate-200 mb-1">
                {file ? file.name : 'Drag & Drop PDF file here'}
              </p>
              <p className="text-sm text-slate-400">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'or click to browse from your device (Max 10MB)'}
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm font-medium text-slate-400 mb-2">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    Ingesting & Vectorizing...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                disabled={!file || uploading}
                onClick={handleUpload}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/25"
              >
                {uploading ? 'Processing PDF...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Document Ready!</h2>
            <p className="text-slate-400 mb-6">
              <span className="text-indigo-400 font-semibold">{result.filename}</span> was split into{' '}
              <span className="text-purple-400 font-semibold">{result.chunk_count} chunks</span> and stored in ChromaDB in{' '}
              <span className="text-emerald-400 font-semibold">{result.processing_time_ms}ms</span>.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setFile(null)
                  setResult(null)
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition"
              >
                Upload Another PDF
              </button>
              <button
                onClick={() => onUploadSuccess(result.pdf_id)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/25"
              >
                Start Chatting <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
