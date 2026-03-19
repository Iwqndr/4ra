import { useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Heart, Star, Play, Tv, Building2, Calendar, BookOpen, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWatchlist } from '../context/WatchlistContext'
import MediaListModal from './MediaListModal'
import { useModal } from '../context/ModalContext'
import StatusBadge from './StatusBadge'
import { ListPlus } from 'lucide-react'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'

export default function AnimeCard({ anime, index = 0 }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist()
  const inList = isInWatchlist(anime.mal_id)
  const [showPeek, setShowPeek] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { openMediaModal, openShareModal } = useModal()
  const { getTranslatedTitle } = useSettings()
  const hoverTimerRef = useRef(null)
  const cardRef = useRef(null)

  const imgSrc = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || ''
  
  const [isLongPress, setIsLongPress] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const timerRef = useRef(null)
  
  // Extract info
  const studio = anime.studios?.[0]?.name || anime.studio || ''
  const year = anime.year || anime.aired?.prop?.from?.year || ''
  const genres = anime.genres?.slice(0, 2).map(g => g.name) || []
  const source = anime.source || ''

  const onMouseEnter = useCallback(() => {
    setIsHovered(true)
    hoverTimerRef.current = setTimeout(() => setShowPeek(true), 1200)
  }, [])

  const onMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setShowPeek(false)
  }, [])

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      setIsLongPress(true)
      setShowMobileMenu(true)
      if (window.navigator.vibrate) window.navigator.vibrate(50)
    }, 600)
  }

  const handleTouchEnd = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isLongPress) {
      e.preventDefault()
      e.stopPropagation()
      // Keep isLongPress true for a moment to prevent Link click
      setTimeout(() => setIsLongPress(false), 100)
    }
  }

  const handleShare = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    openShareModal(anime)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -12,
        transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] }
      }}
      transition={{ 
        delay: Math.min(index * 0.05, 0.4) 
      }}
      className="group relative z-10 perspective-1000"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Link
        to={isLongPress ? '#' : `/anime/${anime.mal_id}`}
        onClick={(e) => isLongPress && e.preventDefault()}
        className="block rounded-[28px] overflow-hidden bg-surface-hover border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-accent/40 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(139,92,246,0.1)] transform-gpu hover-lift"
      >
        {/* Image Container with premium UI layer */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={imgSrc}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />
          
          {/* Refined Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 z-10" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[28px] z-20" />
          
          {/* Badge Layer - Adjusted for perfect clearance */}
          <div className="absolute top-3 left-3 z-30">
            <StatusBadge status={anime.status} />
          </div>

          <div className="absolute top-3 right-3 z-30">
            {anime.score && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass text-[10px] font-black border border-white/10 shadow-lg">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-white">{anime.score}</span>
              </div>
            )}
          </div>

          {/* Minimalist Hover-Only Actions - Integrated with AniList */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-40">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMediaModal(anime) }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-3xl border transition-all duration-300 ${
                inList 
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40' 
                : 'bg-black/80 text-white border-white/10 hover:bg-accent hover:border-accent/40'
              }`}
            >
              <Heart className={`w-4 h-4 ${inList ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openMediaModal(anime) }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/80 backdrop-blur-3xl border border-white/10 text-white hover:bg-accent hover:border-accent/40 transition-all duration-300"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Spacious Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
            <h3 className="text-sm font-black text-white leading-[1.3] mb-1.5 line-clamp-2 group-hover:text-accent transition-colors duration-300 tracking-tight">
              {getTranslatedTitle(anime)}
            </h3>
            
            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-neutral-400/80">
               {year && <span>{year}</span>}
               {studio && (
                 <>
                   <span className="w-0.5 h-0.5 rounded-full bg-neutral-700" />
                   <span className="text-accent/90 truncate">{studio}</span>
                 </>
               )}
               {anime.type && (
                 <>
                   <span className="w-0.5 h-0.5 rounded-full bg-neutral-700" />
                   <span>{anime.type}</span>
                 </>
               )}
            </div>
          </div>
        </div>
      </Link>

      {/* Mobile Actions Menu - Rendered via Portal to ensure top-layer Z-Index */}
      {showMobileMenu && createPortal(
        <AnimatePresence mode="wait">
          <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:hidden px-4 pb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-surface/90 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-4 mb-2 pb-4 border-b border-white/5">
                <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <img src={imgSrc} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                   <h4 className="text-sm font-black text-white line-clamp-1">{getTranslatedTitle(anime)}</h4>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{year} • {studio}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => { setShowMobileMenu(false); openMediaModal(anime); }}
                  className="w-full py-4 rounded-2xl bg-accent/20 border border-accent/30 text-accent font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <ListPlus className="w-4 h-4" />
                  {uiStrings.detail.addToCollection}
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); handleShare(); }}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Share2 className="w-4 h-4" />
                  {uiStrings.detail.shareAnime}
                </button>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full py-4 rounded-2xl text-neutral-400 font-extrabold text-xs uppercase tracking-widest active:scale-95 transition-transform"
                >
                  {uiStrings.common.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  )
}

