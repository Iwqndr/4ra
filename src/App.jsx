import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import WatchlistPage from './pages/WatchlistPage'
import RecommendPage from './pages/RecommendPage'
import SettingsPage from './pages/SettingsPage'
import ChatPage from './pages/ChatPage'
import MediaListModal from './components/MediaListModal'
import ShareModal from './components/ShareModal'
import { useModal } from './context/ModalContext'

export default function App() {
  const location = useLocation()
  const { isMediaModalOpen, isShareModalOpen, activeAnime, closeMediaModal, closeShareModal } = useModal()

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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:room" element={<ChatPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      {!location.pathname.startsWith('/chat') && <Footer />}

      {activeAnime && (
        <>
          <MediaListModal 
            anime={activeAnime} 
            isOpen={isMediaModalOpen} 
            onClose={closeMediaModal} 
          />
          <ShareModal />
        </>
      )}
    </div>
  )
}
