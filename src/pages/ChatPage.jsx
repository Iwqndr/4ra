import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Hash, Users, Sparkles, MessageSquare, 
  Search, Plus, Shield, Globe, User, 
  Loader2, Bell, Settings, Info, ExternalLink,
  MessageSquarePlus, Check
} from 'lucide-react';
import uiStrings from '../config/ui_strings.json';

// --- SHARED COMPONENTS ---

export function RichLinkCard({ metadata, url }) {
  if (!metadata) return null;
  return (
    <div className="my-3 rounded-2xl bg-white/5 border border-white/10 overflow-hidden max-w-sm hover:border-accent/30 transition-all group">
      {metadata.image && (
        <div className="aspect-video w-full overflow-hidden border-b border-white/5">
          <img src={metadata.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
           <Globe className="w-3 h-3" />
           <span>{url ? new URL(url).hostname : '4Aura'}</span>
        </div>
        <h4 className="text-sm font-black text-white line-clamp-2 leading-tight group-hover:text-accent transition-colors">{metadata.title}</h4>
        {metadata.description && (
          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{metadata.description}</p>
        )}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 pt-2 text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
        >
          View Source <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export function ShareToChatButton({ anime, url }) {
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();

  const handleShare = async () => {
    const token = localStorage.getItem('anilist_token');
    if (!token) {
      alert("Please connect your AniList account to share to chat!");
      navigate('/settings');
      return;
    }
    setStatus('sharing');
    const roomName = "global";
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = isDev ? 'localhost:8787' : window.location.host;
    const wsUrl = `${protocol}//${host}/chat/ws/${roomName}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        const user = JSON.parse(localStorage.getItem('user_profile_data') || '{}');
        ws.send(JSON.stringify({
          type: 'message',
          userId: user.id || 'anon',
          userName: user.name || 'Anonymous',
          userAvatar: user.avatar?.large || '',
          content: `Check out ${anime.title}!`,
          isRichLink: true,
          metadata: {
            title: anime.title,
            description: anime.synopsis?.substring(0, 150) + '...',
            image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
            url: url
          }
        }));
        setTimeout(() => { ws.close(); setStatus('success'); setTimeout(() => setStatus('idle'), 3000); }, 500);
      };
      ws.onerror = () => { setStatus('idle'); alert("Failed to share to chat. Is the worker running?"); };
    } catch (err) { setStatus('idle'); }
  };

  return (
    <button
      onClick={handleShare}
      disabled={status !== 'idle'}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
        status === 'success' 
        ? 'bg-emerald/20 text-emerald border border-emerald/30' 
        : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {status === 'sharing' ? <Loader2 className="w-4 h-4 animate-spin" /> : status === 'success' ? <Check className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
      {status === 'sharing' ? 'Sharing...' : status === 'success' ? 'Shared to Chat!' : 'Share to Chat'}
    </button>
  );
}

// --- MAIN PAGE ---

const ROOMS = [
  { id: 'global', name: 'Global Chat', icon: <Globe className="w-4 h-4" /> },
  { id: 'recommendations', name: 'AI Discussions', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'offtopic', name: 'Off Topic', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'spoilers', name: 'Spoiler Zone', icon: <Shield className="w-4 h-4" /> },
];

export default function ChatPage() {
  const { room: roomParam } = useParams();
  const navigate = useNavigate();
  const activeRoom = roomParam || 'global';
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [userCount, setUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('anilist_token');
    if (!savedToken) {
      setUser(null);
    } else {
      const savedUser = localStorage.getItem('user_profile_data');
      if (savedUser) setUser(JSON.parse(savedUser));
      else setUser({ id: 'anilist_user', name: 'AniList Explorer', avatar: { large: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' } });
    }
  }, []);

  useEffect(() => {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = isDev ? 'localhost:8787' : window.location.host;
    const wsUrl = `${protocol}//${host}/chat/ws/${activeRoom}`;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setIsConnected(true);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'history') setMessages(data.messages);
        else if (data.type === 'message') setMessages(prev => [...prev, data]);
        else if (data.type === 'user_count') setUserCount(data.count);
        else if (data.type === 'typing') {
          setTypingUsers(prev => {
            const next = new Set(prev);
            if (data.isTyping) next.add(data.userName); else next.delete(data.userName);
            return next;
          });
        }
      };
      ws.onclose = () => { setIsConnected(false); setTimeout(connect, 3000); };
    };
    connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [activeRoom]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !wsRef.current || !user) return;
    wsRef.current.send(JSON.stringify({ type: 'message', userId: user.id, userName: user.name, userAvatar: user.avatar?.large, content: inputValue, isRichLink: false, metadata: {} }));
    setInputValue('');
    sendTypingStatus(false);
  };

  const sendTypingStatus = (isTyping) => {
    if (!wsRef.current || !user) return;
    wsRef.current.send(JSON.stringify({ type: 'typing', userId: user.id, userName: user.name, isTyping }));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (user && wsRef.current) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 3000);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8 text-center bg-[#0a0a0b]">
        <div className="w-24 h-24 rounded-3xl bg-accent/20 flex items-center justify-center border border-accent/40 mb-8 animate-pulse text-accent"><MessageSquare className="w-12 h-12" /></div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Chat is Restricted</h2>
        <p className="text-neutral-500 max-w-md mb-8 font-bold uppercase tracking-widest text-xs leading-loose">To continue chatting with the 4Aura community, please connect your AniList account.</p>
        <button onClick={() => navigate('/settings')} className="px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95">Go to Settings</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-20 z-[60] flex bg-[#060607] h-[calc(100vh-80px)] overflow-hidden">
      <aside className="hidden md:flex w-72 flex-col border-r border-white/5 bg-[#0f0f11]/80 backdrop-blur-3xl shrink-0">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(255,94,58,0.5)]" /><h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Channels</h2></div>
          <Plus className="w-4 h-4 text-neutral-600 hover:text-white cursor-pointer transition-colors" />
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
          {ROOMS.map(room => (
            <button key={room.id} onClick={() => navigate(`/chat/${room.id}`)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeRoom === room.id ? 'bg-accent/10 border border-accent/20 text-white' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300 border border-transparent'}`}>
              <div className={`p-2 rounded-xl transition-all ${activeRoom === room.id ? 'bg-accent text-white' : 'bg-white/5 text-neutral-600 group-hover:text-white'}`}>{room.icon}</div>
              <span className="text-[11px] font-black uppercase tracking-widest">{room.name}</span>
              {activeRoom === room.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(255,94,58,0.8)]" />}
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-white/5 bg-black/20">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0"><img src={user.avatar?.large} className="w-full h-full object-cover" alt="" /></div>
              <div className="flex flex-col min-w-0"><span className="text-xs font-black text-white truncate">{user.name}</span><span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald" />Online</span></div>
              <Settings className="w-4 h-4 text-neutral-600 hover:text-white ml-auto cursor-pointer" />
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#121214]/30">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10"><Hash className="w-5 h-5 text-neutral-400" /></div>
            <div><h1 className="text-lg font-black text-white tracking-tight uppercase tracking-[0.2em]">{ROOMS.find(r => r.id === activeRoom)?.name || activeRoom}</h1><p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Global Community Access</p></div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3"><Users className="w-4 h-4 text-neutral-500" /><span className="text-[11px] font-black text-white uppercase tracking-widest">{userCount}</span></div>
                <div className="w-px h-4 bg-white/10" /><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" /><span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Active</span></div>
             </div>
             <Bell className="w-5 h-5 text-neutral-600 hover:text-accent cursor-pointer transition-colors" />
          </div>
        </header>

        <section ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth hide-scrollbar">
          {messages.map((msg, i) => (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={msg.id || i} className="flex gap-6 max-w-4xl group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 shadow-2xl shrink-0 group-hover:scale-105 transition-transform duration-500"><img src={msg.userAvatar || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" /></div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-4"><span className="text-[13px] font-black text-white hover:text-accent cursor-pointer transition-colors">{msg.userName}</span><span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="text-[15px] text-neutral-300 leading-relaxed font-medium">{msg.content}</div>
                {(msg.is_rich_link || msg.metadata) && <RichLinkCard metadata={typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata} url={(typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata)?.url} />}
              </div>
            </motion.div>
          ))}
        </section>

        <AnimatePresence>{typingUsers.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-28 left-8 flex items-center gap-3 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 backdrop-blur-xl z-10">
            <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '200ms' }} /><div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '400ms' }} /></div>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">{Array.from(typingUsers).join(', ')} typing...</span>
          </motion.div>
        )}</AnimatePresence>

        <footer className="p-8 pt-0 sticky bottom-0 z-20">
          <form onSubmit={handleSendMessage} className={`flex items-center gap-4 p-4 rounded-[32px] bg-white/[0.03] border transition-all duration-500 focus-within:bg-white/[0.06] ${isConnected ? 'border-white/5 focus-within:border-accent/40' : 'border-rose-500/40 opacity-50'}`}>
            <div className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"><Plus className="w-5 h-5 text-neutral-500" /></div>
            <input type="text" value={inputValue} onChange={handleInputChange} disabled={!isConnected} placeholder={isConnected ? `Message #${activeRoom}` : 'Connecting to server...'} className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-white placeholder:text-neutral-600 font-medium px-2" />
            <button type="submit" disabled={!inputValue.trim()} className={`p-4 rounded-2xl transition-all ${inputValue.trim() ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105 active:scale-95' : 'bg-white/5 text-neutral-700'}`}><Send className="w-5 h-5" /></button>
          </form>
          <div className="flex items-center justify-between mt-4 px-4 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
             <div className="flex items-center gap-6"><span><Settings className="w-3 h-3 inline mr-1" /> Chat Settings</span><span><Info className="w-3 h-3 inline mr-1" /> Shortcuts</span></div>
             <div className="flex items-center gap-2">Server Status: {!isConnected ? <button onClick={() => window.location.reload()} className="text-rose-500 hover:text-rose-400"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> RETRYING...</button> : <span className="text-emerald">OPERATIONAL</span>}</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
