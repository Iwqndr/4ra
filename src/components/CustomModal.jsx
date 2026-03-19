import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

let modalCallback = null

export const showModal = (config) => {
  if (modalCallback) modalCallback(config)
}

export const confirm = (title, message, type = 'danger') => {
  return new Promise((resolve) => {
    showModal({
      title,
      message,
      type,
      mode: 'confirm',
      onResolve: resolve
    })
  })
}

export const prompt = (title, message, placeholder = '', defaultValue = '') => {
  return new Promise((resolve) => {
    showModal({
      title,
      message,
      placeholder,
      defaultValue,
      mode: 'prompt',
      onResolve: resolve
    })
  })
}

export const alert = (title, message, type = 'info') => {
  return new Promise((resolve) => {
    showModal({
      title,
      message,
      type,
      mode: 'alert',
      onResolve: resolve
    })
  })
}

export default function CustomModal() {
  const [config, setConfig] = useState(null)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    modalCallback = (newConfig) => {
      setConfig(newConfig)
      setInputValue(newConfig.defaultValue || '')
    }
    return () => { modalCallback = null }
  }, [])

  const handleClose = (value) => {
    if (config?.onResolve) config.onResolve(value)
    setConfig(null)
  }

  if (!config) return null

  const getIcon = () => {
    switch (config.type) {
      case 'danger': return <AlertTriangle className="w-8 h-8 text-rose-500" />
      case 'success': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      default: return <Info className="w-8 h-8 text-sky-500" />
    }
  }

  return (
    <AnimatePresence>
      {config && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-[#16171a] border border-white/10 rounded-[40px] p-10 shadow-3xl text-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[100px] rounded-full opacity-20 ${config.type === 'danger' ? 'bg-rose-500' : 'bg-sky-500'}`} />
            
            <button onClick={() => handleClose(null)} className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/5 text-neutral-500 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="mb-8 flex justify-center">{getIcon()}</div>

            <h3 className="text-2xl font-black text-white tracking-tighter mb-4 uppercase italic">
              {config.title}
            </h3>
            
            <p className="text-sm font-medium text-neutral-400 mb-10 px-4 leading-relaxed">
              {config.message}
            </p>

            {config.mode === 'prompt' && (
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold mb-8 focus:outline-none focus:border-sky-500/50 transition-all text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleClose(inputValue)}
              />
            )}

            <div className={`flex ${config.mode === 'alert' ? 'justify-center' : 'gap-4'}`}>
              {config.mode !== 'alert' && (
                <button
                  onClick={() => handleClose(null)}
                  className="flex-1 py-5 rounded-2xl bg-white/5 text-neutral-300 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleClose(config.mode === 'prompt' ? inputValue : true)}
                className={`${config.mode === 'alert' ? 'w-full' : 'flex-1'} py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                  config.type === 'danger' 
                  ? 'bg-rose-500 text-white shadow-rose-500/20' 
                  : 'bg-white text-black hover:bg-sky-500 hover:text-white'
                }`}
              >
                {config.mode === 'confirm' ? 'Confirm' : config.mode === 'prompt' ? 'Accept' : 'Okay'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
