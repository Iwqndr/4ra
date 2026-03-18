import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import WatchlistPage from './pages/WatchlistPage'
import RecommendPage from './pages/RecommendPage'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/anime/:id" element={<DetailPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/recommend" element={<RecommendPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
