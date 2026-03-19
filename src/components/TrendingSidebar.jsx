import { Link } from 'react-router-dom'
import { TrendingUp, Star, Play } from 'lucide-react'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'

export default function TrendingSidebar({ animeList }) {
  const { getTranslatedTitle } = useSettings()
  if (!animeList || animeList.length === 0) return null

  return (
    <div className="w-full lg:w-96 shrink-0">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-xl font-black text-white uppercase tracking-tighter italic">
          <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          {uiStrings.home.nowTrending}
        </div>
        <TrendingUp className="w-5 h-5 text-accent/50" />
      </div>

      <div className="flex flex-col gap-3">
        {animeList.map((anime, i) => (
          <Link 
            key={anime.mal_id}
            to={`/anime/${anime.mal_id}`}
            className="group flex gap-5 p-4 rounded-[24px] glass-dark border border-white/5 hover:border-accent/30 transition-all duration-500 shadow-xl hover:-translate-y-1 transform-gpu"
          >
            {/* Rank Number */}
            <div className="relative flex items-center justify-center w-10 shrink-0">
              <span className={`text-3xl font-black italic tracking-tighter transition-all duration-500 ${
                i < 3 ? 'text-gradient opacity-100' : 'text-white/10 group-hover:text-white/30'
              }`}>
                {(i + 1).toString().padStart(2, '0')}
              </span>
              {i < 3 && <div className="absolute -bottom-1 w-6 h-1 bg-accent/40 rounded-full blur-sm" />}
            </div>

            {/* Poster Thumbnail */}
            <div className="w-20 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-2xl">
              <img 
                src={anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                alt={anime.title}
              />
            </div>

            {/* Info Container */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="text-[15px] font-black text-white leading-tight mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                {getTranslatedTitle(anime)}
              </h4>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500">
                <span className="flex items-center gap-1.5 text-amber-500/80">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {anime.score || '8.5'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-accent" />
                  {anime.episodes || '12'} EPS
                </span>
              </div>
              <div className="mt-2 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                {anime.type || 'TV'} • {anime.status?.replace('ing', '') || 'Finished'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Modern Action Button */}
      <Link 
        to="/"
        className="group mt-8 w-full py-5 rounded-[24px] glass-dark border border-white/5 text-center text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white hover:border-accent/30 hover:bg-accent/5 transition-all duration-500 flex items-center justify-center gap-3"
      >
        {uiStrings.home.viewAllTrends}
        <div className="w-6 h-px bg-white/5 group-hover:w-12 group-hover:bg-accent/30 transition-all duration-500" />
      </Link>
    </div>
  )
}
