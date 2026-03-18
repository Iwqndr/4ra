import { Link } from 'react-router-dom'
import { TrendingUp, Star, Play } from 'lucide-react'

export default function TrendingSidebar({ animeList }) {
  if (!animeList || animeList.length === 0) return null

  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="flex items-center gap-2 mb-6 text-xl font-black text-white uppercase tracking-tighter italic">
        <TrendingUp className="w-6 h-6 text-violet animate-pulse" />
        Top Trending
      </div>

      <div className="flex flex-col gap-4">
        {animeList.map((anime, i) => (
          <Link 
            key={anime.mal_id}
            to={`/anime/${anime.mal_id}`}
            className="group flex gap-4 p-3 rounded-2xl bg-surface/40 hover:bg-surface border border-transparent hover:border-violet/20 transition-all duration-300"
          >
            {/* Rank Number */}
            <div className="flex items-center justify-center w-8 text-2xl font-black italic text-neutral-600 group-hover:text-violet transition-colors">
              {(i + 1).toString().padStart(2, '0')}
            </div>

            {/* Poster Thumbnail */}
            <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 border border-white/5">
              <img 
                src={anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={anime.title}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-violet transition-colors">
                {anime.title}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  {anime.score || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-emerald" />
                  {anime.episodes || '?'} EPS
                </span>
                <span className="text-neutral-500">{anime.type || 'TV'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View More Button */}
      <Link 
        to="/"
        className="block mt-6 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-sm font-bold text-neutral-400 hover:text-white hover:bg-white/10 transition-all duration-300"
      >
        View All Trends
      </Link>
    </div>
  )
}
