import { motion } from 'framer-motion'
import { Info, Plus, Star, Calendar, ShieldCheck, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext'

export default function Hero({ anime }) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist()
  if (!anime) return null

  const inList = isInWatchlist(anime.mal_id)
  const banner = anime.trailer?.images?.maximum_image_url || anime.images?.webp?.large_image_url
  const year = anime.year || anime.aired?.prop?.from?.year || '2024'
  const rating = anime.rating?.split(' ')[0] || 'PG-13'
  const genres = anime.genres?.slice(0, 3).map(g => g.name).join(', ')

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] lg:h-[750px] overflow-hidden group">
      {/* Background Image with Cinematic Gradient */}
      <div className="absolute inset-0">
        <img 
          src={banner} 
          alt={anime.title} 
          className="w-full h-full object-cover object-top scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />
      </div>

      {/* Content Area */}
      <div className="relative h-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          {/* Spotlight Rank */}
          <div className="flex items-center gap-2 mb-6 text-[#ff5e3a] font-black text-sm uppercase tracking-[0.2em]">
            <Star className="w-4 h-4 fill-current" />
            Spotlight #1
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1] drop-shadow-2xl">
            {anime.title}
          </h1>

          {/* Icon Metadata Row */}
          <div className="flex flex-wrap items-center gap-5 mb-8 text-xs font-black uppercase tracking-widest text-neutral-300">
            <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#ff5e3a] text-white shadow-lg shadow-orange-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {rating}
            </span>
            <span className="flex items-center gap-2 text-emerald">
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              TV Series
            </span>
            <span className="text-neutral-500 font-bold">{genres}</span>
          </div>

          {/* Synopsis with better typography */}
          <p className="text-neutral-300 text-sm sm:text-lg leading-relaxed mb-10 line-clamp-3 max-w-2xl opacity-90 font-medium italic">
            {anime.synopsis}
          </p>

          {/* Featured Metadata Cards from Reference */}
          <div className="flex flex-wrap gap-4 mb-10">
            <div className="flex flex-col gap-1.5 px-6 py-3 rounded-2xl bg-surface/40 backdrop-blur-xl border border-white/5 min-w-[110px] transform-gpu transition-all hover:bg-surface/60 hover:scale-105">
              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Rating</span>
              <span className="text-lg font-black text-white">{rating}</span>
            </div>
            <div className="flex flex-col gap-1.5 px-6 py-3 rounded-2xl bg-surface/40 backdrop-blur-xl border border-white/5 min-w-[110px] transform-gpu transition-all hover:bg-surface/60 hover:scale-105">
              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Release</span>
              <span className="text-lg font-black text-white">{year}</span>
            </div>
            <div className="flex flex-col gap-1.5 px-6 py-3 rounded-2xl bg-surface/40 backdrop-blur-xl border border-white/5 min-w-[110px] transform-gpu transition-all hover:bg-surface/60 hover:scale-105">
              <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Quality</span>
              <span className="text-lg font-black text-white">4K UHD</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-5">
            <Link 
              to={`/anime/${anime.mal_id}`}
              className="group flex items-center gap-4 px-10 py-5 rounded-3xl bg-[#ff5e3a] hover:bg-[#ff7e60] text-white font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_15px_30px_rgba(255,94,58,0.3)] transform-gpu"
            >
              <Info className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              View Full Details
            </Link>
            <button 
              onClick={() => toggleWatchlist(anime)}
              className={`flex items-center justify-center gap-4 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 border transform-gpu ${
                inList 
                ? 'bg-rose-600 shadow-lg shadow-rose-600/20 text-white border-transparent' 
                : 'bg-white/10 text-white border-white/10 backdrop-blur-md hover:bg-white/20'
              }`}
            >
              <Plus className={`w-5 h-5 ${inList ? 'rotate-45' : ''} transition-transform`} />
              {inList ? 'Saved in List' : 'Add to Watchlist'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
