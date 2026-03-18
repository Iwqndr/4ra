import { motion } from 'framer-motion'
import { Tv, Play, Building2, Star, Users, Info } from 'lucide-react'

export default function QuickViewModal({ anime }) {
  const synopsis = anime.synopsis || ''
  const snippet = synopsis.length > 150 ? synopsis.substring(0, 150) + '...' : synopsis
  
  const rating = anime.rating || ''
  const demographics = anime.demographics?.map(d => d.name).join(', ') || ''
  const themes = anime.themes?.slice(0, 2).map(t => t.name).join(', ') || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
      className="absolute z-50 left-1/2 -translate-x-1/2 bottom-[105%] mb-2 w-80 rounded-2xl glass p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-none"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1">
          {anime.studios?.length > 0 && (
            <span className="text-[10px] font-bold text-violet uppercase tracking-wider">
              {anime.studios[0].name}
            </span>
          )}
          <h4 className="text-sm font-bold text-white leading-snug">{anime.title}</h4>
        </div>
        {anime.score && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet/20 border border-violet/30 text-[10px] font-bold text-violet">
            <Star className="w-3 h-3 fill-current" />
            {anime.score}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 font-medium">
          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/5 p-1.5 rounded-lg border border-white/5">
            <Tv className="w-3 h-3 text-neutral-500" />
            {anime.type || 'TV'}
          </div>
          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/5 p-1.5 rounded-lg border border-white/5">
            <Play className="w-3 h-3 text-neutral-500" />
            {anime.episodes || '?'} EPS
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {rating && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-neutral-500 font-bold uppercase">
              {rating.split(' ')[0]}
            </span>
          )}
          {demographics && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald/10 border border-emerald/20 text-emerald font-bold uppercase">
              {demographics}
            </span>
          )}
        </div>

        {/* Themes */}
        {themes && (
          <div className="flex items-center gap-2 text-[10px]">
             <span className="text-neutral-500">Themes:</span>
             <span className="text-neutral-300 font-medium">{themes}</span>
          </div>
        )}

        {/* Snippet */}
        <div className="relative">
          <p className="text-[11px] text-neutral-300 leading-relaxed italic opacity-80">
            "{snippet}"
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
        <Info className="w-3 h-3" />
        Click for full details
      </div>
    </motion.div>
  )
}
