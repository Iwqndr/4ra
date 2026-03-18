import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpDown, TrendingUp, Star, Clock, Sparkles } from 'lucide-react'
import { fetchTopAnime, searchAnime, fetchAnimeByGenre } from '../api/jikan'
import AnimeCard from '../components/AnimeCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import Hero from '../components/Hero'
import TrendingSidebar from '../components/TrendingSidebar'

const SORT_OPTIONS = [
  { value: 'bypopularity', label: 'Popularity', icon: TrendingUp },
  { value: 'score', label: 'Top Rated', icon: Star },
  { value: 'upcoming', label: 'Latest Release', icon: Clock },
]

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const genreId = searchParams.get('genre') || ''
  const genreName = searchParams.get('genreName') || ''

  const [anime, setAnime] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState('bypopularity')
  const [sortOpen, setSortOpen] = useState(false)
  const observerRef = useRef(null)
  const loadingRef = useRef(false)

  // Reset when search/genre/sort changes
  useEffect(() => {
    setAnime([])
    setPage(1)
    setHasMore(true)
    setLoading(true)
    loadingRef.current = false
    window.scrollTo(0, 0)
  }, [searchQuery, genreId, sort])

  // Fetch data
  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true

    const loadData = async () => {
      try {
        let result
        if (searchQuery) {
          result = await searchAnime(searchQuery, page)
        } else if (genreId) {
          result = await fetchAnimeByGenre(genreId, page)
        } else {
          result = await fetchTopAnime(page, sort === 'score' ? 'bypopularity' : sort)
        }

        let newAnime = result.anime || []
        if (sort === 'score' && !searchQuery && !genreId) {
          newAnime = [...newAnime].sort((a, b) => (b.score || 0) - (a.score || 0))
        }

        setAnime(prev => page === 1 ? newAnime : [...prev, ...newAnime])
        setHasMore(result.pagination?.has_next_page || false)
      } catch (err) {
        console.error('Failed to fetch anime:', err)
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }

    loadData()
  }, [page, searchQuery, genreId, sort])

  const lastCardRef = useCallback((node) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        setPage(prev => prev + 1)
        setLoading(true)
      }
    }, { threshold: 0.1 })
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore])

  const currentSort = SORT_OPTIONS.find(o => o.value === sort)
  
  // Spotlight and Trending logic
  const featuredAnime = useMemo(() => anime[0] || null, [anime])
  const trendingAnime = useMemo(() => anime.slice(0, 10), [anime])
  const gridAnime = useMemo(() => (searchQuery || genreId) ? anime : anime.slice(1), [anime, searchQuery, genreId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-16"
    >
      {/* Hero Spotlight - Only on default home */}
      {!searchQuery && !genreId && page === 1 && (
        <Hero anime={featuredAnime} />
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Header / Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                  {searchQuery ? <><Sparkles className="w-6 h-6 text-violet" /> Results for "{searchQuery}"</> :
                   genreId ? <><TrendingUp className="w-6 h-6 text-emerald" /> {genreName || 'Genre'}</> :
                   <><TrendingUp className="w-6 h-6 text-violet" /> Recently Updated</>}
                </h1>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1 opacity-60">
                  {searchQuery ? 'Search results from Jikan v4' : 'Explore the latest from our database'}
                </p>
              </div>

              {!searchQuery && !genreId && (
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border border-border text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:border-violet/40 transition-all duration-300"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Sort: {currentSort?.label}
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl glass border border-border overflow-hidden shadow-2xl z-40 transform-gpu animate-in fade-in slide-in-from-top-2">
                      {SORT_OPTIONS.map(opt => {
                        const Icon = opt.icon
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setSort(opt.value); setSortOpen(false) }}
                            className={`w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-left hover:bg-white/5 transition-colors ${
                              sort === opt.value ? 'text-violet bg-violet/5' : 'text-neutral-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Grid */}
            {loading && page === 1 ? (
              <SkeletonGrid count={24} />
            ) : gridAnime.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
                <p className="text-xl font-black italic uppercase italic">No matches found</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-50">Try a different search query</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                  {gridAnime.map((a, i) => (
                    <div key={`${a.mal_id}-${i}`} ref={i === gridAnime.length - 1 ? lastCardRef : null}>
                      <AnimeCard anime={a} index={i % 24} />
                    </div>
                  ))}
                </div>

                {loading && page > 1 && (
                  <div className="mt-8">
                    <SkeletonGrid count={6} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar Area - Hide on search/genre for cleaner look? No, keep it for trends */}
          <TrendingSidebar animeList={trendingAnime} />

        </div>
      </div>
    </motion.div>
  )
}
