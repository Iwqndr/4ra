import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, Sparkles, Menu, X, Settings, SlidersHorizontal, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWatchlist } from '../context/WatchlistContext'
import FilterUI from './FilterUI'
import uiStrings from '../config/ui_strings.json'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({})
  
  const { watchlist } = useWatchlist()
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  const handleSearch = (e) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate(`/?search=${encodeURIComponent(val)}`)
    }, 800)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      navigate(`/?search=${encodeURIComponent(query)}`)
    }
  }

  const handleFilterChange = (category, value) => {
    if (category === 'reset') {
      setSelectedFilters({})
    } else {
      setSelectedFilters(prev => ({ ...prev, [category]: value }))
    }
    // In a real app, you'd trigger a search update here
    console.log('Filters updated:', category, value)
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5" id="main-nav">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-22 gap-8">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-4 shrink-0 group" id="nav-logo">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-accent via-fuchsia-500 to-accent flex items-center justify-center font-black text-white text-lg relative z-10 shadow-2xl shadow-accent/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                4A
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tighter leading-none mb-0.5">{uiStrings.common.appName}</span>
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] leading-none">{uiStrings.common.tagline}</span>
            </div>
          </Link>

          {/* Search Bar - Modern Pill */}
          <div className="hidden md:flex flex-1 max-w-3xl relative items-center">
            <div className="relative flex-1 group">
              <div className={`absolute inset-0 bg-accent/5 rounded-2xl blur-xl opacity-0 transition-opacity duration-500 ${isSearchFocused ? 'opacity-100' : ''}`} />
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-500 ${isSearchFocused ? 'text-accent scale-110' : 'text-neutral-500'}`} />
              <input
                id="search-input"
                type="text"
                value={query}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder={uiStrings.navbar.searchPlaceholder}
                className="w-full pl-14 pr-6 py-4 rounded-[22px] bg-white/[0.03] border border-white/5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white/[0.05] transition-all duration-500 backdrop-blur-xl font-medium"
              />
              
                {/* Filter Button - Integrated */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                    showFilters 
                    ? 'bg-accent text-white shadow-lg shadow-accent/40' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Filters</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
               {showFilters && (
                 <FilterUI 
                   selectedFilters={selectedFilters} 
                   onFilterChange={handleFilterChange}
                   onClose={() => setShowFilters(false)}
                 />
               )}
            </AnimatePresence>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/recommend"
              id="nav-recommend"
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-4 h-4 text-accent group-hover:scale-125 transition-transform" />
              {uiStrings.navbar.recommend}
            </Link>

            <Link
              to="/chat"
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <MessageSquare className="w-4 h-4 text-accent group-hover:scale-125 transition-transform" />
              Chat
            </Link>

            <div className="w-px h-6 bg-white/5 mx-2" />

            <Link
              to="/watchlist"
              id="nav-watchlist"
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-rose-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Heart className="w-4 h-4 text-rose-500 group-hover:scale-125 transition-transform" />
              {uiStrings.navbar.watchlist}
              {watchlist.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-lg bg-accent text-[10px] font-black text-white shadow-lg shadow-accent/30">
                  {watchlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              id="nav-settings"
              className="ml-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-neutral-400 hover:text-white hover:bg-accent/10 hover:border-accent/30 transition-all duration-500 group hover-lift"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
            </Link>
          </div>

          {/* Mobile Overlay Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden pb-10 space-y-4 overflow-hidden"
            >
              <div className="relative pt-4">
                <Search className="absolute left-5 top-[calc(50%+8px)] -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={query}
                  onChange={handleSearch}
                  onKeyDown={handleKeyDown}
                  placeholder={uiStrings.navbar.searchPlaceholder}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/recommend"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center justify-center py-8 rounded-3xl bg-white/[0.03] border border-white/5 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:bg-accent/10 hover:text-white transition-all"
                >
                  <Sparkles className="w-7 h-7 text-accent mb-3" />
                  {uiStrings.navbar.recommend}
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center justify-center py-8 rounded-3xl bg-white/[0.03] border border-white/5 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:bg-accent/10 hover:text-white transition-all"
                >
                  <MessageSquare className="w-7 h-7 text-accent mb-3" />
                  Chat
                </Link>
                <Link
                  to="/watchlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center justify-center py-8 rounded-3xl bg-white/[0.03] border border-white/5 text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:bg-rose-500/10 hover:text-white transition-all"
                >
                  <Heart className="w-7 h-7 text-rose-500 mb-3" />
                    {uiStrings.navbar.watchlist} ({watchlist.length})
                </Link>
              </div>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-4 py-5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
                {uiStrings.navbar.settings}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
