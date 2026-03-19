import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, Globe, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { alert as customAlert } from '../components/CustomModal';

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServer = async () => {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('invite_code', code)
        .single();
      
      if (error || !data) {
        setError("Invalid or expired invite link.");
      } else {
        setServer(data);
      }
      setLoading(false);
    };

    fetchServer();
  }, [code]);

  const handleJoin = async () => {
    const userStr = localStorage.getItem('user_profile_data');
    if (!userStr) {
      customAlert("Access Denied", "Please connect your AniList account first!", "danger");
      navigate('/settings');
      return;
    }

    setJoining(true);
    const user = JSON.parse(userStr);
    
    // Join logic
    const { error } = await supabase
      .from('server_members')
      .upsert({ server_id: server.id, user_id: user.id })
      .select();

    if (error) {
      customAlert("Sync Failed", "Failed to join hub. Please try again.", "danger");
      setJoining(false);
    } else {
      navigate(`/server/${server.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060607]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060607] p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-8 font-black text-2xl">!</div>
        <h1 className="text-3xl font-black text-white tracking-tighter mb-4">Invalid Invite</h1>
        <p className="text-neutral-500 max-w-sm mb-8 font-bold uppercase tracking-widest text-[10px] leading-loose">{error}</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#060607] relative overflow-hidden">
      {/* Background Banner */}
      {server.banner && (
        <div className="absolute inset-0 z-0">
          <img src={server.banner} className="w-full h-full object-cover opacity-20 blur-md" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-transparent to-transparent" />
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl text-center"
      >
        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-accent shadow-2xl bg-surface">
            {server.icon ? (
              <img src={server.icon} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">{server.name[0]}</div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-lg bg-emerald text-[8px] font-black text-white uppercase tracking-widest shadow-lg">Verified</div>
        </div>

        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-2 px-4 py-2 rounded-full border border-white/5 inline-block mx-auto">You've been invited to join</p>
        <h1 className="text-3xl font-black text-white tracking-tight mb-4">{server.name}</h1>
        
        <div className="flex items-center justify-center gap-6 mb-10 pb-10 border-b border-white/5">
           <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 text-emerald">
                 <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Active Community</span>
              </div>
           </div>
        </div>

        <button 
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-accent hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
        >
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>Accept Invite <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
        
        <p className="mt-6 text-[9px] font-bold text-neutral-600 uppercase tracking-widest leading-loose">
          By joining, you agree to follow the 4Aura community guidelines.
        </p>
      </motion.div>
    </div>
  );
}
