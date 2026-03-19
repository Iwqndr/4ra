import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Trash2, Calendar, Star, BookOpen, Lock, Unlock, ChevronDown, Play } from 'lucide-react'

const STATUS_OPTIONS = [
  { id: 'CURRENT', label: 'Watching', color: 'text-accent' },
  { id: 'PLANNING', label: 'Plan to watch', color: 'text-blue-400' },
  { id: 'COMPLETED', label: 'Completed', color: 'text-emerald' },
  { id: 'REPEATING', label: 'Rewatching', color: 'text-pink-500' },
  { id: 'PAUSED', label: 'Paused', color: 'text-yellow-500' },
  { id: 'DROPPED', label: 'Dropped', color: 'text-rose-500' },
]

export default function MediaListModal({ anime, isOpen, onClose }) {
  const [status, setStatus] = useState('PLANNING')
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState(0)
  const [notes, setNotes] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const token = localStorage.getItem('anilist_token')

  // Fetch current list entry
  useEffect(() => {
    if (isOpen && token && anime?.mal_id) {
      fetchCurrentEntry()
    }
  }, [isOpen, anime?.mal_id])

  const fetchCurrentEntry = async () => {
    setIsLoading(true)
    const query = `
      query ($mediaId: Int) {
        Media (idMal: $mediaId, type: ANIME) {
          mediaListEntry {
            id
            status
            score(format: POINT_10)
            progress
            notes
            private
          }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables: { mediaId: anime.mal_id } }),
      })
      const data = await res.json()
      const entry = data.data?.Media?.mediaListEntry
      if (entry) {
        setStatus(entry.status)
        setScore(entry.score || 0)
        setProgress(entry.progress || 0)
        setNotes(entry.notes || '')
        setIsPrivate(entry.private || false)
      }
    } catch (err) {
      console.error("Error fetching list entry:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!token) return
    setIsSaving(true)
    setError(null)

    const query = `
      mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int, $notes: String, $private: Boolean) {
        SaveMediaListEntry (mediaId: $mediaId, status: $status, score: $score, progress: $progress, notes: $notes, private: $private) {
          id
          status
        }
      }
    `;

    // We need the AniList Media ID, not MAL ID for Saving often, 
    // but AniList SaveMediaListEntry can take mediaId. 
    // We first need to get the Internal AniList ID if we only have MAL ID.
    
    try {
      // Get internal ID first
      const idRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `query($id: Int) { Media(idMal: $id, type: ANIME) { id } }`, 
          variables: { id: anime.mal_id } 
        }),
      })
      const idData = await idRes.json()
      const internalId = idData.data?.Media?.id

      if (!internalId) throw new Error("Could not find anime on AniList")

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          query, 
          variables: { 
            mediaId: internalId, 
            status, 
            score, 
            progress, 
            notes, 
            private: isPrivate 
          } 
        }),
      })
      const data = await res.json()
      if (data.errors) throw new Error(data.errors[0].message)
      
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <div className="fixed top-0 left-0 w-full h-full z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto box-border text-left">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-surface/40 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden backdrop-blur-3xl my-auto"
        >
          {/* Header/Banner Section */}
          <div className="relative h-48 w-full group">
            <img 
              src={anime.images?.webp?.large_image_url} 
              className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105" 
              alt="banner" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent" />
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-6 left-8 flex items-end gap-6">
              <img 
                src={anime.images?.webp?.large_image_url} 
                className="w-24 h-36 rounded-2xl border-4 border-surface shadow-2xl object-cover" 
                alt="cover" 
              />
              <div className="mb-4 text-left">
                <h2 className="text-2xl font-black text-white tracking-tight line-clamp-1">{anime.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] bg-accent/10 px-2 py-0.5 rounded-md">AniList Sync</span>
                  {isPrivate && <Lock className="w-3 h-3 text-neutral-500" />}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 pt-10 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Status Dropdown */}
              <div className="flex flex-col gap-3 relative text-left">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">List Status</label>
                <button 
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full flex items-center justify-between bg-base/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white font-bold hover:bg-base/60 transition-all"
                >
                  <span className={STATUS_OPTIONS.find(o => o.id === status)?.color || 'text-white'}>
                    {STATUS_OPTIONS.find(o => o.id === status)?.label || 'Select Status'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showStatusDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 z-[10000] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => { setStatus(opt.id); setShowStatusDropdown(false); }}
                          className={`w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all ${opt.color} ${status === opt.id ? 'bg-white/10' : ''}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Score Input */}
              <div className="flex flex-col gap-3 text-left">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Your Score (0-10)</label>
                <div className="flex items-center gap-3 bg-base/40 border border-white/5 rounded-2xl px-5 py-4">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <input 
                    type="number" 
                    min="0" max="10" step="0.5"
                    value={score}
                    onChange={(e) => setScore(parseFloat(e.target.value))}
                    className="bg-transparent text-white font-black text-sm outline-none w-full"
                  />
                </div>
              </div>

              {/* Progress Input */}
              <div className="flex flex-col gap-3 text-left">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Episode Progress</label>
                <div className="flex items-center gap-3 bg-base/40 border border-white/5 rounded-2xl px-5 py-4">
                  <Play className="w-4 h-4 text-accent" />
                  <input 
                    type="number" 
                    min="0"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="bg-transparent text-white font-black text-sm outline-none w-full"
                  />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">/ {anime.episodes || '??'}</span>
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="flex flex-col gap-3 text-left">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Entry Privacy</label>
                <button 
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-full flex items-center justify-between border rounded-2xl px-5 py-4 transition-all ${isPrivate ? 'bg-rose-500/10 border-rose-500/30' : 'bg-base/40 border-white/5'}`}
                >
                  <span className={`text-xs font-black uppercase tracking-widest ${isPrivate ? 'text-rose-500' : 'text-neutral-400'}`}>
                    {isPrivate ? 'Private Entry' : 'Public Entry'}
                  </span>
                  {isPrivate ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4 text-neutral-500" />}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-3 text-left">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Personal Notes</label>
              <textarea 
                placeholder="Thoughts on this anime..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-base/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none font-bold italic leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">{error}</p>}
              <div className="flex items-center gap-4 ml-auto">
                <button 
                  onClick={onClose}
                  className="px-6 py-4 rounded-xl text-neutral-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-xl shadow-accent/20"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save to List'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
