import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within a SettingsProvider')
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('aura_settings')
    return saved ? JSON.parse(saved) : {
      language: 'English',
      theme: 'violet',
      blurIntensity: 'medium',
      gridDensity: 'comfortable',
      autoPlay: true,
      nsfwFilter: true,
      spoilerBlur: true,
      subDub: 'sub',
      resolution: '1080p'
    }
  })

  useEffect(() => {
    localStorage.setItem('aura_settings', JSON.stringify(settings))
    // Apply theme and blur to document-level
    document.documentElement.setAttribute('data-theme', settings.theme)
    const blurValue = settings.blurIntensity === 'low' ? '8px' : settings.blurIntensity === 'high' ? '40px' : '20px'
    document.documentElement.style.setProperty('--blur-intensity', blurValue)
  }, [settings])

  const getTranslatedTitle = (anime) => {
    if (!anime) return ''
    if (settings.language === 'English' && anime.title_english) {
      return anime.title_english
    }
    return anime.title
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, getTranslatedTitle }}>
      {children}
    </SettingsContext.Provider>
  )
}
