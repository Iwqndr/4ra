import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react'
import uiStrings from '../config/ui_strings.json'

const FILTER_CATEGORIES = [
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-surface/90 backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-8 sm:p-10 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
                <SlidersHorizontal className="w-6 h-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">{uiStrings.filter.title}</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1 opacity-60">Discovery Engine</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 rounded-full hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-all hover:rotate-90 border border-transparent hover:border-rose-500/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-16 custom-scrollbar scroll-smooth">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {FILTER_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-accent/40 rounded-full" />
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">{cat.label}</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {cat.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleFilter(cat.id, opt)}
                        className={`flex items-center gap-4 px-5 py-4 rounded-[20px] text-sm font-bold transition-all duration-500 relative overflow-hidden group ${
                          (selectedFilters[cat.id] || []).includes(opt)
                            ? 'bg-accent/15 text-white border-accent/30 border shadow-2xl shadow-accent/10'
                            : 'text-neutral-500 hover:text-white hover:bg-white/[0.03] border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${
                          (selectedFilters[cat.id] || []).includes(opt) 
                          ? 'border-accent bg-accent' 
                          : 'border-white/10 bg-white/5 group-hover:border-neutral-600'
                        }`}>
                          {(selectedFilters[cat.id] || []).includes(opt) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="relative z-10">{opt}</span>
                        {(selectedFilters[cat.id] || []).includes(opt) && (
                          <motion.div layoutId={`glow-${cat.id}-${opt}`} className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-4 bg-emerald/40 rounded-full" />
                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em]">Genres Spotlight</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-6 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all duration-500 border relative group ${
                      (selectedFilters.genres || []).includes(genre)
                        ? 'bg-emerald/15 text-emerald border-emerald/30 shadow-2xl shadow-emerald/10 scale-[1.02]'
                        : 'text-neutral-500 hover:text-neutral-300 bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-8 sm:p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-6 relative z-10">
            <button 
              onClick={() => onFilterChange('reset', {})}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all border border-transparent hover:border-rose-500/10"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-700" />
              Reset Engine
            </button>
            <button 
              onClick={onClose}
              className="relative group px-14 py-5 rounded-[24px] bg-white text-black font-black text-[12px] uppercase tracking-[0.3em] hover:bg-accent hover:text-white transition-all duration-700 hover:scale-105 active:scale-95 shadow-2xl shadow-white/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Initialize Scan</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
