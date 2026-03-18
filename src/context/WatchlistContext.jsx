import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const WatchlistContext = createContext()

const STORAGE_KEY = '4aura_watchlist'

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  const addToWatchlist = useCallback((anime) => {
    setWatchlist(prev => {
      if (prev.some(a => a.mal_id === anime.mal_id)) return prev
      return [...prev, {
        mal_id: anime.mal_id,
        title: anime.title,
        images: anime.images,
        score: anime.score,
        episodes: anime.episodes,
        status: anime.status,
        type: anime.type,
      }]
    })
  }, [])

  const removeFromWatchlist = useCallback((malId) => {
    setWatchlist(prev => prev.filter(a => a.mal_id !== malId))
  }, [])

  const isInWatchlist = useCallback((malId) => {
    return watchlist.some(a => a.mal_id === malId)
  }, [watchlist])

  const toggleWatchlist = useCallback((anime) => {
    if (isInWatchlist(anime.mal_id)) {
      removeFromWatchlist(anime.mal_id)
    } else {
      addToWatchlist(anime)
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist])

  // Future-proof: AniList token storage
  const [anilistToken, setAnilistToken] = useState(null)

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      toggleWatchlist,
      anilistToken,
      setAnilistToken,
    }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider')
  return ctx
}
