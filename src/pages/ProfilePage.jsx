import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { 
  User, Mail, Calendar, ExternalLink, 
  Tv, Heart, Star, List, Loader2,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [anilistData, setAnilistData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 1. Fetch Supabase Profile
      const { data: supabaseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(supabaseProfile);

      // 2. Fetch AniList Data
      try {
        const query = `
          query ($id: Int) {
            User(id: $id) {
              id
              name
              about
              avatar { large }
              bannerImage
              statistics {
                anime {
                  count
                  minutesWatched
                  meanScore
                }
              }
              favourites {
                anime {
                  nodes {
                    id
                    title { english romaji }
                    coverImage { large }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { id: parseInt(userId) } })
        });
        const { data } = await response.json();
        setAnilistData(data.User);
      } catch (err) {
        console.error("AniList fetch error:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060607]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!anilistData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#060607] p-8 text-center">
        <h1 className="text-2xl font-black text-white mb-4">Soul Not Detected</h1>
        <button onClick={() => navigate('/')} className="text-accent uppercase text-[10px] font-black tracking-widest flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
           <ArrowLeft className="w-4 h-4" /> Return to Hub
        </button>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#060607] pb-20">
      {/* Banner */}
      <div className="h-64 sm:h-80 w-full relative overflow-hidden">
        {anilistData.bannerImage ? (
          <img src={anilistData.bannerImage} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl text-white hover:bg-black/60 transition-all z-20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-12 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-12 space-y-8">
              {/* Avatar & Basic Info */}
              <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl text-center">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-accent mx-auto mb-6 shadow-2xl">
                  <img src={anilistData.avatar.large} className="w-full h-full object-cover" alt="" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-2">{anilistData.name}</h1>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">AniList Resident</p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                   <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="text-xl font-black text-white">{anilistData.statistics.anime.count}</div>
                      <div className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Anime</div>
                   </div>
                   <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="text-xl font-black text-white">{Math.round(anilistData.statistics.anime.minutesWatched / 1440)}</div>
                      <div className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Days</div>
                   </div>
                </div>

                <a 
                  href={`https://anilist.co/user/${anilistData.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl"
                >
                  View on AniList <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Stats & Details */}
              <div className="p-6 space-y-6">
                 <div className="flex items-center gap-4 text-neutral-400">
                    <Tv className="w-5 h-5 text-accent" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest">Mean Score</span>
                       <span className="text-sm font-bold text-white">{anilistData.statistics.anime.meanScore}%</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-neutral-400">
                    <Calendar className="w-5 h-5 text-accent" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest">Profile Updated</span>
                       <span className="text-sm font-bold text-white">Recently</span>
                    </div>
                 </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-12">
            {/* About / Bio */}
            <motion.section variants={container} initial="hidden" animate="show" className="space-y-6">
              <div className="flex items-center gap-4">
                 <h2 className="text-xs font-black text-neutral-500 uppercase tracking-[0.4em]">About & Community Bio</h2>
                 <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 backdrop-blur-3xl leading-relaxed text-neutral-300 font-medium">
                {profile?.bio || anilistData.about || "This user hasn't set a community bio yet. They are likely too busy watching anime!"}
              </div>
            </motion.section>

            {/* Favourites */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-accent fill-accent" />
                    <h2 className="text-xs font-black text-neutral-500 uppercase tracking-[0.4em]">Favourites</h2>
                 </div>
                 <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {anilistData.favourites.anime.nodes.map(anime => (
                   <motion.div 
                     key={anime.id}
                     whileHover={{ y: -8 }}
                     className="group cursor-pointer"
                     onClick={() => navigate(`/anime/${anime.id}`)}
                   >
                      <div className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 mb-4 relative shadow-2xl">
                         <img src={anime.coverImage.large} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">View Details</span>
                         </div>
                      </div>
                      <h3 className="text-[11px] font-black text-white uppercase tracking-wider text-center line-clamp-1 group-hover:text-accent transition-colors">{anime.title.english || anime.title.romaji}</h3>
                   </motion.div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
