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
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-lg shadow-accent/5"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          AI-Powered Insights
        </motion.div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-6 uppercase" id="recommend-title">
          What are you in the <span className="text-gradient">mood</span> for?
        </h1>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-[0.3em] opacity-60">
          Describe your vibe, and our AI will architect the perfect watchlist.
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent rounded-[28px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g., A dark psychological thriller with philosophical themes..."
            className="relative w-full px-8 py-6 pr-20 rounded-[24px] glass-dark border border-white/10 text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent/50 text-[15px] font-bold transition-all duration-500 shadow-2xl"
            id="ai-prompt-input"
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !prompt.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-white text-black hover:bg-accent hover:text-white disabled:opacity-20 transition-all duration-500 shadow-xl active:scale-90"
            id="ai-submit-btn"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>

        {/* Example prompts */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setPrompt(ex); handleSubmit(ex) }}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-neutral-400 border border-border hover:text-accent hover:border-accent/30 transition-all duration-300 disabled:opacity-40"
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
