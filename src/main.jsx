import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import { ModalProvider } from './context/ModalContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <WatchlistProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </WatchlistProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
