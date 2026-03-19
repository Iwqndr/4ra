import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react'
import { getAIRecommendations, getSuggestedPrompts } from '../api/groq'
import { fetchAnimeDetailsBatch, fetchTrendingAnime } from '../api/anilist'
import AnimeCard from '../components/AnimeCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import { useSettings } from '../context/SettingsContext'

export default function RecommendPage() {
  const { settings } = useSettings()
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiTitles, setAiTitles] = useState([])
  const [suggestedPrompts, setSuggestedPrompts] = useState([])
  const [refreshingPrompts, setRefreshingPrompts] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setRefreshingPrompts(true)
    try {
      const proms = await getSuggestedPrompts()
      setSuggestedPrompts(proms)
    } finally {
      setRefreshingPrompts(false)
    }
  }

  const handleSubmit = async (text) => {
    const query = text || prompt
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setAiTitles([])

    try {
      // 1. Get AI recommendations (Titles) - LITE PATH (Safe & Dynamic Volume)
      const titles = await getAIRecommendations(query)
      setAiTitles(titles)

      // Refresh suggestions for variety
      loadPrompts()

      // 2. Fetch anime details in chunked batches
      const animeResults = await fetchAnimeDetailsBatch(titles, settings.nsfwFilter)
      setResults(animeResults)

      if (animeResults.length === 0) {
        setError('Could not find matching anime. Try a different prompt!')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 text-violet text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Insights</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          What are you in <span className="text-violet italic">the mood</span> for?
        </h1>
        <p className="text-neutral-400 text-lg mb-8">
          Describe your vibe, and our AI will architect the perfect watchlist.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Dark fantasy with morally ambiguous characters..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 pr-16 text-white focus:outline-none focus:border-violet transition-all shadow-2xl"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="absolute right-3 top-2.5 p-2.5 rounded-xl bg-violet text-white hover:bg-violet-600 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Suggestions chips */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Suggested Vibes</span>
            <button 
              onClick={loadPrompts} 
              disabled={refreshingPrompts}
              className="p-1 hover:bg-white/5 rounded-full transition-colors text-neutral-500 hover:text-white"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingPrompts ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <AnimatePresence mode="popLayout">
              {suggestedPrompts.length > 0 ? (
                suggestedPrompts.map((vibe, i) => (
                  <motion.button
                    key={vibe}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
                    onClick={() => {
                      setPrompt(vibe)
                      handleSubmit(vibe)
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm hover:border-violet/50 hover:text-violet transition-all whitespace-nowrap"
                  >
                    "{vibe}"
                  </motion.button>
                ))
              ) : (
                <div className="h-10" /> // Spacer
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* AI Success Feedback */}
      {aiTitles.length > 0 && loading && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-violet/5 border border-violet/10">
          <p className="text-xs text-violet font-medium mb-2">AI discovered {aiTitles.length} matches. Synchronizing metadata...</p>
          <div className="flex flex-wrap gap-2">
            {aiTitles.slice(0, 24).map((title, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-violet/10 text-violet text-[10px] font-semibold">
                {title}
              </span>
            ))}
            {aiTitles.length > 24 && <span className="text-violet text-[10px] font-bold">+{aiTitles.length - 24} more</span>}
          </div>
          <p className="text-[10px] text-neutral-500 mt-2 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Parallelizing metadata retrieval chunks...
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && results.length === 0 && (
        <SkeletonGrid count={12} />
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-violet" />
              Tailored Selection
            </h2>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-violet" />}
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {results.map((anime, i) => (
              <AnimeCard key={`${anime.mal_id}-${i}`} anime={anime} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
