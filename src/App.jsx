import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import WatchlistPage from './pages/WatchlistPage'
import RecommendPage from './pages/RecommendPage'
import SettingsPage from './pages/SettingsPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import InvitePage from './pages/InvitePage'
import DevPage from './pages/DevPage'
import MediaListModal from './components/MediaListModal'
import ShareModal from './components/ShareModal'
import CustomModal from './components/CustomModal'
import { useModal } from './context/ModalContext'
import { supabase } from './lib/supabase'
import { AlertCircle, ShieldAlert, Zap, AlertTriangle, X } from 'lucide-react'

function GlobalBanner() {
  const [announcement, setAnnouncement] = useState(() => {
    const saved = localStorage.getItem('aura_system_message');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  })
  
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const checkExpiration = () => {
      if (announcement?.expires_at) {
        const expires = new Date(announcement.expires_at).getTime();
        if (Date.now() > expires) {
          setIsVisible(false);
          setAnnouncement(null);
          localStorage.removeItem('aura_system_message');
        } else {
          setIsVisible(true);
        }
      }
    }

    const interval = setInterval(checkExpiration, 5000);
    checkExpiration();

    const fetchMsg = async () => {
      const { data } = await supabase.from('system_config').select('value').eq('key', 'system_message').single()
      if (data && typeof data.value === 'object') {
        handleNewAnnouncement(data.value);
      }
    }
    fetchMsg()
    
    // Listen for changes
    const channel = supabase
      .channel('system_broadcast')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config', filter: `key=eq.system_message` }, 
          (payload) => {
            if (payload.new?.value) handleNewAnnouncement(payload.new.value);
          })
      .subscribe()

    const handleNewAnnouncement = (data) => {
      // 1. Guard against empty data
      if (!data || !data.text) {
        setAnnouncement(null);
        setIsVisible(false);
        return;
      }

      // 2. Guard against ALREADY expired messages (The fix for "comes back randomly")
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setAnnouncement(null);
        setIsVisible(false);
        return;
      }

      // Rest of logic
      // Check if this is a NEW announcement to avoid sound spam
      const lastHeard = localStorage.getItem('aura_last_heard_announcement');
      const isNew = data.timestamp !== lastHeard;
      
      setAnnouncement(data);
      localStorage.setItem('aura_system_message', JSON.stringify(data));
      setIsVisible(true);
      
      if (data.sound && isNew) {
        localStorage.setItem('aura_last_heard_announcement', data.timestamp);
        try {
          const sounds = {
            info: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
            warn: 'https://assets.mixkit.co/active_storage/sfx/221/221-preview.mp3',
            urgent: 'https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3'
          };
          const audio = new Audio(sounds[data.style] || sounds.info);
          audio.volume = data.style === 'urgent' ? 0.6 : 0.4;
          audio.play().catch(() => {});
        } catch (e) {}
      }
    }

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    }
  }, [announcement?.expires_at])

  if (!announcement || !isVisible) return null

  const styles = {
    info: "from-violet to-fuchsia",
    warn: "from-amber-500 to-orange-600",
    urgent: "from-red-600 to-fuchsia-700 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
  }

  const icons = {
    info: <AlertCircle className="w-3.5 h-3.5" />,
    warn: <AlertTriangle className="w-3.5 h-3.5" />,
    urgent: <Zap className="w-3.5 h-3.5 fill-white" />
  }

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={`bg-gradient-to-r ${styles[announcement.style] || styles.info} py-2.5 text-center relative z-[60] border-b border-white/10`}
    >
      <div className="container mx-auto px-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2.5">
           {icons[announcement.style] || icons.info}
           <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none drop-shadow-sm">
             {announcement.text}
           </p>
        </div>
        <button 
          onClick={() => { setIsVisible(false); setAnnouncement(null); }}
          className="absolute right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-white/60" />
        </button>
      </div>
    </motion.div>
  )
}

function MaintenanceGuard({ children }) {
  const [isMaintenance, setIsMaintenance] = useState(localStorage.getItem('aura_maintenance_mode') === 'true')
  const isDev = localStorage.getItem('aura_dev_auth') === 'true'

  useEffect(() => {
    const fetchMode = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch user-specific overrides
        const { data: profile } = await supabase.from('profiles').select('api_key_override').eq('id', user.id).single()
        if (profile?.api_key_override) {
          localStorage.setItem('aura_user_key_override', profile.api_key_override)
        } else {
          localStorage.removeItem('aura_user_key_override')
        }
      }

      const { data } = await supabase.from('system_config').select('value').eq('key', 'maintenance_mode').single()
      if (data) {
        const active = data.value === true
        setIsMaintenance(active)
        localStorage.setItem('aura_maintenance_mode', active ? 'true' : 'false')
      }
    }
    fetchMode()

    const channel = supabase
      .channel('maintenance_check')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_config', filter: `key=eq.maintenance_mode` }, 
          (payload) => {
            const active = payload.new.value === true
            setIsMaintenance(active)
            localStorage.setItem('aura_maintenance_mode', active ? 'true' : 'false')
          })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  if (isMaintenance && !isDev) {
    return (
      <div className="fixed inset-0 z-[100] bg-base flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
           <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-12 h-12" />
           </div>
           <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Core <span className="text-red-500">Locked</span></h1>
              <p className="text-neutral-500 font-medium leading-relaxed">4Aura is currently undergoing a system-wide developer update. We'll be back online in a few micro-cycles.</p>
           </div>
           <div className="pt-8 border-t border-white/5">
              <div className="flex items-center gap-3 justify-center">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Administrative Hold Active</span>
              </div>
           </div>
        </div>
      </div>
    )
  }

  return children;
}

export default function App() {
  const location = useLocation()
  const { isMediaModalOpen, isShareModalOpen, activeAnime, closeMediaModal, closeShareModal } = useModal()

  return (
    <div className="min-h-screen bg-base">
      <GlobalBanner />
      <MaintenanceGuard>
        <Navbar />
        <main className="pt-20">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/anime/:id" element={<DetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:room" element={<ChatPage />} />
            <Route path="/server/:serverId/:channelId?" element={<ChatPage />} />
            <Route path="/u/:userId" element={<ProfilePage />} />
            <Route path="/inv/:code" element={<InvitePage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/recommend" element={<RecommendPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/dev" element={<DevPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      </MaintenanceGuard>
      
      {!location.pathname.startsWith('/chat') && 
       !location.pathname.startsWith('/server') && 
       !location.pathname.startsWith('/u/') && <Footer />}

      {activeAnime && (
        <>
          <MediaListModal 
            anime={activeAnime} 
            isOpen={isMediaModalOpen} 
            onClose={closeMediaModal} 
          />
          <ShareModal />
          <CustomModal />
        </>
      )}
      {!activeAnime && <CustomModal />}
    </div>
  )
}
