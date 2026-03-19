import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import uiStrings from '../config/ui_strings.json'

const FILTER_CATEGORIES = [
  // ... (keep categories)
  {
    id: 'season',
    label: 'Season',
    options: ['Winter', 'Spring', 'Summer', 'Fall'],
  },
  {
    id: 'format',
    label: 'Format',
    options: ['TV', 'TV Short', 'Movie', 'Special', 'OVA', 'ONA', 'Music'],
  },
  {
    id: 'status',
    label: 'Status',
    options: ['Finished', 'Releasing', 'Not Yet Released', 'Cancelled'],
  },
  {
    id: 'origin',
    label: 'Origin',
    options: ['Japan', 'South Korea', 'China', 'Taiwan'],
  },
]

const GENRES = [
  'Action', 'Adventure', 'Avant Garde', 'Boys Love', 'Comedy', 'Demons', 'Drama', 'Ecchi', 
  'Fantasy', 'Girls Love', 'Gourmet', 'Harem', 'Horror', 'Isekai', 'Iyashikei', 'Josei', 
  'Kids', 'Magic', 'Mahou Shoujo', 'Martial Arts', 'Mecha', 'Military', 'Music', 'Mystery', 
  'Parody', 'Psychological', 'Reverse Harem', 'Romance', 'School', 'Sci-Fi', 'Seinen', 'Shoujo', 
  'Shounen', 'Slice of Life', 'Space', 'Sports', 'Super Power', 'Supernatural', 'Suspense', 'Thriller', 'Vampire'
]

export default function FilterUI({ selectedFilters, onFilterChange, onClose }) {
  const toggleFilter = (category, option) => {
    const current = selectedFilters[category] || []
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option]
    onFilterChange(category, updated)
  }

  const toggleGenre = (genre) => {
    const current = selectedFilters.genres || []
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre]
    onFilterChange('genres', updated)
  }

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#0B0C0E]/90 backdrop-blur-2xl overflow-y-auto">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#16171a]/98 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
                <SlidersHorizontal className="w-5 h-5 text-accent" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">{uiStrings.filter.title}</h3>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1 opacity-60">Discovery Engine</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-full hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-all hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar scroll-smooth">
            <div className="grid grid-cols-2 gap-8">
              {FILTER_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-accent/40 rounded-full" />
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{cat.label}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {cat.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleFilter(cat.id, opt)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                          (selectedFilters[cat.id] || []).includes(opt)
                            ? 'bg-accent/10 text-white border-accent/20 border'
                            : 'text-neutral-500 hover:text-white hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
                          (selectedFilters[cat.id] || []).includes(opt) 
                          ? 'border-accent bg-accent' 
                          : 'border-white/10 bg-white/5'
                        }`}>
                          {(selectedFilters[cat.id] || []).includes(opt) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3 bg-emerald/40 rounded-full" />
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Genres Spotlight</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${
                      (selectedFilters.genres || []).includes(genre)
                        ? 'bg-emerald/10 text-emerald border-emerald/20 shadow-lg shadow-emerald/5'
                        : 'text-neutral-500 hover:text-neutral-300 bg-white/[0.01] border-white/5'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-6 sm:p-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
            <button 
              onClick={() => onFilterChange('reset', {})}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-180deg] transition-transform duration-700" />
              Reset
            </button>
            <button 
              onClick={onClose}
              className="px-10 py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95"
            >
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
