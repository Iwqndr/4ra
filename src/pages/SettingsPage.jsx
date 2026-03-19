import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Settings, Shield, Monitor, Sliders, ChevronRight, Check, History, Palette, Zap, Eye, Globe } from 'lucide-react'
import AniListManager from '../components/AniListManager'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'

const TABS = (ui) => [
  { id: 'profile', label: ui.tabs.profile, icon: User, description: ui.profile.title },
  { id: 'general', label: ui.tabs.general, icon: Settings, description: ui.general.title },
  { id: 'security', label: ui.tabs.security, icon: Shield, description: ui.development.title },
  { id: 'sessions', label: ui.tabs.sessions, icon: Monitor, description: ui.development.title },
  { id: 'preferences', label: ui.tabs.preferences, icon: Sliders, description: ui.preferences.title },
  { id: 'privacy', label: ui.tabs.privacy, icon: Shield, description: ui.development.title },
]

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const ui = uiStrings.settings
  const tabs = TABS(ui)
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [saveStatus, setSaveStatus] = useState('')
  const [user, setUser] = useState(null)
  const aniListRef = useRef()

  // Profile State (Local Overrides)
  const [profileData, setProfileData] = useState({
    name: '',
    language: 'English',
    bio: '',
    location: '',
    website: ''
  })

  // Load local state on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, []);

  const handleSaveChanges = async () => {
    localStorage.setItem('userProfile', JSON.stringify(profileData))
    setSaveStatus('Changes saved locally!')

    // Sync to AniList if ref is available
    if (aniListRef.current) {
      const result = await aniListRef.current.syncProfile(profileData.bio)
      if (result?.success) {
        setSaveStatus('Changes saved & synced to AniList!')
      }
    }

    setTimeout(() => setSaveStatus(''), 3000)
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-12 min-h-[calc(100vh-80px)]">
      <div className="flex flex-col lg:flex-row gap-12">

        {/* Premium Sidebar Dashboard */}
        <aside className="w-full lg:w-96 flex flex-col gap-10">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 shadow-lg shadow-accent/5">
                <Settings className="w-8 h-8 text-accent" />
              </div>
              {ui.dashboard}
            </h1>
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] ml-2 opacity-50">{ui.subtitle}</p>
          </div>

          {/* High-Fidelity User Summary */}
          <div className="glass-dark border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-violet/10 transition-colors duration-700" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-[14px] bg-base flex items-center justify-center">
                    <User className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-white tracking-tight">{profileData.name || 'Anonymous'}</span>
                  <span className="text-[4px] font-black text-neutral-500 tracking-widest">{profileData.location || 'pretty cool name u have'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:border-violet/20 transition-all duration-500">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    {ui.summary.watched}
                  </span>
                  <span className="text-2xl font-black text-white">{user?.statistics?.anime?.count ?? '0'}</span>
                </div>
                <div className="flex flex-col p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:border-emerald/20 transition-all duration-500">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald" />
                    {ui.summary.episodes}
                  </span>
                  <span className="text-2xl font-black text-white">{user?.statistics?.anime?.episodesWatched ?? '0'}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 lg:gap-5 p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] transition-all duration-500 group relative overflow-hidden shrink-0 lg:shrink ${activeTab === tab.id
                  ? 'glass-dark border-accent/30 border shadow-2xl shadow-accent/10'
                  : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
              >
                <div className={`p-2 lg:p-2.5 rounded-xl transition-all duration-500 ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'bg-white/5 text-neutral-500 group-hover:text-white group-hover:bg-white/10'}`}>
                  <tab.icon className="w-3.5 h-3.5 lg:w-4 h-4" />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-[10px] lg:text-[12px] font-black uppercase tracking-widest transition-colors duration-500 ${activeTab === tab.id ? 'text-white' : 'text-neutral-500 group-hover:text-white'}`}>{tab.label}</span>
                  <span className="hidden lg:block text-[9px] font-bold text-neutral-600 truncate w-full group-hover:text-neutral-500 transition-colors uppercase tracking-tight">{tab.description}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute right-2 lg:right-4 w-1 lg:w-1.5 h-1 lg:h-1.5 bg-violet rounded-full shadow-[0_0_12px_rgba(139,92,246,1)]"
                  />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Focused Main Content Grid */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
              className="glass-dark border border-white/5 rounded-[48px] p-8 sm:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.6)] min-h-[750px] relative overflow-hidden"
            >
              {/* Decorative Mesh Gradient Background */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/5 blur-[100px] pointer-events-none rounded-full" />

              <div className="relative z-10 flex flex-col h-full">
                {activeTab === 'profile' && (
                  <div className="space-y-12 h-full flex flex-col">
                    <AniListManager
                      ref={aniListRef}
                      onUserUpdate={setUser}
                      profileData={profileData}
                      setProfileData={setProfileData}
                    />

                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-violet rounded-full" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{ui.profile.title}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">{ui.profile.handle}</label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-[15px] font-bold text-white focus:outline-none focus:border-violet/40 focus:ring-4 focus:ring-violet/10 transition-all shadow-inner"
                            placeholder={ui.profile.placeholderHandle}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">{ui.profile.language}</label>
                          <select
                            value={settings.language}
                            onChange={(e) => updateSetting('language', e.target.value)}
                            className="w-full appearance-none bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-[15px] font-bold text-white focus:outline-none focus:border-violet/40 focus:ring-4 focus:ring-violet/10 transition-all font-bold shadow-inner"
                          >
                            <option value="English">English (Global)</option>
                            <option value="Japanese">Japanese (Native / Romaji)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">{ui.profile.bio}</label>
                        <textarea
                          placeholder={ui.profile.placeholderBio}
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-[32px] px-8 py-6 text-[15px] text-white min-h-[160px] focus:outline-none focus:border-violet/40 focus:ring-4 focus:ring-violet/10 resize-none font-bold leading-relaxed shadow-inner"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">{ui.profile.origin}</label>
                          <input
                            type="text"
                            value={profileData.location}
                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            placeholder={ui.profile.placeholderOrigin}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-[15px] font-bold text-white focus:outline-none focus:border-violet/40 focus:ring-4 focus:ring-violet/10 transition-all shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">{ui.profile.digitalField}</label>
                          <input
                            type="text"
                            value={profileData.website}
                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                            placeholder="https://yourpage.com"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 text-[15px] font-bold text-white focus:outline-none focus:border-violet/40 focus:ring-4 focus:ring-violet/10 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col">
                        {saveStatus ? (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald">
                            <Check className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{saveStatus}</span>
                          </motion.div>
                        ) : (
                          <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest italic flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-neutral-700" />
                            {ui.profile.unsaved}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSaveChanges}
                        className="group relative flex items-center gap-4 px-12 py-6 rounded-[32px] bg-white text-black font-black text-[13px] uppercase tracking-[0.3em] transition-all duration-500 hover:scale-105 hover:bg-violet hover:text-white shadow-2xl shadow-white/5 active:scale-95"
                      >
                        {ui.profile.commit}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'general' && (
                  <div className="space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-emerald rounded-full" />
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">{ui.general.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* Theme Selection */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 group">
                        <div className="flex items-center gap-6 mb-6 sm:mb-0">
                          <div className="p-3 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-violet" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-white uppercase tracking-widest group-hover:text-violet transition-colors">Aura Accent</span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Change the primary interface hue</span>
                          </div>
                        </div>
                        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                          {['violet', 'emerald', 'amber', 'rose', 'blue'].map(c => (
                            <button
                              key={c}
                              onClick={() => updateSetting('theme', c)}
                              className={`w-10 h-10 rounded-xl transition-all border-2 ${settings.theme === c ? 'scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'} ${c === 'violet' ? 'bg-violet border-violet/40' :
                                c === 'emerald' ? 'bg-emerald border-emerald/40' :
                                  c === 'amber' ? 'bg-amber-500 border-amber-400' :
                                    c === 'rose' ? 'bg-rose-500 border-rose-400' :
                                      'bg-blue-500 border-blue-400'
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Interface Blur */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 group">
                        <div className="flex items-center gap-6 mb-6 sm:mb-0">
                          <div className="p-3 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-white uppercase tracking-widest group-hover:text-violet transition-colors">Interface Fidelity</span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Adjust glassmorphism blur intensity</span>
                          </div>
                        </div>
                        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                          {['low', 'medium', 'high'].map(b => (
                            <button
                              key={b}
                              onClick={() => updateSetting('blurIntensity', b)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${settings.blurIntensity === b
                                ? 'bg-white text-black shadow-xl'
                                : 'text-neutral-500 hover:text-white'
                                }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content Density */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 group">
                        <div className="flex items-center gap-6 mb-6 sm:mb-0">
                          <div className="p-3 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center">
                            <Sliders className="w-5 h-5 text-violet" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black text-white uppercase tracking-widest group-hover:text-violet transition-colors">Grid Layout</span>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Density of anime cards on home</span>
                          </div>
                        </div>
                        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                          {['compact', 'comfortable', 'spacious'].map(d => (
                            <button
                              key={d}
                              onClick={() => updateSetting('gridDensity', d)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${settings.gridDensity === d
                                ? 'bg-white text-black shadow-xl'
                                : 'text-neutral-500 hover:text-white'
                                }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-12">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">{ui.preferences.title}</h3>
                    </div>
                    <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        {[
                          { key: 'nsfwFilter', label: 'Explicit Content Filter' },
                          { key: 'spoilerBlur', label: 'Automatic Spoiler Blur' },
                          { key: 'autoPlay', label: 'Ambient Mode Auto-Play' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-5 cursor-pointer group">
                            <div
                              onClick={() => updateSetting(item.key, !settings[item.key])}
                              className={`w-10 h-6 rounded-full transition-all relative border ${settings[item.key] ? 'bg-emerald border-emerald/40' : 'bg-white/5 border-white/10'
                                }`}
                            >
                              <motion.div
                                animate={{ x: settings[item.key] ? 20 : 4 }}
                                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[12px] font-black text-neutral-400 group-hover:text-white transition-colors uppercase tracking-widest">{item.label}</span>
                              <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">System Switch</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex flex-col gap-4 p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                          <Globe className="w-5 h-5 text-amber-500" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Metadata Preferences</span>
                        </div>
                        <div className="flex gap-2">
                          {['sub', 'dub'].map(v => (
                            <button
                              key={v}
                              onClick={() => updateSetting('subDub', v)}
                              className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${settings.subDub === v ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-white/5 text-neutral-500 hover:text-white'
                                }`}
                            >
                              {v} Preferred
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                          <Monitor className="w-5 h-5 text-blue-500" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">Canvas Resolution</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                          {['4K', '1080p', '720p', 'Auto'].map(v => (
                            <button
                              key={v}
                              onClick={() => updateSetting('resolution', v)}
                              className={`px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${settings.resolution === v ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 text-neutral-500 hover:text-white'
                                }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {['security', 'sessions', 'privacy'].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-8 py-20 flex-1">
                    <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/5 relative group">
                      <div className="absolute inset-0 bg-violet/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <History className="w-16 h-16 text-neutral-700 relative z-10 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{ui.development.title}</h3>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] max-w-sm mx-auto opacity-60">{ui.development.subtitle}</p>
                    </div>
                    <button onClick={() => setActiveTab('profile')} className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105">{ui.development.return}</button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
