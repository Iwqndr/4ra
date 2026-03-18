import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, Sparkles, Menu, X } from 'lucide-react'
import { useWatchlist } from '../context/WatchlistContext'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
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

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" id="main-nav">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group" id="nav-logo">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-emerald flex items-center justify-center font-extrabold text-sm text-white group-hover:scale-110 transition-transform duration-300">
              4A
            </div>
            <span className="text-lg font-bold hidden sm:block bg-gradient-to-r from-violet to-emerald bg-clip-text text-transparent">
              4Aura
            </span>
          </Link>

          {/* Search — Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
              placeholder="Search anime..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet transition-all duration-300"
            />
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/recommend"
              id="nav-recommend"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-violet" />
              AI Recommend
            </Link>
            <Link
              to="/watchlist"
              id="nav-watchlist"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-all duration-300 relative"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              My List
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet text-[10px] font-bold flex items-center justify-center text-white">
                  {watchlist.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3 animate-in slide-in-from-top">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                placeholder="Search anime..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet/50"
              />
            </div>
            <Link
              to="/recommend"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-neutral-300 hover:bg-white/5"
            >
              <Sparkles className="w-4 h-4 text-violet" />
              AI Recommend
            </Link>
            <Link
              to="/watchlist"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-neutral-300 hover:bg-white/5"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              My List ({watchlist.length})
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
