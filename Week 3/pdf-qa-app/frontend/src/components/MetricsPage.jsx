import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Activity, DollarSign, Clock, Hash, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function MetricsPage({ userId, activePdfId }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewScope, setViewScope] = useState('user') // 'user' (aggregated) or 'pdf' (active doc)

  const fetchMetrics = async () => {
    if (!userId && !activePdfId) return
    setLoading(true)
    setError(null)
    try {
      const url = (viewScope === 'pdf' && activePdfId)
        ? `${API_URL}/metrics/${activePdfId}`
        : `${API_URL}/metrics/user/${userId}`
      const res = await axios.get(url)
      setMetrics(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [userId, activePdfId, viewScope])

  if (!userId && !activePdfId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        <Activity className="w-16 h-16 mx-auto mb-4 text-indigo-400 opacity-60" />
        <h2 className="text-2xl font-bold text-slate-200 mb-2">No User Signed In</h2>
        <p className="text-slate-400">Please sign in to view your aggregated telemetry & cost metrics.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Telemetry & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            {viewScope === 'user' ? (
              <>Showing <strong>aggregated account telemetry</strong> across all your uploaded documents.</>
            ) : (
              <>Showing metrics for active PDF: <span className="font-mono text-indigo-400">{activePdfId}</span></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activePdfId && (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setViewScope('user')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewScope === 'user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setViewScope('pdf')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewScope === 'pdf'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Current PDF
              </button>
            </div>
          )}

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Queries */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Queries</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Hash className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-100">{metrics.total_queries || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Queries executed against document</p>
          </div>

          {/* Card 2: Avg Precision */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Precision</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {metrics.avg_precision ? Number(metrics.avg_precision).toFixed(4) : '0.0000'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Mean cosine similarity score</p>
          </div>

          {/* Card 3: Hallucination Rate */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hallucination Rate</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-400">
              {metrics.hallucination_rate ? `${(Number(metrics.hallucination_rate) * 100).toFixed(1)}%` : '0.0%'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Flagged responses count</p>
          </div>

          {/* Card 4: Total Cost */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Cost</span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              ${metrics.total_cost ? Number(metrics.total_cost).toFixed(6) : '0.000000'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Estimated Gemini API spend</p>
          </div>
        </div>
      )}
    </div>
  )
}
