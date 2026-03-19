import React, { createContext, useContext, useState } from 'react'

const ModalContext = createContext()

export function ModalProvider({ children }) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [activeAnime, setActiveAnime] = useState(null)

  const openMediaModal = (anime) => {
    setActiveAnime(anime)
    setIsMediaModalOpen(true)
  }

  const closeMediaModal = () => {
    setIsMediaModalOpen(false)
  }

  const openShareModal = (anime) => {
    setActiveAnime(anime)
    setIsShareModalOpen(true)
  }

  const closeShareModal = () => {
    setIsShareModalOpen(false)
  }

  return (
    <ModalContext.Provider value={{ 
      isMediaModalOpen, 
      isShareModalOpen, 
      activeAnime, 
      openMediaModal, 
      closeMediaModal,
      openShareModal,
      closeShareModal
    }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
