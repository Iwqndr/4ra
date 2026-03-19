import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Twitter, MessageCircle, Globe } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import uiStrings from '../config/ui_strings.json';
import { ShareToChatButton } from '../pages/ChatPage';

export default function ShareModal() {
  const { isShareModalOpen, closeShareModal, activeAnime } = useModal();
  const [copied, setCopied] = useState(false);

  if (!activeAnime) return null;

  // Generate a descriptive slug for Cloudflare Pages / SEO
  const slug = activeAnime.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  // Custom link format as requested
  const shareUrl = `${window.location.origin}/anime/${activeAnime.mal_id}/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialPlatforms = [
    { 
      name: 'X / Twitter', 
      icon: <Twitter className="w-5 h-5" />, 
      color: 'bg-black', 
      url: `https://twitter.com/intent/tweet?text=Check out ${activeAnime.title} on 4Aura!&url=${encodeURIComponent(shareUrl)}` 
    },
    { 
      name: 'Discord', 
      icon: <MessageCircle className="w-5 h-5" />, 
      color: 'bg-[#5865F2]', 
      url: `https://discord.com/channels/@me` // Discord doesn't have a direct "share to channel" web intent, but this opens app
    },
    { 
      name: 'WhatsApp', 
      icon: <Globe className="w-5 h-5" />, 
      color: 'bg-[#25D366]', 
      url: `https://wa.me/?text=${encodeURIComponent(`Check out ${activeAnime.title} on 4Aura! ${shareUrl}`)}` 
    }
  ];

  return (
    <AnimatePresence>
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeShareModal}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-surface/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30">
                  <Share2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{uiStrings.share.title}</h2>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{uiStrings.share.description}</p>
                </div>
              </div>
              <button 
                onClick={closeShareModal}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anime Identity */}
            <div className="flex items-center gap-6 p-6 rounded-[32px] bg-white/5 border border-white/5 mb-8">
              <img 
                src={activeAnime.images?.webp?.large_image_url || activeAnime.images?.jpg?.large_image_url} 
                className="w-16 h-24 rounded-2xl object-cover border border-white/10 shadow-xl" 
                alt="" 
              />
              <div className="flex-1">
                <h3 className="text-lg font-black text-white leading-tight mb-2 line-clamp-1">{activeAnime.title}</h3>
                <div className="flex items-center gap-3">
                   <span className="px-2 py-0.5 rounded-lg bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/20">
                     {activeAnime.type || 'TV'}
                   </span>
                   <span className="text-[10px] font-bold text-neutral-500">{activeAnime.year || '2024'}</span>
                </div>
              </div>
            </div>

            {/* Link Copy Area */}
            <div className="space-y-3 mb-8">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">{uiStrings.share.directLink}</label>
              <div className="flex items-center gap-2 p-2 rounded-[24px] bg-black/40 border border-white/10 group focus-within:border-accent/40 transition-all">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-neutral-300 px-4 font-medium"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-6 py-3 rounded-[18px] transition-all font-black text-[10px] uppercase tracking-widest ${
                    copied 
                    ? 'bg-emerald text-white shadow-lg shadow-emerald/40' 
                    : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? uiStrings.share.copied : uiStrings.share.copy}
                </button>
              </div>
              <ShareToChatButton anime={activeAnime} url={shareUrl} />
            </div>

            {/* Social Sharing */}
            <div className="grid grid-cols-3 gap-3">
              {socialPlatforms.map((platform, i) => (
                <a
                  key={i}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 p-5 rounded-[28px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${platform.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                    {platform.icon}
                  </div>
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{platform.name}</span>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
