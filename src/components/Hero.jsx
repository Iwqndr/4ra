import { motion } from 'framer-motion'
import { Info, Plus, Star, Calendar, ShieldCheck, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext'
import { useModal } from '../context/ModalContext'
import MediaListModal from './MediaListModal'
import { useState } from 'react'
import { ListPlus } from 'lucide-react'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'

export default function Hero({ anime }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist()
  const { openMediaModal } = useModal()
  const { getTranslatedTitle } = useSettings()
  if (!anime) return null

  const inList = isInWatchlist(anime.mal_id)
  const banner = anime.trailer?.images?.maximum_image_url || anime.images?.webp?.large_image_url
  const year = anime.year || anime.aired?.prop?.from?.year || '2024'
  const rating = anime.rating?.split(' ')[0] || 'PG-13'
  const genres = anime.genres?.slice(0, 3).map(g => g.name).join(', ')

  return (
    <div className="relative w-full h-[600px] sm:h-[700px] lg:h-[850px] overflow-hidden group">
      {/* Cinematic Background */}
      <div className="absolute inset-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          src={banner} 
          alt={anime.title} 
          className="w-full h-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Area */}
      <div className="relative h-full max-w-[1800px] mx-auto px-6 sm:px-12 lg:px-20 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-4xl"
        >
          {/* Active Badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/10">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              {uiStrings.home.featuredTitle} #1
            </div>
            <div className="h-0.5 w-12 bg-white/10 rounded-full" />
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">{uiStrings.home.heroCollection}</span>
          </div>
               <div className="flex flex-col gap-4">
                 <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] max-w-3xl line-clamp-2">
                   {getTranslatedTitle(anime)}
                 </h1>
               </div>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-center gap-6 mb-10">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass-dark border border-white/5 shadow-xl">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-black text-white">{anime.score}</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-neutral-400">
               <span className="flex items-center gap-2 text-emerald">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                 {anime.type || 'TV Series'}
               </span>
               <span className="w-1 h-1 rounded-full bg-neutral-700" />
               <span>{year}</span>
               <span className="w-1 h-1 rounded-full bg-neutral-700" />
               <span className="text-accent">{genres}</span>
            </div>
          </div>

          <div className="text-neutral-300 text-lg sm:text-xl leading-relaxed mb-12 line-clamp-3 max-w-2xl font-medium italic opacity-80 border-l-2 border-white/5 pl-8">
            {anime.synopsis}
          </div>

          {/* Premium Actions */}
          <div className="flex flex-wrap gap-6 items-center">
            <Link 
              to={`/anime/${anime.mal_id}`}
              className="group flex items-center gap-4 px-12 py-6 rounded-[32px] bg-white text-black font-black text-[13px] uppercase tracking-widest transition-all duration-500 hover:scale-105 hover:bg-accent hover:text-white shadow-2xl shadow-white/5 active:scale-95"
            >
              <Info className="w-5 h-5 transition-transform group-hover:scale-125" />
              {uiStrings.home.heroStartWatching}
            </Link>
            
            <button 
              onClick={() => toggleWatchlist(anime)}
              className={`flex items-center justify-center gap-4 px-10 py-6 rounded-[32px] glass-dark border font-black text-[13px] uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95 ${
                inList 
                ? 'bg-rose-500 shadow-xl shadow-rose-500/30 text-white border-rose-400' 
                : 'text-white border-white/10 hover:bg-white/5'
              }`}
            >
              <Plus className={`w-5 h-5 ${inList ? 'rotate-45' : ''} transition-transform duration-500`} />
              {inList ? uiStrings.home.heroSaved : uiStrings.home.heroAddToList}
            </button>

            <button 
              onClick={() => openMediaModal(anime)}
              className="p-6 rounded-[32px] glass-dark border border-white/10 text-neutral-400 hover:text-white hover:border-accent/40 hover:bg-accent/5 transition-all duration-500 group"
              title="Track on AniList"
            >
              <ListPlus className="w-5 h-5 group-hover:scale-125 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
