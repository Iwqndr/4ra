import { motion } from 'framer-motion'
import { Heart, Trash2 } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext'
import AnimeCard from '../components/AnimeCard'

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist } = useWatchlist()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white" id="watchlist-title">
          My List
        </h1>
        <span className="text-sm text-neutral-400 ml-2">({watchlist.length} titles)</span>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
          <Heart className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Your watchlist is empty</p>
          <p className="text-sm mt-1">Click the ❤️ icon on any anime card to save it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
          {watchlist.map((anime, i) => (
            <AnimeCard key={anime.mal_id} anime={anime} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
