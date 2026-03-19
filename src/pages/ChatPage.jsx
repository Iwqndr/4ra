import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Hash, Users, Sparkles, MessageSquare, 
  Search, Plus, Shield, Globe, User, 
  Loader2, Bell, Settings, Info, ExternalLink,
  MessageSquarePlus, Check, ChevronDown, ChevronRight,
  MoreVertical, LogOut, Share2, Copy, Trash2, 
  Layers, Ghost, Zap, Wind, ArrowRight, X, AlertCircle, Link as LinkIcon,
  Crown, Key, Palette, UserPlus, Sliders
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import uiStrings from '../config/ui_strings.json';
import { getGroqResponse } from '../api/groq';
import { addDebugLog } from '../utils/logger';
import { confirm as customConfirm, prompt as customPrompt, alert as customAlert } from '../components/CustomModal';

// --- SHARED COMPONENTS ---
export function RichLinkCard({ metadata, url }) {
  if (!metadata) return null;
  return (
    <div className="my-5 rounded-[32px] bg-white/[0.03] border border-white/10 overflow-hidden max-w-sm hover:border-sky-500/40 transition-all group backdrop-blur-3xl shadow-2xl">
      {metadata.image && (
        <div className="aspect-[16/10] w-full overflow-hidden border-b border-white/10 relative">
          <img src={metadata.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="p-5 space-y-3">
        <h4 className="text-sm font-black text-white line-clamp-2 leading-snug group-hover:text-sky-400 transition-colors tracking-tight">{metadata.title}</h4>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-sky-500 text-[9px] font-black text-white uppercase tracking-widest hover:bg-white hover:text-black transition-all">
          Explore Now <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export function ShareToChatButton({ anime, url }) {
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();

  const handleShare = async () => {
    const userStr = localStorage.getItem('user_profile_data');
    if (!userStr) {
      customAlert("Sync Required", "Please connect your AniList account to share to chat!");
      navigate('/settings');
      return;
    }
    setStatus('sharing');
    
    try {
      const user = JSON.parse(userStr);
      const { error } = await supabase
        .from('messages')
        .insert([{
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.avatar?.large,
          content: `Check out ${anime.title.english || anime.title.romaji}!`,
          is_rich_link: true,
          room_id: 'global',
          metadata: {
            title: anime.title.english || anime.title.romaji,
            description: anime.description?.substring(0, 150) + '...',
            image: anime.coverImage?.large,
            url: url
          }
        }]);

      if (error) throw error;
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error("Share error:", err);
      setStatus('idle');
      customAlert("Broadcast Failed", "Failed to share to chat.", 'danger');
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={status !== 'idle'}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
        status === 'success' 
        ? 'bg-emerald/20 text-emerald border border-emerald/30' 
        : 'bg-neutral-50 border border-neutral-100 text-neutral-400 hover:text-sky-500 hover:bg-sky-50'
      }`}
    >
      {status === 'sharing' ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : status === 'success' ? <Check className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
      {status === 'sharing' ? 'Sharing...' : status === 'success' ? 'Shared to Chat!' : 'Share to Chat'}
    </button>
  );
}

// --- PERMISSIONS HELPER ---
const PERMISSIONS = {
  MANAGE_HUB: 'manage_hub',
  MANAGE_CHANNELS: 'manage_channels',
  KICK_MEMBERS: 'kick_members',
  DELETE_MESSAGES: 'delete_messages'
};

// --- MAIN HUB ---

export default function ChatPage() {
  const { serverId: serverIdParam, channelId: channelIdParam } = useParams();
  const navigate = useNavigate();
  
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [myRoles, setMyRoles] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  
  // Modals & Overlays
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [serverCheckStatus, setServerCheckStatus] = useState('idle');
  const [existingServer, setExistingServer] = useState(null);
  const [showMemberSidebar, setShowMemberSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showingEmojiFor, setShowingEmojiFor] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);
  const checkTimeoutRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_profile_data');
    if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        addDebugLog(`User Profile Loaded: ${u.name} (${u.id})`, 'info');
        fetchUserServers(u.id);
    } else {
        addDebugLog('No user profile found in localStorage, redirecting to settings', 'warn');
        navigate('/settings');
    }
  }, []);

  const fetchUserServers = async (userId) => {
    try {
      const { data: memberData } = await supabase.from('server_members').select('server_id').eq('user_id', userId);
      const serverIds = (memberData || []).map(m => m.server_id);
      const { data: serverData } = await supabase.from('servers').select('*').in('id', serverIds);
      setServers(serverData || []);
    } catch (err) {
      console.error("Fetch servers error:", err);
    }
  };

  useEffect(() => {
    if (!serverIdParam) {
        setActiveServer({ id: 'global', name: '4Aura Global Hub', icon: null });
        setChannels([{ id: 'global', name: 'general', type: 'text' }]);
        setActiveChannel({ id: 'global', name: 'general' });
        return;
    }

    const loadContext = async () => {
        const { data: srv } = await supabase.from('servers').select('*').eq('id', serverIdParam).maybeSingle();
        const { data: chns } = await supabase.from('channels').select('*').eq('server_id', serverIdParam).order('order', { ascending: true });
        const { data: rls } = await supabase.from('server_roles').select('*').eq('server_id', serverIdParam).order('order', { ascending: false });
        
        setActiveServer(srv);
        setChannels(chns || []);
        setRoles(rls || []);
        
        const currentChannel = chns?.find(c => c.id === channelIdParam) || chns?.[0] || { id: 'default', name: 'general' };
        setActiveChannel(currentChannel);

        // Fetch my membership for roles
        if (user) {
          const { data: mem } = await supabase.from('server_members').select('role_ids').eq('server_id', serverIdParam).eq('user_id', user.id).maybeSingle();
          if (mem) setMyRoles(rls?.filter(r => mem.role_ids?.includes(r.id)) || []);
        }
    };
    loadContext();
  }, [serverIdParam, channelIdParam, user]);

  useEffect(() => {
    if (!activeChannel || !user) return;
    const channelId = activeChannel.id;
    const isGlobal = channelId === 'global';

    const fetchHistory = async () => {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
      if (isGlobal) query = query.eq('room_id', 'global');
      else query = query.eq('channel_id', channelId);
      const { data } = await query;
      if (data) setMessages(data.map(m => ({ ...m, userName: m.user_name, userAvatar: m.user_avatar, timestamp: m.created_at })));
    };
    fetchHistory();

    const sub = supabase.channel(`room-${channelId}`, { config: { presence: { key: user.id } } });
    channelRef.current = sub;

    sub.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: isGlobal ? 'room_id=eq.global' : `channel_id=eq.${channelId}` }, (payload) => {
        console.log('[Chat] Realtime Payload Received:', payload);
        setMessages(prev => [...prev, { ...payload.new, userName: payload.new.user_name, userAvatar: payload.new.user_avatar, timestamp: payload.new.created_at }]);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = sub.presenceState();
        const onlineMembers = Object.values(state).flat().map(p => p.user_info);
        setMembers(onlineMembers);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          if (payload.payload.isTyping) next.add(payload.payload.userName);
          else next.delete(payload.payload.userName);
          return next;
        });
      })
      .subscribe(async (status) => {
        addDebugLog(`Realtime Subscription Status: ${status} [room-${channelId}]`, status === 'SUBSCRIBED' ? 'info' : 'warn');
        if (status === 'SUBSCRIBED') {
          await sub.track({ user_info: { id: user.id, name: user.name, avatar: user.avatar?.large } });
        }
      });

    return () => { supabase.removeChannel(sub); };
  }, [activeChannel, user]);

  const deleteMessage = async (msgId) => {
    const { error } = await supabase.from('messages').delete().eq('id', msgId).eq('user_id', user.id);
    if (error) customAlert("Error", "Could not delete message.");
  };

  const addReaction = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    const reactions = { ...(msg.reactions || {}) };
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    
    // Optimistic Update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m));
    
    await supabase.from('messages').update({ reactions }).eq('id', msgId);
  };

  const formatMessage = (text) => {
    if (!text) return '';
    // Simple regex for bold, italic, code, and mentions
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-neutral-400">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[13px]">$1</code>')
      .replace(/(@\w+)/g, '<span class="text-sky-400 font-bold hover:underline cursor-pointer">$1</span>');
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typingUsers]);

  const hasPermission = (perm) => {
    if (activeServer?.owner_id === user?.id) return true;
    return myRoles.some(r => r.permissions[perm] === true);
  };

  const sendMessage = async (e) => {
    addDebugLog('Send Button Triggered', 'info');
    e.preventDefault();
    if (!newMessage.trim()) { addDebugLog('Empty Message prevented', 'warn'); return; }
    if (!user) { addDebugLog('No user profile in state', 'error'); return; }
    if (!channelRef.current) { addDebugLog('Realtime Channel not initialized', 'error'); return; }
    
    const content = newMessage;
    setNewMessage('');
    sendTypingStatus(false);
    
    // User Message
  const editMessage = async (msgId) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from('messages').update({ content: editText }).eq('id', msgId).eq('user_id', user.id);
    if (!error) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText } : m));
        setEditingMessageId(null);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
    addDebugLog('Attempting DB Insert', 'info', metadata);

    const { data, error } = await supabase.from('messages').insert([{
      user_id: user.id || 'anonymous', 
      user_name: user.name || user.user_metadata?.full_name || 'Anonymous', 
      user_avatar: user.avatar?.large || user.user_metadata?.avatar_url,
      content: content, 
      room_id: activeChannel.id === 'global' ? 'global' : null,
      channel_id: activeChannel.id === 'global' ? null : activeChannel.id,
      server_id: activeServer?.id === 'global' ? null : activeServer?.id,
      reply_to: replyingTo?.id || null
    }]).select();

    if (error) {
       addDebugLog(`Insert Error: ${error.message}`, 'error', error);
       customAlert("Broadcast Failed", error.message, 'danger');
    } else {
       addDebugLog('Insert Success', 'info', data);
       setReplyingTo(null);
    }
  };

  const sendTypingStatus = (isTyping) => {
    if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userName: user.name, isTyping } });
  };

  // --- HUB MANAGEMENT & ROLES ---
  const handleServerNameChange = (val) => {
    setNewServerName(val);
    if (!val.trim()) { setServerCheckStatus('idle'); return; }
    setServerCheckStatus('checking');
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(async () => {
      const { data } = await supabase.from('servers').select('*').ilike('name', val.trim());
      if (data && data.length > 0) { setExistingServer(data[0]); setServerCheckStatus('exists'); }
      else { setExistingServer(null); setServerCheckStatus('unique'); }
    }, 600);
  };

  const createServer = async () => {
    if (!newServerName.trim() || serverCheckStatus !== 'unique') return;
    const { data: server } = await supabase.from('servers').insert([{ name: newServerName, owner_id: user.id }]).select().single();
    if (server) {
        // Create Owner Role
        const { data: ownerRole } = await supabase.from('server_roles').insert([{
            server_id: server.id,
            name: 'Creator', color: '#ff5e3a',
            permissions: { manage_hub: true, manage_channels: true, kick_members: true, delete_messages: true },
            order: 100
        }]).select().single();

        await supabase.from('server_members').insert([{ server_id: server.id, user_id: user.id, role_ids: ownerRole ? [ownerRole.id] : [] }]);
        await supabase.from('channels').insert([{ server_id: server.id, name: 'nexus' }]);
        
        setServers(prev => [...prev, server]);
        closeServerModal();
        navigate(`/server/${server.id}`);
    } else {
        customAlert("Action Failed", "Failed to create group. Unique name required.", 'danger');
    }
  };

  const joinExistingServer = async () => {
    if (!existingServer) return;
    const { error } = await supabase.from('server_members').upsert({ server_id: existingServer.id, user_id: user.id });
    if (!error) {
      setServers(prev => prev.find(s => s.id === existingServer.id) ? prev : [...prev, existingServer]);
      closeServerModal();
      navigate(`/server/${existingServer.id}`);
    } else {
      customAlert("Join Error", "Failed to join group. Policy check suggested.", 'danger');
    }
  };

  const deleteServer = async (srvId) => {
    const srv = servers.find(s => s.id === srvId);
    const confirmed = await customConfirm("Destroy Hub", `Are you absolutely sure you want to permanently delete "${srv?.name}"? This action cannot be undone.`, 'danger');
    if (!confirmed) return;
    const { error } = await supabase.from('servers').delete().eq('id', srvId).eq('owner_id', user.id);
    if (!error) { setServers(prev => prev.filter(s => s.id !== srvId)); if (serverIdParam === srvId) navigate('/chat'); }
    else { customAlert("Access Denied", `Failed to delete: ${error.message}`, 'danger'); }
    setContextMenu(null);
  };

  const leaveServer = async (srvId) => {
    const { error } = await supabase.from('server_members').delete().eq('server_id', srvId).eq('user_id', user.id);
    if (!error) { setServers(prev => prev.filter(s => s.id !== srvId)); if (serverIdParam === srvId) navigate('/chat'); }
    else { customAlert("Failed", `Failed to leave: ${error.message}`, 'danger'); }
    setContextMenu(null);
  };

  const createRole = async () => {
    const name = await customPrompt("Create New Role", "What should we call this rank?", "e.g., Moderator");
    if (!name) return;
    const { data: role } = await supabase.from('server_roles').insert([{ server_id: activeServer.id, name, color: '#8b5cf6' }]).select().single();
    if (role) setRoles(prev => [role, ...prev]);
  };

  const togglePermission = async (roleId, perm) => {
    const role = roles.find(r => r.id === roleId);
    const newPerms = { ...role.permissions, [perm]: !role.permissions[perm] };
    const { error } = await supabase.from('server_roles').update({ permissions: newPerms }).eq('id', roleId);
    if (!error) setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: newPerms } : r));
  };

  const deleteRole = async (roleId) => {
    const role = roles.find(r => r.id === roleId);
    const confirmed = await customConfirm("Delete Role", `Are you sure you want to remove the "${role?.name}" role?`, 'danger');
    if (!confirmed) return;
    const { error } = await supabase.from('server_roles').delete().eq('id', roleId);
    if (!error) setRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const createChannel = async () => {
    const name = await customPrompt("Create Channel", "Name your new communication node:", "e.g., spoilers-chat");
    if (!name) return;
    const { data: chn } = await supabase.from('channels').insert([{ server_id: activeServer.id, name: name.toLowerCase().replace(' ', '-') }]).select().single();
    if (chn) setChannels(prev => [...prev, chn]);
  };

  const closeServerModal = () => {
    setIsCreatingServer(false);
    setNewServerName('');
    setServerCheckStatus('idle');
    setExistingServer(null);
  };

  const handleContextMenu = (e, server) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, server });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0B0C0E] text-white overflow-hidden relative font-sans" onClick={() => setContextMenu(null)}>
      {/* 1. SERVER LIST (Sidebar Left) */}
      <aside className="w-[72px] shrink-0 bg-[#0B0C0E] border-r border-white/5 flex flex-col items-center py-5 gap-4 overflow-y-auto no-scrollbar z-50">
        <Link to="/" className="w-12 h-12 rounded-[18px] bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all shadow-lg active:scale-90 mb-2">
          <Globe className="w-6 h-6" />
        </Link>
        <div className="w-8 h-px bg-white/5" />
        {servers.map(srv => (
          <div key={srv.id} className="relative group">
            <div className={`absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 transition-all rounded-r-full bg-white ${serverIdParam === srv.id ? 'h-10' : 'h-2 scale-0 group-hover:scale-100'}`} />
            <button 
              onContextMenu={(e) => handleContextMenu(e, srv)}
              onClick={() => navigate(`/server/${srv.id}`)}
              className={`w-12 h-12 rounded-[18px] overflow-hidden border transition-all duration-300 transform active:scale-95 ${serverIdParam === srv.id ? 'border-sky-500 shadow-xl shadow-sky-500/20 rotate-0 rounded-[14px]' : 'border-white/5 hover:border-white/20'}`}
            >
              {srv.icon ? <img src={srv.icon} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center font-black text-xs uppercase text-neutral-400 group-hover:text-white transition-colors">{srv.name.substring(0, 2)}</div>}
            </button>
          </div>
        ))}
        <button onClick={() => setIsCreatingServer(true)} className="w-12 h-12 rounded-[18px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:rounded-[14px] active:scale-90 mt-auto">
          <Plus className="w-6 h-6" />
        </button>
      </aside>

      {/* 2. CHANNELS LIST (Sidebar Inner Left) */}
      <nav className="w-64 shrink-0 bg-[#0B0C0E]/50 border-r border-white/5 flex flex-col z-40">
         <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setShowSettings(true)}>
            <h2 className="font-black text-[11px] uppercase tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors truncate pr-4">{activeServer?.name}</h2>
            <ChevronDown className="w-4 h-4 text-neutral-600" />
         </header>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-8">
            <div>
               <div className="flex items-center justify-between px-2 mb-3">
                  <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Channels</span>
                  {hasPermission(PERMISSIONS.MANAGE_CHANNELS) && <Plus onClick={(e) => { e.stopPropagation(); createChannel(); }} className="w-3.5 h-3.5 text-neutral-600 hover:text-white cursor-pointer" />}
               </div>
               <div className="space-y-1">
                  {channels.map(chn => (
                    <button 
                      key={chn.id} 
                      onClick={() => navigate(`/server/${activeServer.id}/${chn.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${activeChannel?.id === chn.id ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-200 border border-transparent'}`}
                    >
                      <Hash className={`w-4 h-4 ${activeChannel?.id === chn.id ? 'text-sky-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                      <span className="text-[13px] font-bold tracking-tight">{chn.name}</span>
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Current User Info */}
         <footer className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer" onClick={() => navigate(`/u/${user?.id}`)}>
               <div className="w-10 h-10 rounded-[14px] overflow-hidden border border-white/10 group-hover:scale-110 transition-transform bg-white/5">
                  <img src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
               </div>
               <div className="min-w-0 pr-2">
                  <div className="text-[13px] font-black text-white truncate tracking-tighter">{user?.user_metadata?.full_name || 'Anonymous'}</div>
                  <div className="text-[9px] font-bold text-emerald uppercase tracking-widest flex items-center gap-1.5 mt-1 leading-none"><div className="w-1.5 h-1.5 rounded-full bg-emerald" />Online</div>
               </div>
               <Settings className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white ml-auto" />
            </div>
         </footer>
      </nav>

      {/* 3. MAIN CHAT AREA */}
      <section className="flex-1 flex flex-col min-w-0 relative">
        {/* Chat Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-3xl bg-[#0B0C0E]/80 sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500"><Hash className="w-5 h-5" /></div>
             <div>
                <h1 className="text-xl font-black text-white tracking-tighter leading-none mb-1">{activeChannel?.name}</h1>
                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest leading-none">COMMUNICATION NODE</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..." 
                  className="bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:border-sky-500/30 w-48 transition-all focus:w-64"
                />
             </div>
             <button onClick={() => setShowMemberSidebar(!showMemberSidebar)} className={`p-2.5 rounded-xl transition-all ${showMemberSidebar ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
                <Users className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar scroll-smooth relative" 
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {/* Scroll to Bottom FAB */}
          <AnimatePresence>
            {showScrollBottom && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                onClick={() => scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                className="fixed bottom-32 right-12 z-40 p-3 rounded-full bg-sky-500 text-white shadow-2xl hover:bg-sky-400 transition-all flex items-center gap-2 group"
              >
                <div className="text-[9px] font-black uppercase tracking-widest px-2 opacity-0 group-hover:opacity-100 transition-opacity w-0 group-hover:w-auto overflow-hidden">New Messages</div>
                <ChevronDown className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 select-none">
               <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5"><MessageSquarePlus className="w-10 h-10 text-sky-500" /></div>
               <h3 className="text-xl font-black text-white tracking-tighter uppercase italic mb-3">{searchQuery ? 'No results found' : 'Silent Corridor'}</h3>
               <p className="text-xs font-bold text-neutral-500 leading-relaxed uppercase tracking-widest">{searchQuery ? 'Try a different search term.' : 'The board is clear. Initiate the first connection.'}</p>
            </div>
          ) : (
            filteredMessages.map((msg, i) => {
              const replyTarget = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={msg.id} 
                  className={`flex gap-4 group relative hover:bg-white/[0.01] -mx-10 px-10 py-2 transition-all transition-colors ${msg.reply_to ? 'mt-8' : ''}`}
                  onMouseLeave={() => setShowingEmojiFor(null)}
                >
                  {/* Reply Reference Line */}
                  {replyTarget && (
                    <div className="absolute top-[-24px] left-[34px] w-8 h-8 border-l-2 border-t-2 border-white/5 rounded-tl-xl pointer-events-none" />
                  )}

                  {/* Reply Preview Above Message */}
                  {replyTarget && (
                    <div className="absolute top-[-28px] left-[74px] flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer whitespace-nowrap overflow-hidden max-w-[80%]">
                       <div className="w-4 h-4 rounded-md overflow-hidden border border-white/10">
                          <img src={replyTarget.user_avatar} className="w-full h-full object-cover" alt="" />
                       </div>
                       <span className="text-[10px] font-black text-white/40">{replyTarget.user_name}</span>
                       <span className="text-[10px] font-medium text-neutral-500 truncate italic">{replyTarget.content}</span>
                    </div>
                  )}
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-white/5 group-hover:scale-105 transition-transform bg-white/5 cursor-pointer relative shadow-2xl">
                   <img src={msg.user_avatar || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                </div>

                {/* Message Content Area */}
                <div className="min-w-0 flex-1 relative">
                   <div className="flex items-center gap-3 mb-1.5 pt-0.5">
                      <span className="text-[13px] font-black text-white/50 hover:text-sky-400 cursor-pointer transition-colors tracking-tighter" title={new Date(msg.created_at).toLocaleString()}>
                        {msg.user_name}
                      </span>
                      <span 
                        className="text-[8px] font-black text-neutral-800 uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5 cursor-help"
                        title={new Date(msg.created_at).toLocaleString()}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.user_id === '4aura-ai' && <div className="px-2 py-0.5 rounded-md bg-violet/20 border border-violet/30 text-violet text-[7px] font-black uppercase tracking-widest">System</div>}
                   </div>

                   <div className="relative inline-block max-w-full">
                      {editingMessageId === msg.id ? (
                        <div className="space-y-3 mt-2">
                          <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-neutral-800 border border-sky-500/50 rounded-xl p-4 text-sm text-white focus:outline-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingMessageId(null)} className="px-4 py-2 rounded-lg bg-white/5 text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-all">Cancel</button>
                            <button onClick={() => editMessage(msg.id)} className="px-4 py-2 rounded-lg bg-sky-500 text-[10px] font-black uppercase text-white hover:bg-sky-400 transition-all">Save Changes</button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="text-[14.5px] font-medium text-neutral-300 leading-relaxed selection:bg-sky-500/30 break-words whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        />
                      )}

                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button key={emoji} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] hover:bg-sky-500/20 transition-colors">
                              <span>{emoji}</span>
                              <span className="font-black text-sky-400">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>

                   {/* Rich Metadata (Link Cards) */}
                   {msg.metadata && <RichLinkCard metadata={msg.metadata} url={msg.content} />}
                </div>

                {/* Hover Actions Menu */}
                <div className="absolute right-10 top-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1 bg-[#0B0C0E] border border-white/10 p-1 rounded-xl shadow-2xl z-20">
                   {/* Emoji Popover Trigger */}
                   <div className="relative">
                      <button 
                        onClick={() => setShowingEmojiFor(showingEmojiFor === msg.id ? null : msg.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition-all" 
                        title="React"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {showingEmojiFor === msg.id && (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute bottom-full right-0 mb-2 p-2 bg-[#111214] border border-white/10 rounded-xl flex gap-1 shadow-2xl"
                          >
                            {['🔥', '❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                              <button key={emoji} onClick={() => { addReaction(msg.id, emoji); setShowingEmojiFor(null); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-sm">{emoji}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   
                   <button 
                     onClick={() => setReplyingTo(msg)}
                     className="p-2 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition-all" 
                     title="Reply"
                   >
                     <MessageSquare className="w-3.5 h-3.5" />
                   </button>
                   <button 
                     onClick={() => { setEditingMessageId(msg.id); setEditText(msg.content); }}
                     className="p-2 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition-all" 
                     title="Edit"
                   >
                     <Settings className="w-3.5 h-3.5" />
                   </button>
                   {msg.user_id === user.id && (
                     <button onClick={() => deleteMessage(msg.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                   )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

        {/* Chat Input */}
        <footer className="p-8 pb-10">
            {/* Reply Bar */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-between px-6 py-3 bg-white/5 border border-white/5 rounded-t-[20px] mb-[-10px] mx-auto max-w-5xl relative z-0 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="text-[11px] font-bold text-neutral-500 truncate italic">Replying to <span className="text-white not-italic">{replyingTo.user_name}</span></span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="relative group max-w-5xl mx-auto z-10">
               <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-fuchsia-500 rounded-[28px] blur opacity-0 group-focus-within:opacity-20 transition duration-1000 group-hover:opacity-10" />
               <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeChannel?.name}...`}
                  className="relative w-full px-8 py-5 pr-20 rounded-[24px] bg-neutral-900 border border-white/5 text-white placeholder:text-neutral-700 focus:outline-none focus:border-sky-500/50 text-[15px] font-bold transition-all shadow-2xl"
               />
               <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white text-black hover:bg-sky-500 hover:text-white transition-all shadow-xl active:scale-90 disabled:opacity-20 cursor-pointer">
                  <Send className="w-5 h-5" />
               </button>
               <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden group-focus-within:flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 select-none">
                 <span>**bold**</span>
                 <span>_italic_</span>
                 <span>`code`</span>
               </div>
            </form>
        </footer>
      </section>

      {/* 4. MEMBERS SIDEBAR (Discord Style) */}
      <AnimatePresence>
        {showMemberSidebar && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="shrink-0 bg-black/40 backdrop-blur-3xl border-l border-white/5 z-30 select-none overflow-hidden">
             <div className="p-10 pb-4 h-full flex flex-col">
                <div className="mb-10">
                   <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] mb-6 block">Community Members — {members.length}</span>
                </div>
                <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/u/${member.id}`)}>
                       <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-[18px] overflow-hidden border border-white/5 group-hover:scale-110 transition-transform bg-white/5">
                            <img src={member.avatar || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black bg-emerald shadow-lg" />
                       </div>
                       <div className="min-w-0">
                          <div className="text-[14px] font-black text-neutral-400 group-hover:text-sky-400 transition-colors truncate tracking-tighter">{member.name}</div>
                          <div className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest mt-1">Watching Anime</div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- SERVER SETTINGS MODAL --- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex bg-black/60 backdrop-blur-xl">
             <motion.aside initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className="w-72 bg-[#111214]/80 backdrop-blur-3xl border-r border-white/5 p-10 space-y-8 select-none">
                <div className="flex flex-col gap-1 mb-8">
                   <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em]">{activeServer?.name}</h3>
                   <span className="text-xl font-black text-white tracking-tighter">Hub Settings</span>
                </div>
                <div className="space-y-2">
                   <button className="w-full text-left px-5 py-3 rounded-xl bg-white/5 text-sky-400 font-bold text-sm tracking-tight flex items-center justify-between group">
                      Roles <Crown className="w-4 h-4" />
                   </button>
                   <button className="w-full text-left px-5 py-3 rounded-xl text-neutral-500 hover:text-white transition-all font-bold text-sm tracking-tight flex items-center justify-between hover:bg-white/5 cursor-not-allowed">
                      Integrations <Zap className="w-4 h-4" />
                   </button>
                   <button className="w-full text-left px-5 py-3 rounded-xl text-rose-500 hover:text-white transition-all font-bold text-sm tracking-tight flex items-center justify-between hover:bg-rose-500/20" onClick={() => deleteServer(activeServer.id)}>
                      Destroy Hub <Trash2 className="w-4 h-4" />
                   </button>
                </div>
                <button onClick={() => setShowSettings(false)} className="absolute bottom-10 left-10 p-4 rounded-3xl bg-white/5 hover:bg-white/10 text-neutral-500 border border-white/10 transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest leading-none">
                   <X className="w-4 h-4" /> Exit
                </button>
             </motion.aside>

             <main className="flex-1 p-16 overflow-y-auto">
                <div className="max-w-4xl">
                   <header className="flex items-center justify-between mb-12">
                      <div>
                         <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Roles & Permissions</h2>
                         <p className="text-sm font-medium text-neutral-500">Manage the hierarchy of your hub.</p>
                      </div>
                      <button onClick={createRole} className="px-8 py-4 rounded-2xl bg-sky-500 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-105 transition-all">Create New Role</button>
                   </header>

                   <div className="grid grid-cols-1 gap-4">
                      {roles.map((role) => (
                         <div key={role.id} className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-6">
                               <input type="color" value={role.color} onChange={async (e) => {
                                  const color = e.target.value;
                                  const { error } = await supabase.from('server_roles').update({ color }).eq('id', role.id);
                                  if (!error) setRoles(prev => prev.map(r => r.id === role.id ? { ...r, color } : r));
                               }} className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer" title="Change Color" />
                               <div>
                                  <h4 className="text-lg font-black text-white tracking-tight">{role.name}</h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                     {Object.entries(PERMISSIONS).map(([label, key]) => (
                                       <button 
                                          key={key} 
                                          onClick={() => togglePermission(role.id, key)}
                                          className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                                            role.permissions[key] 
                                            ? 'bg-sky-500 text-white border-sky-400' 
                                            : 'bg-black/40 text-neutral-600 border-white/5 hover:border-white/20'
                                          }`}
                                       >
                                          {label.replace('_', ' ')}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => deleteRole(role.id)} className="p-3 rounded-xl hover:bg-rose-500/20 text-rose-500 transition-all">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </main>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE SERVER MODAL --- */}
      <AnimatePresence>
        {isCreatingServer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl text-center relative overflow-hidden">
                <button onClick={closeServerModal} className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"><X className="w-4 h-4" /></button>
                <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 mx-auto mb-6"><Globe className="w-7 h-7" /></div>
                <h3 className="text-2xl font-black text-neutral-900 tracking-tight mb-8 uppercase">New Group</h3>
                <input autoFocus type="text" value={newServerName} onChange={(e) => handleServerNameChange(e.target.value)} placeholder="Anime syndicate..." className="w-full px-6 py-5 rounded-2xl bg-neutral-100 border border-transparent text-neutral-900 font-bold focus:bg-white focus:border-sky-500 transition-all text-center mb-8" />
                <AnimatePresence mode="wait">
                   {serverCheckStatus === 'exists' && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-[10px] font-black text-sky-900 uppercase">Hub "{existingServer.name}" detected.</div>
                        <button onClick={joinExistingServer} className="w-full py-5 rounded-2xl bg-sky-500 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-sky-500/30">Join Hub</button>
                     </motion.div>
                   )}
                   {serverCheckStatus === 'unique' && (
                     <button onClick={createServer} className="w-full py-5 rounded-2xl bg-neutral-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl">Create Hub</button>
                   )}
                </AnimatePresence>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONTEXT MENU --- */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-[100] w-52 bg-[#111214] rounded-2xl border border-white/10 shadow-2xl p-2">
             <div className="px-3 py-2 border-b border-white/5 mb-1"><p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest truncate">{contextMenu.server.name}</p></div>
             <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-sky-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-tight" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/inv/${contextMenu.server.invite_code}`); setContextMenu(null); }}>Copy Invite Link <LinkIcon className="w-3.5 h-3.5" /></button>
             <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-sky-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-tight" onClick={() => leaveServer(contextMenu.server.id)}>Leave Hub <LogOut className="w-3.5 h-3.5" /></button>
             {contextMenu.server.owner_id === user?.id && <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-tight" onClick={() => deleteServer(contextMenu.server.id)}>Destroy Hub <Trash2 className="w-3.5 h-3.5" /></button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
