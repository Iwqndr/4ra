import { useState, useEffect, useMemo } from 'react'
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
  EyeOff,
  Globe,
  Zap,
  Shield,
  Search,
  Filter,
  RefreshCcw,
  ArrowUpRight,
  User,
  Settings,
  AlertTriangle,
  Send,
  Save,
  LogOut,
  Users,
  Bell
} from 'lucide-react'
import { getLogs, clearLogs, getAggregatedStats, getDebugLogs, clearDebugLogs, addDebugLog } from '../utils/logger'
import { supabase } from '../lib/supabase'

const DEV_CREDENTIAL = '4wonder';
const AUTH_KEY = 'aura_dev_auth';

export default function DevPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [activeTab, setActiveTab] = useState('telemetry')
  const [logs, setLogs] = useState([])
  const [debugLogs, setDebugLogs] = useState([])
  const [stats, setStats] = useState({ totalRequests: 0, avgLatency: 0, totalTokens: 0, successRate: 100 })
  const [profiles, setProfiles] = useState([])
  const [systemConfig, setSystemConfig] = useState({
    maintenance_mode: false,
    system_message: 'Welcome to 4Aura!',
    api_key_override: ''
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAnnouncing, setIsAnnouncing] = useState(false)

  const refreshLogs = () => {
    setLogs(getLogs())
    setStats(getAggregatedStats())
    setDebugLogs(getDebugLogs())
  }

  const fetchSystemData = async () => {
    setIsSyncing(true)
    try {
      // 1. Fetch Profiles
      const { data: userData } = await supabase.from('profiles').select('*').limit(50);
      setProfiles(userData || []);

      // 2. Fetch Config
      const { data: configData } = await supabase.from('system_config').select('*');
      if (configData) {
        const configMap = {};
        configData.forEach(c => configMap[c.key] = c.value);
        setSystemConfig({
          maintenance_mode: configMap.maintenance_mode === true,
          system_message: configMap.system_message || 'Welcome to 4Aura!',
          api_key_override: configMap.api_key_override || ''
        });
      }
    } catch (err) {
      console.error('[Dev] Sync Error:', err);
    }
    setIsSyncing(false);
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshLogs();
      fetchSystemData();
      window.addEventListener('aura_dev_updated', refreshLogs);
      window.addEventListener('aura_debug_updated', refreshLogs);
      return () => {
        window.removeEventListener('aura_dev_updated', refreshLogs);
        window.removeEventListener('aura_debug_updated', refreshLogs);
      };
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e?.preventDefault()
    if (password === DEV_CREDENTIAL) {
      setIsAuthenticated(true)
      localStorage.setItem(AUTH_KEY, 'true')
      setLoginError('')
    } else {
      setLoginError('Access Denied: Invalid Developer Identity')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_KEY)
  }

  const updateConfig = async (key, value) => {
    setIsSyncing(true)
    const { error } = await supabase
      .from('system_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    
    if (error) {
      alert('Config Update Failed: ' + error.message);
    } else {
      // Instant local sync
      if (key === 'api_key_override') localStorage.setItem('aura_api_key_override', value);
      if (key === 'maintenance_mode') localStorage.setItem('aura_maintenance_mode', value ? 'true' : 'false');
      if (key === 'system_message') localStorage.setItem('aura_system_message', value);
      
      fetchSystemData();
    }
    setIsSyncing(false);
  }

  if (!isAuthenticated) {
    return <LoginView password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} loginError={loginError} handleLogin={handleLogin} />
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-3xl bg-violet/10 text-violet shadow-inner border border-white/5 relative group">
            <Shield className="w-10 h-10" />
            <div className="absolute inset-0 bg-violet/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none truncate">Admin <span className="text-violet">Dashboard</span></h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-widest border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Authorized
              </div>
              <button onClick={handleLogout} className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                <LogOut className="w-3 h-3" /> Exit
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 rounded-[24px] bg-white/[0.02] border border-white/5 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar">
          <TabButton id="telemetry" current={activeTab} set={setActiveTab} label="Insights" icon={<Activity className="w-4 h-4" />} />
          <TabButton id="system" current={activeTab} set={setActiveTab} label="Network" icon={<Globe className="w-4 h-4" />} />
          <TabButton id="users" current={activeTab} set={setActiveTab} label="Database" icon={<Database className="w-4 h-4" />} />
          <TabButton id="debug" current={activeTab} set={setActiveTab} label="Terminal" icon={<Terminal className="w-4 h-4" />} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'telemetry' && (
          <TelemetryTab stats={stats} logs={logs} onClear={clearLogs} />
        )}
        {activeTab === 'system' && (
          <SystemTab 
            config={systemConfig} 
            update={updateConfig} 
            isSyncing={isSyncing} 
            isAnnouncing={isAnnouncing}
            setIsAnnouncing={setIsAnnouncing}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab profiles={profiles} isSyncing={isSyncing} refresh={fetchSystemData} />
        )}
        {activeTab === 'debug' && (
          <DebugTab logs={debugLogs} onClear={clearDebugLogs} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* --- Sub-Components --- */

function TabButton({ id, current, set, label, icon }) {
  const active = current === id
  return (
    <button 
      onClick={() => set(id)}
      className={`flex items-center gap-3 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${active ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      {active && <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white/[0.05] rounded-[18px] border border-white/5" />}
      <span className={`relative z-10 transition-transform group-hover:scale-110 ${active ? 'text-violet' : ''}`}>{icon}</span>
      <span className="relative z-10">{label}</span>
    </button>
  )
}

function TelemetryTab({ stats, logs, onClear }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Avg Latency" value={`${stats.avgLatency}ms`} icon={<Clock />} color="text-violet" />
        <StatBox label="Requests" value={stats.totalRequests} icon={<Database />} color="text-blue-400" />
        <StatBox label="Success" value={`${stats.successRate}%`} icon={<CheckCircle2 />} color="text-emerald-400" />
        <StatBox label="Tokens" value={stats.totalTokens.toLocaleString()} icon={<Zap />} color="text-fuchsia-400" />
      </div>

      <div className="glass-dark rounded-[40px] p-8 border border-white/5 shadow-2xl overflow-hidden group relative">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 italic">
              <Zap className="w-5 h-5 text-violet animate-pulse" />
              Live Pulse Telemetry
            </h2>
            <button onClick={() => confirm('Purge?') && onClear()} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors">Wipe Data</button>
         </div>
         <div className="h-64 flex items-end gap-1.5">
            {logs.slice(0, 50).reverse().map(log => (
               <div 
                 key={log.id}
                 title={`${log.apiType}: ${log.latency.toFixed(0)}ms`}
                 className={`flex-1 rounded-t-sm transition-all duration-500 ${log.status === 'success' ? 'bg-gradient-to-t from-violet/10 to-violet' : 'bg-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}
                 style={{ height: `${Math.min(100, (log.latency / 5000) * 100)}%` }}
               />
            ))}
         </div>
         <div className="flex justify-between mt-6 border-t border-white/5 pt-4 text-[9px] font-black text-neutral-600 uppercase tracking-[0.5em]">
            <span>Archive</span>
            <span>Real-time Flow</span>
         </div>
      </div>
    </motion.div>
  )
}

function SystemTab({ config, update, isSyncing, isAnnouncing, setIsAnnouncing }) {
  const [keyInput, setKeyInput] = useState(config.api_key_override)
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => forceUpdate(n => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Maintenance Shield */}
      <div className={`p-10 rounded-[40px] border transition-all duration-700 flex flex-col justify-between h-80 ${config.maintenance_mode ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)]' : 'glass-dark border-white/5'}`}>
         <div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border ${config.maintenance_mode ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
               <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">Maintenance <span className={config.maintenance_mode ? 'text-red-500' : 'text-emerald-500'}>Shield</span></h3>
            <p className="text-neutral-500 text-xs font-medium leading-relaxed">Locks entire community access except for developers. Use during major network updates.</p>
         </div>
         <button 
           onClick={() => update('maintenance_mode', !config.maintenance_mode)}
           className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all transform active:scale-95 ${config.maintenance_mode ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'glass-dark border-white/5 text-emerald-400 hover:bg-emerald-500/5'}`}
         >
           {config.maintenance_mode ? 'Deactivate Shield' : 'Activate Shield'}
         </button>
      </div>

      {/* Global Broadcast Hub */}
      <div className="lg:col-span-2 glass-dark rounded-[40px] p-10 border border-white/5 flex flex-col justify-between h-80 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Send className="w-32 h-32 text-violet" />
         </div>
         
         {(() => {
           const ann = config.system_message;
           const isActive = ann && ann.text && new Date(ann.expires_at) > new Date();
           
           if (isActive) {
             const timeLeft = Math.max(0, Math.floor((new Date(ann.expires_at) - new Date()) / 60000));
             return (
               <>
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Active <span className="text-violet">Broadcast</span></h3>
                       <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-widest uppercase animate-pulse">
                          <Activity className="w-3 h-3" /> Transmitting
                       </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
                       <div className="flex items-center gap-3 mb-2">
                          <span className={`w-2 h-2 rounded-full ${ann.style === 'urgent' ? 'bg-red-500' : ann.style === 'warn' ? 'bg-amber-500' : 'bg-violet'}`} />
                          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{ann.style} Style</span>
                       </div>
                       <p className="text-sm font-bold text-white line-clamp-2 leading-relaxed">{ann.text}</p>
                    </div>
                 </div>
                 <div className="flex gap-4 items-center relative z-10">
                    <div className="flex-1 flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/5">
                       <Clock className="w-4 h-4 text-neutral-600" />
                       <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Expires in: <span className="text-white">{timeLeft}m</span></span>
                    </div>
                    <button 
                      onClick={() => update('system_message', {})}
                      className="px-8 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      Terminate
                    </button>
                 </div>
               </>
             )
           }

           return (
             <>
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight italic">System <span className="text-violet">Notifications</span></h3>
                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/20 text-violet text-[9px] font-black tracking-widest uppercase">
                        <Globe className="w-3 h-3" /> Live Management
                     </div>
                  </div>
                  <p className="text-neutral-500 text-xs font-medium leading-relaxed max-w-md mb-10">
                     Deploy network-wide notifications with custom durations and style presets for all active users.
                  </p>
               </div>
               <button 
                 onClick={() => setIsAnnouncing(true)}
                 className="relative z-10 w-full py-5 rounded-2xl bg-violet text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-violet/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
               >
                 <Zap className="w-5 h-5 fill-white" /> Create Announcement
               </button>
             </>
           )
         })()}
      </div>

      <AnimatePresence>
        {isAnnouncing && (
          <AnnouncementModal 
            onClose={() => setIsAnnouncing(false)} 
            onSend={(data) => {
              update('system_message', data);
              setIsAnnouncing(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* API Override Hub */}
      <div className="lg:col-span-3 glass-dark rounded-[40px] p-10 border border-white/5 overflow-hidden group">
         <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-fuchsia-500/10 rounded-2xl text-fuchsia-400 border border-fuchsia-500/20 shadow-inner">
                  <KeyRound className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight italic">AI Key <span className="text-fuchsia-400">Override Engine</span></h3>
            </div>
            <div className="text-[10px] items-center gap-2 text-neutral-500 font-black uppercase tracking-widest hidden sm:flex">
               <Database className="w-3.5 h-3.5" /> High-Priority Sync
            </div>
         </div>
         <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2 w-full">
               <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Universal Groq API Override</label>
               <input 
                 type="password"
                 value={keyInput}
                 onChange={(e) => setKeyInput(e.target.value)}
                 className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 text-sm font-bold text-white tracking-[0.5em] focus:outline-none focus:border-fuchsia-400/30 transition-all placeholder:tracking-normal placeholder:text-neutral-700"
                 placeholder="gsk_********************"
               />
            </div>
            <button 
              onClick={() => update('api_key_override', keyInput)}
              className="px-8 py-5 rounded-2xl bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
            >
              Deploy Override
            </button>
         </div>
      </div>
    </motion.div>
  )
}

function UsersTab({ profiles, isSyncing, refresh }) {
  const toggleBan = async (id, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentStatus })
      .eq('id', id);
    if (!error) refresh();
  };

  const setOverride = async (id) => {
    const key = prompt('Enter Groq API Key Override for this user (gsk_...):');
    if (key === null) return;
    const { error } = await supabase
      .from('profiles')
      .update({ api_key_override: key || null })
      .eq('id', id);
    if (!error) refresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-dark rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
         <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic flex items-center gap-4">
            <Users className="w-5 h-5 text-blue-400" />
            Resident Audit <span className="text-[10px] text-neutral-600 mt-1">({profiles.length} Active)</span>
         </h2>
         <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
            <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Syncing DB
         </div>
      </div>
      <div className="overflow-x-auto">
         <table className="w-full text-left">
            <thead>
               <tr className="text-[10px] font-black text-neutral-600 uppercase tracking-widest border-b border-white/5 bg-white/[0.005]">
                  <th className="px-8 py-6">ID / Identity</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Key Config</th>
                  <th className="px-8 py-6 text-right pr-12">Command Control</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
               {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-600 ${p.is_banned ? 'text-red-500 scale-90 opacity-50' : 'group-hover:text-violet'} transition-all`}>
                              <User className="w-5 h-5" />
                           </div>
                           <div className="flex flex-col">
                             <div className={`font-mono text-xs ${p.is_banned ? 'text-red-900 line-through' : 'text-neutral-400'}`}>{p.id.slice(0, 16)}...</div>
                             <div className="text-[8px] font-black text-neutral-700 uppercase">{new Date(p.updated_at).toLocaleDateString()}</div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${p.is_banned ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {p.is_banned ? 'BANNED' : 'ACTIVE'}
                        </span>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setOverride(p.id)} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border transition-all ${p.api_key_override ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' : 'bg-white/5 text-neutral-600 border-white/10 hover:border-white/20'}`}>
                            {p.api_key_override ? 'CUSTOM KEY' : 'DEFAULT'}
                          </button>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right pr-12">
                        <div className="flex items-center justify-end gap-4">
                           <button 
                             onClick={() => toggleBan(p.id, p.is_banned)}
                             className={`text-[10px] font-black uppercase tracking-widest transition-all ${p.is_banned ? 'text-blue-400 hover:text-white' : 'text-red-600 hover:text-red-400'}`}
                           >
                             {p.is_banned ? 'Unrestrict Access' : 'Restrict Access'}
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </motion.div>
  )
}

function LoginView({ password, setPassword, showPassword, setShowPassword, loginError, handleLogin }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass-dark p-12 rounded-[48px] border border-white/5 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-violet/50 to-transparent" />
        <div className="w-20 h-20 bg-violet/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-violet shadow-lg border border-white/5">
          <KeyRound className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-3 italic">Vault <span className="text-violet">Login</span></h1>
        <p className="text-neutral-500 text-sm mb-10 font-medium">Verify developer identity to access 4Aura Headquarters.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-violet transition-colors" />
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="Developer Credential"
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-12 pr-12 text-white focus:outline-none focus:border-violet transition-all text-sm font-bold tracking-[0.4em] placeholder:tracking-normal placeholder:text-neutral-700 shadow-inner"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-white transition-colors">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {loginError && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-shake">{loginError}</p>}
          <button type="submit" className="w-full py-5 rounded-2xl bg-violet text-white font-black uppercase tracking-[0.3em] shadow-xl shadow-violet/20 hover:bg-violet-600 transition-all active:scale-[0.98]">
            Grant Access
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function StatBox({ icon, label, value, color }) {
  return (
    <div className="glass-dark px-6 py-5 rounded-3xl border border-white/5 flex items-center gap-4 shadow-xl">
      <div className={`p-2.5 rounded-xl bg-white/[0.03] ${color}`}>{icon}</div>
      <div>
        <div className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1 italic">{label}</div>
        <div className={`text-xl font-black italic tracking-tigh ${color}`}>{value}</div>
      </div>
    </div>
  )
}

function DebugTab({ logs, onClear }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
       <div className="glass-dark rounded-[40px] border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[600px]">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-neutral-900 rounded-2xl text-emerald border border-white/5 font-mono text-xs">AURA_OS v4.0.1</div>
                <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic flex items-center gap-3">
                   <Terminal className="w-5 h-5 text-emerald" />
                   System Terminal
                </h2>
             </div>
             <button onClick={() => confirm('Purge Terminal?') && onClear()} className="text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Flush Buffer
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] space-y-2 bg-black/[0.2] scroll-smooth no-scrollbar">
             {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-700 opacity-50 space-y-4">
                   <Activity className="w-8 h-8 animate-pulse" />
                   <p className="tracking-widest uppercase text-[9px] font-black text-center">Waiting for system events...<br/>Interaction required to trigger logs.</p>
                </div>
             ) : (
                logs.map(log => (
                   <div key={log.id} className="flex gap-4 group hover:bg-white/[0.02] -mx-4 px-4 py-1 rounded transition-colors">
                      <span className="text-neutral-700 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`shrink-0 font-black uppercase ${
                        log.level === 'error' ? 'text-red-500' : 
                        log.level === 'warn' ? 'text-amber-500' : 
                        'text-emerald'
                      }`}>{log.level}</span>
                      <span className="text-neutral-300 break-all leading-relaxed">{log.message}</span>
                      {log.data && (
                         <div className="hidden group-hover:block ml-auto text-[9px] text-neutral-600 bg-black/40 px-2 rounded border border-white/5 truncate max-w-[200px]">
                            {log.data}
                         </div>
                      )}
                   </div>
                ))
             )}
          </div>
          <div className="p-4 bg-black/40 border-t border-white/5 text-[9px] font-black text-neutral-700 uppercase tracking-widest flex justify-between">
             <span>Kernel: Stable</span>
             <span>Sync Status: Real-time</span>
          </div>
       </div>
    </motion.div>
  )
}

function AnnouncementModal({ onClose, onSend }) {
  const [text, setText] = useState('')
  const [duration, setDuration] = useState('10m')
  const [style, setStyle] = useState('info')
  const [useSound, setUseSound] = useState(true)

  const parseDuration = (str) => {
    const units = { m: 60, h: 3600, d: 86400 };
    let totalSeconds = 0;
    const matches = str.matchAll(/(\d+)([mhd])/g);
    for (const match of matches) {
      totalSeconds += parseInt(match[1]) * units[match[2]];
    }
    return totalSeconds || 600; // Default 10m
  }

  const handleSend = () => {
    if (!text.trim()) return;
    const seconds = parseDuration(duration);
    const expires_at = new Date(Date.now() + seconds * 1000).toISOString();
    onSend({
      text: text.trim(),
      expires_at,
      style,
      sound: useSound,
      type: 'global_announcement',
      timestamp: new Date().toISOString()
    });
  }

  const templates = [
    { name: 'Update', text: '🚀 Systems updated. Refresh for new features!' },
    { name: 'Maintenance', text: '⚠️ Maintenance incoming in {time}.' },
    { name: 'Event', text: '🔥 Special community event starting now!' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-[#0B0C0E] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-violet/10 text-violet border border-violet/20">
               <Zap className="w-6 h-6 fill-violet" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Announcement <span className="text-violet">Constructor</span></h2>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-neutral-500 transition-all"><XCircle className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
          {/* Templates */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Quick Templates</span>
            <div className="flex gap-2">
              {templates.map(t => (
                <button 
                  key={t.name}
                  onClick={() => setText(t.text)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-neutral-400 hover:text-white hover:border-violet/30 transition-all uppercase tracking-widest"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest leading-none">Broadcast Message</span>
                <span className={`text-[10px] font-black uppercase ${text.length > 200 ? 'text-red-500' : 'text-neutral-700'}`}>{text.length}/280</span>
             </div>
             <textarea 
               autoFocus
               value={text}
               onChange={(e) => setText(e.target.value.slice(0, 280))}
               className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-6 text-lg font-bold text-white placeholder:text-neutral-800 focus:outline-none focus:border-violet transition-all h-32 resize-none"
               placeholder="What needs to be heard?"
             />
          </div>

          <div className="grid grid-cols-2 gap-8">
             {/* Duration */}
             <div className="space-y-4">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Active Duration (e.g. 10m, 1h, 1d)</span>
                <div className="relative">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-700" />
                   <input 
                     type="text"
                     value={duration}
                     onChange={(e) => setDuration(e.target.value)}
                     className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-black text-white focus:outline-none focus:border-violet transition-all tracking-widest"
                   />
                </div>
             </div>

             {/* Style */}
             <div className="space-y-4">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Visual Style</span>
                <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl">
                   {['info', 'warn', 'urgent'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${style === s ? 'bg-violet text-white shadow-lg' : 'text-neutral-600 hover:text-neutral-400'}`}
                      >
                         {s}
                      </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Additional Features */}
          <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5">
             <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Bell className="w-5 h-5" /></div>
                <div>
                   <div className="text-xs font-black text-white uppercase tracking-tighter">Audio Notification</div>
                   <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">Alert all clients on arrival</div>
                </div>
             </div>
             <button 
               onClick={() => setUseSound(!useSound)}
               className={`w-14 h-8 rounded-full transition-all relative ${useSound ? 'bg-emerald-500' : 'bg-neutral-800'}`}
             >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${useSound ? 'right-1' : 'left-1'}`} />
             </button>
          </div>
        </div>

        <footer className="p-8 bg-black/40 border-t border-white/5">
           <button 
             onClick={handleSend}
             disabled={!text.trim()}
             className="w-full py-5 rounded-3xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-violet hover:text-white transition-all active:scale-[0.98] disabled:opacity-20"
           >
              Authorize Broadcast
           </button>
        </footer>
      </motion.div>
    </div>
  )
}
