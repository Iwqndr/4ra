import { useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, Play, Tv, Building2, Calendar, BookOpen, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWatchlist } from '../context/WatchlistContext'
import StatusBadge from './StatusBadge'
import QuickViewModal from './QuickViewModal'

export default function AnimeCard({ anime, index = 0 }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist()
  const inList = isInWatchlist(anime.mal_id)
  const [showPeek, setShowPeek] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimerRef = useRef(null)
  const cardRef = useRef(null)

  const imgSrc = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || ''
  
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

  const handleShare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/anime/${anime.mal_id}`
    if (navigator.share) {
      navigator.share({ title: anime.title, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        delay: Math.min(index * 0.03, 0.3) 
      }}
      className="group relative z-10 gpu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        to={`/anime/${anime.mal_id}`}
        className="block rounded-xl overflow-hidden bg-surface border border-border group-hover:border-violet/50 group-hover:shadow-[0_15px_35px_rgba(0,0,0,0.4),0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 transform-gpu"
      >
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={imgSrc}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform pointer-events-none" />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
            <StatusBadge status={anime.status} />
            {source && (
              <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-neutral-300 border border-white/10 uppercase tracking-tighter">
                {source}
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2">
            {anime.score && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                {anime.score}
              </div>
            )}
          </div>

          {/* Quick Actions (Floating on hover) */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 z-20">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(anime) }}
              className={`p-2 rounded-full backdrop-blur-xl border border-white/10 transition-all duration-300 ${
                inList ? 'bg-rose-500 text-white' : 'bg-black/60 text-white hover:bg-violet'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${inList ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-white hover:bg-emerald transition-all duration-300"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-violet transition-colors">
              {anime.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-neutral-300 font-medium whitespace-nowrap overflow-hidden">
               {year && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{year}</span>}
               {studio && <span className="flex items-center gap-0.5 text-violet font-semibold"><Building2 className="w-2.5 h-2.5" />{studio}</span>}
            </div>

            {/* Genres on Card */}
            <div className="flex gap-1.5 mt-2 overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              {genres.map((g, i) => (
                <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/5 text-neutral-400">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Hover Peek - Positioned relative to card */}
      <AnimatePresence>
        {showPeek && (
          <QuickViewModal anime={anime} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

