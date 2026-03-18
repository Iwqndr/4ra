import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, Loader2, AlertCircle } from 'lucide-react'
import { getAIRecommendations } from '../api/groq'
import { searchAnimeByTitle } from '../api/jikan'
import AnimeCard from '../components/AnimeCard'
import { SkeletonGrid } from '../components/SkeletonCard'

const EXAMPLE_PROMPTS = [
  'I want a sad romance set in school',
  'Dark fantasy with great fight scenes',
  'Funny slice of life with food themes',
  'Mind-bending psychological thriller',
  'Wholesome adventure with amazing world building',
  'Sci-fi with mechs and political drama',
]

export default function RecommendPage() {
  const [prompt, setPrompt] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiTitles, setAiTitles] = useState([])

  const handleSubmit = async (text) => {
    const query = text || prompt
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setAiTitles([])

    try {
      // 1. Get AI recommendations
      const titles = await getAIRecommendations(query)
      setAiTitles(titles)

      // 2. Cross-reference with Jikan in parallel batches of 3
      const animeResults = []
      const BATCH_SIZE = 3
      
      for (let i = 0; i < titles.length; i += BATCH_SIZE) {
        const batch = titles.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async (title) => {
            try {
              return await searchAnimeByTitle(title)
            } catch {
              return null
            }
          })
        )
        
        const validResults = batchResults.filter(Boolean)
        animeResults.push(...validResults)
        setResults([...animeResults]) // Progressively render batches
        
        // Brief delay between batches to be safe with rate limits
        if (i + BATCH_SIZE < titles.length) {
          await new Promise(r => setTimeout(r, 800))
        }
      }

      if (animeResults.length === 0) {
        setError('Could not find matching anime on Jikan. Try a different prompt!')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16"
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet/10 border border-violet/20 text-violet text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI-Powered Recommendations
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3" id="recommend-title">
          What do you feel like watching?
        </h1>
        <p className="text-neutral-400 text-sm">
          Describe the kind of anime you're in the mood for, and our AI will find the perfect match.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g., I want a sad romance set in school..."
            className="w-full px-6 py-4 pr-14 rounded-2xl bg-surface border border-border text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet text-sm transition-all duration-300"
            id="ai-prompt-input"
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-violet text-white hover:bg-violet/80 disabled:opacity-40 disabled:hover:bg-violet transition-all duration-300"
            id="ai-submit-btn"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Example prompts */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setPrompt(ex); handleSubmit(ex) }}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-neutral-400 border border-border hover:text-violet hover:border-violet/30 transition-all duration-300 disabled:opacity-40"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* AI Titles preview */}
      {aiTitles.length > 0 && loading && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-violet/5 border border-violet/10">
          <p className="text-xs text-violet font-medium mb-2">AI suggested these titles:</p>
          <div className="flex flex-wrap gap-2">
            {aiTitles.map((t, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-violet/10 text-violet text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2">Looking up on Jikan database...</p>
        </div>
      )}

      {/* Loading */}
      {loading && results.length === 0 && (
        <SkeletonGrid count={10} />
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Recommendations {loading && <Loader2 className="inline w-5 h-5 animate-spin ml-2" />}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {results.map((anime, i) => (
              <AnimeCard key={anime.mal_id} anime={anime} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
