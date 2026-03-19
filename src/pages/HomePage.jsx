import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, TrendingUp, Star, Clock, Sparkles } from 'lucide-react'
import { fetchTopAnime, searchAnime, fetchAnimeByGenre } from '../api/jikan'
import AnimeCard from '../components/AnimeCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import Hero from '../components/Hero'
import TrendingSidebar from '../components/TrendingSidebar'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'

const SORT_OPTIONS = [
  { value: 'bypopularity', label: 'Popularity', icon: TrendingUp },
  { value: 'score', label: 'Top Rated', icon: Star },
  { value: 'upcoming', label: 'Latest Release', icon: Clock },
]

export default function HomePage() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const genreId = searchParams.get('genre') || ''
  const genreName = searchParams.get('genreName') || ''

  const [anime, setAnime] = useState([])
  const [trendingAnime, setTrendingAnime] = useState([])
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
        let fetchedAnime = []
        let hasNextPage = false

        if (searchQuery) {
          const { anime, pagination } = await searchAnime(searchQuery, page, settings.nsfwFilter)
          fetchedAnime = anime
          hasNextPage = pagination?.has_next_page || false
        } else if (genreId) {
          const { anime, pagination } = await fetchAnimeByGenre(genreId, page, settings.nsfwFilter)
          fetchedAnime = anime
          hasNextPage = pagination?.has_next_page || false
        } else {
          // If sort is 'score', we pass null to fetchTopAnime to get Jikan's default score-based top list
          const { anime, pagination } = await fetchTopAnime(page, sort === 'score' ? null : sort, 'tv', settings.nsfwFilter)
          fetchedAnime = anime
          hasNextPage = pagination?.has_next_page || false
        }

        let newAnime = fetchedAnime || []
        if (sort === 'score' && !searchQuery && !genreId) {
          newAnime = [...newAnime].sort((a, b) => (b.score || 0) - (a.score || 0))
        }

        setAnime(prev => page === 1 ? newAnime : [...prev, ...newAnime])
        setHasMore(hasNextPage)
      } catch (err) {
        console.error('Failed to fetch anime:', err)
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    }

    loadData()
  }, [page, searchQuery, genreId, sort])

  // Fetch specialized trending data for the sidebar once
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const result = await fetchTopAnime(1, 'bypopularity')
        setTrendingAnime(result.anime?.slice(0, 10) || [])
      } catch (err) {
        console.error('Failed to fetch trending sidebar data:', err)
      }
    }
    fetchTrending()
  }, [])

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
  const gridAnime = useMemo(() => anime.slice(1), [anime])

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-accent to-accent rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">
                    {searchQuery ? <><span className="text-accent">{uiStrings.home.resultsFor}</span> "{searchQuery}"</> :
                     genreId ? <><span className="text-emerald">{genreName || 'Genre'}</span> {uiStrings.home.genreSpotlight}</> :
                     <>{uiStrings.home.trendingTitle.split(' ')[0]} <span className="text-gradient">{uiStrings.home.trendingTitle.split(' ')[1]}</span></>}
                  </h1>
                </div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.4em] ml-4 opacity-50">
                  {searchQuery ? 'Global database search' : 'Handpicked for your entertainment'}
                </p>
              </div>

              {!searchQuery && !genreId && (
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-4 px-6 py-4 rounded-2xl glass-dark border border-white/5 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:border-accent/30 transition-all duration-500 shadow-xl group"
                  >
                    <ArrowUpDown className={`w-4 h-4 transition-transform duration-500 ${sortOpen ? 'rotate-180 text-accent' : ''}`} />
                    <span>Sort By: <span className="text-white ml-2">{currentSort?.label}</span></span>
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-64 rounded-3xl glass-dark border border-white/10 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50 p-2"
                      >
                        {SORT_OPTIONS.map(opt => {
                          const Icon = opt.icon
                          const isActive = sort === opt.value
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setSort(opt.value); setSortOpen(false) }}
                              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-left transition-all duration-300 ${
                                isActive 
                                ? 'bg-accent/10 text-accent border border-accent/20 shadow-inner shadow-accent/5' 
                                : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                {opt.label}
                              </div>
                              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                <motion.div 
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                  }}
                  className={`grid ${
                    settings.gridDensity === 'compact' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4' :
                    settings.gridDensity === 'spacious' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10' :
                    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6'
                  }`}
                >
                  {gridAnime.map((a, i) => (
                    <motion.div 
                      key={`${a.mal_id}-${i}`} 
                      ref={i === gridAnime.length - 1 ? lastCardRef : null}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } }
                      }}
                    >
                      <AnimeCard anime={a} index={i % 20} />
                    </motion.div>
                  ))}
                </motion.div>

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
