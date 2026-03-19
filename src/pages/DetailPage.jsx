import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Star, Play, Tv, Calendar, Clock, Users,
  Share2, ExternalLink, ArrowLeft, Building2, ChevronRight, Eye
} from 'lucide-react'
import {
  fetchAnimeById,
  fetchAnimeVideos,
  fetchAnimeRecommendations,
  fetchAnimeCharacters,
  fetchPersonVoices
} from '../api/jikan'
import { fetchCharacterVoiceActors } from '../api/anilist'
import { useWatchlist } from '../context/WatchlistContext'
import { useModal } from '../context/ModalContext'
import uiStrings from '../config/ui_strings.json'
import { useSettings } from '../context/SettingsContext'
import StatusBadge from '../components/StatusBadge'
import AnimeCard from '../components/AnimeCard'
import { X, Globe, Award, Loader2 } from 'lucide-react'

const STREAMING_PLATFORMS = {
  'Crunchyroll': { color: '#f47521', url: 'https://crunchyroll.com' },
  'Netflix': { color: '#e50914', url: 'https://netflix.com' },
  'Hulu': { color: '#1ce783', url: 'https://hulu.com' },
  'Disney Plus': { color: '#113ccf', url: 'https://disneyplus.com' },
  'Amazon Prime Video': { color: '#00a8e1', url: 'https://primevideo.com' },
  'HBO Max': { color: '#b535f6', url: 'https://max.com' },
  'HIDIVE': { color: '#00baff', url: 'https://hidive.com' },
}

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isInWatchlist, toggleWatchlist } = useWatchlist()
  const { watchlist, openMediaModal, openShareModal } = useModal()
  const { settings, getTranslatedTitle } = useSettings()
  const [anime, setAnime] = useState(null)
  const [videos, setVideos] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [characterDetails, setCharacterDetails] = useState(null)
  const [loadingCharacter, setLoadingCharacter] = useState(false)
  const [selectedActor, setSelectedActor] = useState(null)
  const [actorVoices, setActorVoices] = useState([])
  const [loadingVoices, setLoadingVoices] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setAnime(null)
    setVideos(null)
    setRecommendations([])
    setCharacters([])

    const load = async () => {
      try {
        const data = await fetchAnimeById(id)
        setAnime(data)

        // Load videos and recommendations after a delay (rate limiting)
        setTimeout(async () => {
          try {
            const vids = await fetchAnimeVideos(id)
            setVideos(vids)
          } catch { }
        }, 500)

        setTimeout(async () => {
          try {
            const recs = await fetchAnimeRecommendations(id)
            setRecommendations(recs?.slice(0, 10) || [])
          } catch { }
        }, 1200)

        setTimeout(async () => {
          try {
            const chars = await fetchAnimeCharacters(id)
            setCharacters(chars?.slice(0, 20) || [])
          } catch { }
        }, 1800)
      } catch (err) {
        console.error('Failed to load anime:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleShare = () => {
    openShareModal(anime)
  }

  const handleSearchByStudio = (studioName) => {
    navigate(`/?search=${encodeURIComponent(studioName)}`)
  }

  const handleSearchByGenre = (genreId) => {
    navigate(`/?genre=${genreId}`)
  }

  const handleCharacterClick = async (char) => {
    // char is the object from Jikan's characters list, which already has voice_actors
    setSelectedCharacter(char)
    setLoadingCharacter(true)
    setCharacterDetails(null)
    try {
      // Still fetch AniList for the bio and siteUrl (View on AniList link)
      const details = await fetchCharacterVoiceActors(id, char.character.name)
      setCharacterDetails(details)
    } catch (err) {
      console.error('Failed to load character info from AniList:', err)
    } finally {
      setLoadingCharacter(false)
    }
  }

  const handleActorClick = async (person) => {
    setSelectedActor(person)
    setLoadingVoices(true)
    setActorVoices([])
    try {
      const voices = await fetchPersonVoices(person.mal_id)
      setActorVoices(voices || [])
    } catch (err) {
      console.error('Failed to load actor voices:', err)
    } finally {
      setLoadingVoices(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 aspect-[3/4] skeleton rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-3/4 skeleton rounded-lg" />
            <div className="h-4 w-full skeleton rounded-lg" />
            <div className="h-4 w-5/6 skeleton rounded-lg" />
            <div className="h-4 w-2/3 skeleton rounded-lg" />
            <div className="h-32 w-full skeleton rounded-xl mt-6" />
          </div>
        </div>
      </div>
    )
  }

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
        <p className="text-lg font-medium">Anime not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-accent hover:underline">Go home</button>
      </div>
    )
  }

  const imgSrc = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || ''
  const inList = isInWatchlist(anime.mal_id)

  const openings = videos?.music_videos?.filter(v => v.meta?.type === 'Opening Theme') || []
  const endings = videos?.music_videos?.filter(v => v.meta?.type === 'Ending Theme') || []
  const themeVideos = [...openings, ...endings]

  // Detect streaming links from external links or generate suggestions
  const streamingLinks = anime.streaming?.length > 0
    ? anime.streaming.map(s => ({
      name: s.name,
      url: s.url,
      color: STREAMING_PLATFORMS[s.name]?.color || '#8b5cf6',
    }))
    : Object.entries(STREAMING_PLATFORMS).slice(0, 4).map(([name, v]) => ({
      name,
      url: `${v.url}/search?q=${encodeURIComponent(anime.title)}`,
      color: v.color,
    }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pb-32 relative"
    >
      {/* Cinematic Banner Backdrop */}
      <div className="absolute top-0 left-0 w-full h-[600px] sm:h-[750px] overflow-hidden pointer-events-none">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 1.5 }}
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover blur-[80px] scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/40 to-base" />
        <div className="absolute inset-0 bg-gradient-to-r from-base/60 via-transparent to-base/60" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-neutral-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {uiStrings.common.backToBrowse}
        </Link>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-14">
          {/* Sidebar Area (Poster + Info) */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 space-y-10">
            {/* Poster Card */}
            <div className="relative rounded-[40px] overflow-hidden border border-white/5 shadow-2xl shadow-black/60 group -mt-4 md:-mt-8">
              <img
                src={imgSrc}
                alt={anime.title}
                className="w-full aspect-[3/4] object-cover transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {anime.rank && (
                <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-accent text-[10px] font-black text-white uppercase tracking-widest shadow-xl shadow-accent/40 scale-90 md:scale-100">
                  Rank #{anime.rank}
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <button
                  onClick={() => openMediaModal(anime)}
                  className={`p-5 rounded-full backdrop-blur-3xl transition-all hover:scale-110 ${inList
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                >
                  <Heart className={`w-6 h-6 ${inList ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* List Status Button (AniList Style) */}
            <div className="space-y-3 px-2">
              <button
                onClick={() => openMediaModal(anime)}
                className={`w-full flex items-center justify-center gap-4 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${inList
                    ? 'bg-rose-500 text-white shadow-rose-500/20'
                    : 'bg-accent text-white hover:bg-accent-hover shadow-accent/20'
                  }`}
              >
                {inList ? uiStrings.detail.inCollection : uiStrings.detail.addToCollection}
              </button>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-4 py-5 rounded-[24px] bg-surface/40 border border-white/10 text-neutral-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-white hover:border-white/20 transition-all backdrop-blur-md"
              >
                <Share2 className="w-4 h-4" />
                {uiStrings.detail.shareAnime}
              </button>
            </div>

            {/* Information Side Panel */}
            <div className="bg-surface/30 border border-white/5 rounded-[40px] p-8 backdrop-blur-md space-y-8">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                <span className="w-1.5 h-6 bg-accent rounded-full" />
                {uiStrings.detail.quickInfo}
              </h3>

              <div className="space-y-6">
                {[
                  { label: 'Score', value: anime.score || 'N/A', icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />, sub: `${((anime.scored_by || 0) / 1000).toFixed(0)}K` },
                  { label: 'Format', value: anime.type || 'TV' },
                  { label: 'Status', value: anime.status || 'Finished' },
                  { label: 'Episodes', value: `${anime.episodes || '??'} eps` },
                  { label: 'Duration', value: (anime.duration?.split(' ')?.[0] || '??') + 'm' },
                  { label: 'Season', value: `${anime.season || 'Unknown'} ${anime.year || ''}` },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-sm font-bold text-white uppercase tracking-wider">{item.value}</span>
                      {item.sub && <span className="text-[10px] text-neutral-500 font-bold ml-1">{item.sub}</span>}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col pt-4 border-t border-white/5">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3 text-left">Studios</span>
                  <div className="flex flex-col gap-2">
                    {anime.studios?.map(s => (
                      <span
                        key={s.mal_id}
                        onClick={() => handleSearchByStudio(s.name)}
                        className="text-xs font-bold text-accent hover:underline cursor-pointer text-left transition-colors hover:text-white"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col pt-4 border-t border-white/5 text-left">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3">Genres</span>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres?.map(g => (
                      <span
                        key={g.mal_id}
                        onClick={() => handleSearchByGenre(g.mal_id)}
                        className="text-[10px] font-bold text-neutral-300 bg-white/5 py-1.5 px-3 rounded-xl border border-white/10 hover:bg-white/10 hover:border-accent/50 cursor-pointer transition-all"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header / Title Section */}
            <div className="mb-12">
              <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[0.95]"
                  >
                    {getTranslatedTitle(anime)}
                  </motion.h1>
              {anime.title_english && (
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-8">{anime.title_english}</p>
              )}

              {/* Visual Stats Bar */}
              {/* Visual Stats Bar - High Fidelity */}
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-12">
                {[
                  { label: 'Popularity', value: `#${anime.popularity || '??'}`, icon: <Users className="w-5 h-5 text-blue-400" />, shadow: 'shadow-blue-500/20' },
                  { label: 'Members', value: `${((anime.members || 0) / 1000).toFixed(0)}K`, icon: <Heart className="w-5 h-5 text-rose-400" />, shadow: 'shadow-rose-500/20' },
                  { label: 'Favorites', value: `${((anime.favorites || 0) / 1000).toFixed(1)}K`, icon: <Star className="w-5 h-5 text-amber-400" />, shadow: 'shadow-amber-500/20' },
                ].map((stat, i) => (
                  <div key={i} className={`flex items-center gap-5 glass-dark border border-white/5 px-8 py-5 rounded-[28px] group transition-all duration-500 hover:border-white/10 ${stat.shadow} hover:shadow-2xl`}>
                    <div className="p-3 rounded-2xl bg-white/[0.03] group-hover:scale-110 group-hover:bg-white/5 transition-all duration-500">
                      {stat.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">{stat.label}</span>
                      <span className="text-xl font-black text-white tracking-tighter">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab Navigation - Polished */}
              <div className="flex items-center gap-10 border-b border-white/5 mt-8 overflow-x-auto hide-scrollbar">
                {['overview', 'characters', 'media', 'recommendations'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative group shrink-0 ${activeTab === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    {tab}
                    {activeTab === tab ? (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent rounded-full shadow-[0_-5px_20px_rgba(139,92,246,0.6)]"
                      />
                    ) : (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-white/5 transition-all w-0 group-hover:w-full mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Display Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-12">
                    {/* Synopsis Card */}
                    <div className="bg-surface/30 border border-white/5 rounded-[40px] p-8 sm:p-10 backdrop-blur-md">
                      <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-6">Synopsis</h2>
                      <p className={`text-sm md:text-lg text-neutral-400 font-bold leading-[1.8] tracking-tight transition-all duration-700 ${
                        settings.spoilerBlur ? 'blur-md hover:blur-none select-none hover:select-text cursor-help' : ''
                      }`}>
                        {anime.synopsis || 'No description available for this anime.'}
                      </p>
                      {settings.spoilerBlur && (
                        <div className="mt-4 flex items-center gap-2 text-amber-500/60 text-[10px] font-black uppercase tracking-widest">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tap or hover to reveal spoiler</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Background Card */}
                      {anime.background && (
                        <div className="bg-surface/30 border border-white/5 rounded-[40px] p-8">
                          <h2 className="text-[10px] font-black text-emerald uppercase tracking-[0.4em] mb-6">Background</h2>
                          <p className="text-xs text-neutral-400 font-bold leading-[2] italic">{anime.background}</p>
                        </div>
                      )}

                      {/* Watch List Card */}
                      <div className="bg-surface/30 border border-white/5 rounded-[40px] p-8">
                        <h2 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-6">Official Sources</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {streamingLinks.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: link.color }}>{link.name}</span>
                              <ExternalLink className="w-3 h-3 text-neutral-600 group-hover:text-white transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Relations Section */}
                    {anime.relations?.length > 0 && (
                      <div className="space-y-6">
                        <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em] ml-2">Related Media</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                          {anime.relations.map((rel, i) => (
                            rel.entry?.map(entry => (
                              <Link
                                key={entry.mal_id}
                                to={`/anime/${entry.mal_id}`}
                                className="min-w-[240px] bg-surface/30 border border-white/5 p-5 rounded-[24px] hover:bg-white/5 transition-all group shrink-0"
                              >
                                <span className="text-[9px] font-black text-accent uppercase tracking-widest mb-2 block opacity-70 group-hover:opacity-100">{rel.relation}</span>
                                <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-accent transition-colors">{entry.name}</p>
                              </Link>
                            ))
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'characters' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {characters.map((char, i) => (
                      <motion.div
                        key={char.character.mal_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col gap-4 group cursor-pointer"
                        onClick={() => handleCharacterClick(char)}
                      >
                        <div className="aspect-[3/4.2] relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-accent/40 group-hover:-translate-y-2 transform-gpu">
                          <img
                            src={char.character.images?.webp?.image_url || char.character.images?.jpg?.image_url}
                            alt={char.character.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                          {/* Character Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <p className="text-[14px] font-black text-white leading-tight mb-2 group-hover:text-accent transition-colors">
                              {char.character.name}
                            </p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">{char.role}</p>
                          </div>
                        </div>

                        {/* Voice Actor Section */}
                        {char.voice_actors?.find(va => va.language === 'Japanese') && (
                          <div className="flex items-center gap-4 px-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                              <img
                                src={char.voice_actors.find(va => va.language === 'Japanese').person.images?.jpg?.image_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Seiyuu</span>
                              <span className="text-[12px] font-bold text-neutral-300 truncate tracking-tight">{char.voice_actors.find(va => va.language === 'Japanese').person.name}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-10">
                    {themeVideos.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {themeVideos.map((v, i) => (
                          <div key={i} className="rounded-[40px] overflow-hidden bg-surface/30 border border-white/5 backdrop-blur-md group">
                            <div className="aspect-video relative overflow-hidden">
                              {v.video?.youtube_id ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${v.video.youtube_id}`}
                                  title={v.title || 'Theme'}
                                  className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="w-full h-full bg-base/50 flex items-center justify-center text-neutral-700 text-[10px] font-black uppercase tracking-widest">
                                  No Preview Available
                                </div>
                              )}
                            </div>
                            <div className="p-6">
                              <p className="text-xs font-black text-white uppercase tracking-wider line-clamp-1">{v.title}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <StatusBadge status={v.meta?.type === 'Opening Theme' ? 'Airing' : 'Completed'} />
                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{v.meta?.type}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {['openings', 'endings'].map((type) => (
                          anime.theme?.[type]?.length > 0 && (
                            <div key={type} className="bg-surface/30 border border-white/5 rounded-[40px] p-8">
                              <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-6 ${type === 'openings' ? 'text-accent' : 'text-emerald'}`}>
                                {type}
                              </h3>
                              <div className="space-y-4">
                                {anime.theme[type].map((t, i) => (
                                  <p key={i} className={`text-xs text-neutral-400 font-bold italic border-l-2 pl-4 py-1 ${type === 'openings' ? 'border-accent' : 'border-emerald'} opacity-75 hover:opacity-100 transition-opacity`}>
                                    {t}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                    {recommendations.map((rec, i) => (
                      <div key={rec.entry?.mal_id} className="scale-95 hover:scale-100 transition-transform">
                        <AnimeCard anime={rec.entry} index={i} />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Character Detail Modal */}
      <AnimatePresence>
        {selectedCharacter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCharacter(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-surface/40 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              <button
                onClick={() => setSelectedCharacter(null)}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row h-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-8 md:p-12 gap-12">
                {/* Character Profile */}
                <div className="w-full md:w-72 shrink-0 space-y-8">
                  <div className="aspect-[3/4] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                    <img
                      src={selectedCharacter.character.images?.webp?.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">{selectedCharacter.character.name}</h2>
                    <p className="text-xs font-black text-accent uppercase tracking-[0.2em]">{selectedCharacter.role}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-neutral-400">
                      <Globe className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Global Profile</span>
                    </div>
                    <div className="space-y-3">
                      {characterDetails?.character?.siteUrl && (
                        <a
                          href={characterDetails.character.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-3.5 rounded-2xl bg-[#02a9ff]/20 border border-[#02a9ff]/30 text-center text-[10px] font-black uppercase tracking-widest text-[#02a9ff] hover:bg-[#02a9ff]/30 transition-all"
                        >
                          View on AniList
                        </a>
                      )}
                      <a
                        href={selectedCharacter.character.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3.5 rounded-2xl bg-white/5 border border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-accent hover:border-accent/40 transition-all"
                      >
                        View on MAL
                      </a>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-12">
                  {/* Voice Actors Section */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-6 bg-accent rounded-full" />
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Voice Cast</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Using Jikan's voice_actors primarily as it's official and direct */}
                      {selectedCharacter.voice_actors?.filter(va => va.language === 'Japanese' || va.language === 'English').map((va, i) => (
                        <div
                          key={i}
                          onClick={(e) => { e.stopPropagation(); handleActorClick(va.person) }}
                          className="flex items-center gap-5 p-5 rounded-[28px] bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group/actor cursor-pointer"
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover/actor:scale-105 transition-transform duration-500">
                            <img src={va.person.images?.jpg?.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md self-start ${va.language === 'Japanese' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'}`}>
                              {va.language}
                            </span>
                            <h4 className="text-[15px] font-black text-white truncate">{va.person.name}</h4>
                            <div className="flex items-center gap-2 opacity-40">
                              <Award className="w-3 h-3 text-neutral-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Official Cast</span>
                              {va.language === 'Japanese' && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!selectedCharacter.voice_actors?.length && (
                      <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-center">
                        <p className="text-xs font-bold text-neutral-500 italic opacity-60">No additional voice actor data available for this character.</p>
                      </div>
                    )}
                  </div>

                  {/* Character Description from AniList */}
                  {loadingCharacter ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <Loader2 className="w-6 h-6 text-accent animate-spin" />
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Syncing character bio...</p>
                    </div>
                  ) : characterDetails?.character?.description && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-emerald rounded-full" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Background</h3>
                      </div>
                      <div
                        className="text-neutral-400 text-sm leading-relaxed max-w-2xl font-medium prose prose-invert character-bio"
                        dangerouslySetInnerHTML={{ __html: characterDetails.character.description }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Actor Detail Modal (Sub-modal) */}
      <AnimatePresence>
        {selectedActor && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActor(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface/80 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)]"
            >
              <button
                onClick={() => setSelectedActor(null)}
                className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-10 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[24px] overflow-hidden border-2 border-white/10 shrink-0">
                    <img src={selectedActor.images?.jpg?.image_url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{selectedActor.name}</h3>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Associated Roles</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-emerald rounded-full" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Other Performance Work</h4>
                  </div>

                  {loadingVoices ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-emerald animate-spin" />
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Compiling filmography...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {actorVoices.slice(0, 15).map((voice, i) => (
                        <Link
                          key={i}
                          to={`/anime/${voice.anime.mal_id}`}
                          onClick={() => { setSelectedActor(null); setSelectedCharacter(null); }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/10 transition-all group/voice"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-16 rounded-xl overflow-hidden border border-white/5">
                              <img src={voice.anime.images?.jpg?.image_url} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[14px] font-black text-white group-hover/voice:text-emerald transition-colors line-clamp-1">{voice.anime.title}</span>
                              <span className="text-[11px] font-black text-neutral-500 italic">{voice.character.name}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-700 group-hover/voice:text-white transition-colors" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {!loadingVoices && (!actorVoices || actorVoices.length === 0) && (
                    <div className="p-8 rounded-[24px] bg-white/[0.01] border border-white/5 text-center">
                      <p className="text-xs font-bold text-neutral-600 italic">No additional roles documented in our records.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
