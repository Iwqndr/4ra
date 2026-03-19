import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Trash2, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronRight,
  Database,
  BarChart3,
  Lock,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'
import { getLogs, clearLogs, getStats } from '../utils/logger'

const DEV_CREDENTIAL = '4wonder';

export default function LogsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ totalRequests: 0, totalTokens: 0, successRate: 0 })
  const [expandedId, setExpandedId] = useState(null)
  const [newLogId, setNewLogId] = useState(null)

  const refreshLogs = () => {
    const freshLogs = getLogs()
    // Identify if a new log was actually added
    if (freshLogs.length > logs.length && logs.length > 0) {
      setNewLogId(freshLogs[0].id)
      setTimeout(() => setNewLogId(null), 3000) // Reset highlight after 3s
    }
    setLogs(freshLogs)
    setStats(getStats())
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshLogs()
      window.addEventListener('aura_logs_updated', refreshLogs)
      return () => window.removeEventListener('aura_logs_updated', refreshLogs)
    }
  }, [isAuthenticated, logs.length])

  const handleLogin = (e) => {
    e?.preventDefault()
    if (password === DEV_CREDENTIAL) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid Developer Credential')
      setPassword('')
    }
  }

  const handleClear = () => {
    if (confirm('Clear all AI request logs?')) {
      clearLogs()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-dark p-8 rounded-[32px] border border-white/5 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-violet/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-violet">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Dev <span className="text-violet">Access</span></h1>
          <p className="text-neutral-500 text-sm mb-8 font-medium">Authentication required to view system logs and token metrics.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Credential..."
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-violet transition-all text-sm font-bold tracking-widest placeholder:text-neutral-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</motion.p>}

            <button 
              type="submit"
              className="w-full py-4 rounded-2xl bg-violet text-white font-black uppercase tracking-[0.2em] shadow-lg shadow-violet/20 hover:bg-violet-600 transition-all transform active:scale-95"
            >
              Verify Identity
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-6xl"
    >
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-violet/10 text-violet">
              <Terminal className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">System <span className="text-violet">Logs</span></h1>
          </div>
          <p className="text-neutral-500 font-medium max-w-lg">
            Monitor real-time AI performance, track token consumption, and audit query history for all Groq-powered modules.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatCard 
            icon={<Database className="w-4 h-4" />} 
            label="Total Requests" 
            value={stats.totalRequests} 
            color="text-blue-400" 
          />
          <StatCard 
            icon={<Cpu className="w-4 h-4" />} 
            label="Total Tokens" 
            value={stats.totalTokens.toLocaleString()} 
            color="text-violet" 
          />
          <StatCard 
            icon={<Activity className="w-4 h-4" />} 
            label="Success Rate" 
            value={`${stats.successRate}%`} 
            color="text-emerald-400" 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-dark rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
              <BarChart3 className="w-4 h-4" />
              Request History
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </div>
          </div>
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4">Request Prompt</th>
                <th className="px-6 py-4">Tokens</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4 text-right pr-12">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    log={log} 
                    isNew={newLogId === log.id}
                    isExpanded={expandedId === log.id}
                    onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Terminal className="w-12 h-12" />
                      <p className="text-sm font-bold uppercase tracking-widest">No logs available yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

function TableRow({ log, isExpanded, onToggle, isNew }) {
  const isError = log.status === 'error'
  const date = new Date(log.timestamp)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <>
      <tr 
        onClick={onToggle}
        className={`group hover:bg-white/[0.03] transition-all duration-500 cursor-pointer 
          ${isExpanded ? 'bg-white/[0.03]' : ''} 
          ${isNew ? 'bg-violet/5 shadow-[inset_4px_0_0_#8b5cf6]' : ''}`}
      >
        <td className="px-6 py-5">
          {isError ? (
            <div className="text-red-500"><XCircle className="w-5 h-5" /></div>
          ) : (
            <div className="text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
          )}
        </td>
        <td className="px-6 py-5 text-center">
          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
            log.type === 'recommender' ? 'bg-violet/10 text-violet' : 
            log.type === 'chat' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
          }`}>
            {log.type}
          </span>
        </td>
        <td className="px-6 py-5">
          <p className="text-sm text-neutral-300 font-medium line-clamp-1 max-w-md group-hover:text-white transition-colors">
            {log.prompt}
          </p>
        </td>
        <td className="px-6 py-5">
          <span className="text-xs font-black text-neutral-400 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-violet/50" />
            {log.tokens.toLocaleString()}
          </span>
        </td>
        <td className="px-6 py-5">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight opacity-50">
            {log.model.split('-').slice(0, 2).join('-')}
          </span>
        </td>
        <td className="px-6 py-5 text-right pr-12 flex items-center justify-end gap-3">
          <span className="text-xs text-neutral-600 font-mono">{timeStr}</span>
          <ChevronRight className={`w-4 h-4 text-neutral-700 transition-transform ${isExpanded ? 'rotate-90 text-violet' : ''}`} />
        </td>
      </tr>
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan="6" className="px-0 py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-black/40 border-l-2 border-violet"
              >
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-violet uppercase tracking-widest">Full Prompt Request</h5>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-neutral-400 leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {log.prompt}
                      </div>
                    </div>
                    {isError && (
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Error Trace</h5>
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-sm text-red-400 leading-relaxed font-mono">
                          {log.error}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 border-t border-white/5 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5" />
                       Full Timestamp: {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div>Log ID: {log.id}</div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-dark px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-4 transition-transform hover:scale-105">
      <div className={`p-2.5 rounded-xl bg-white/[0.03] ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-xl font-black italic tracking-tigh ${color}`}>{value}</div>
      </div>
    </div>
  )
}
