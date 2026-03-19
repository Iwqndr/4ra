import React, { useState } from 'react';
import { MessageSquarePlus, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ShareToChatButton({ anime, url }) {
  const [status, setStatus] = useState('idle'); // idle, sharing, success
  const navigate = useNavigate();

  const handleShare = async () => {
    const token = localStorage.getItem('anilist_token');
    if (!token) {
      alert("Please connect your AniList account to share to chat!");
      navigate('/settings');
      return;
    }

    setStatus('sharing');

    // In a real app, you'd send a message to a "general" room or a chosen room.
    // For this implementation, we'll post to a default "global" room.
    const roomName = "global";
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = isDev ? 'localhost:8787' : window.location.host;
    const wsUrl = `${protocol}//${host}/chat/ws/${roomName}`;
    
    try {
      // Create a temporary WS connection to post the message
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
        
        setTimeout(() => {
          ws.close();
          setStatus('success');
          setTimeout(() => setStatus('idle'), 3000);
        }, 500);
      };

      ws.onerror = (err) => {
        console.error("WS Share error:", err);
        setStatus('idle');
        alert("Failed to share to chat. Is the worker running?");
      };
    } catch (err) {
      console.error("Share error:", err);
      setStatus('idle');
    }
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
      {status === 'sharing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'success' ? (
        <Check className="w-4 h-4" />
      ) : (
        <MessageSquarePlus className="w-4 h-4" />
      )}
      {status === 'sharing' ? 'Sharing...' : status === 'success' ? 'Shared to Chat!' : 'Share to Chat'}
    </button>
  );
}
