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
      <div className="flex flex-col gap-2 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-gradient-to-b from-rose-500 to-rose-700 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase">
            My <span className="text-rose-500">Collection</span>
          </h1>
        </div>
        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] ml-6 opacity-50">
          Saved for your next cinematic journey • {watchlist.length} titles
        </p>
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
