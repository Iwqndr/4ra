import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart, Star, Play, Tv, Calendar, Clock, Users,
  Share2, ExternalLink, ArrowLeft, Building2, ChevronRight
} from 'lucide-react'
import { fetchAnimeById, fetchAnimeVideos, fetchAnimeRecommendations } from '../api/jikan'
import { useWatchlist } from '../context/WatchlistContext'
import StatusBadge from '../components/StatusBadge'
import AnimeCard from '../components/AnimeCard'

const STREAMING_PLATFORMS = {
  'Crunchyroll': { color: '#f47521', url: 'https://crunchyroll.com' },
  'Netflix': { color: '#e50914', url: 'https://netflix.com' },
  'Hulu': { color: '#1ce783', url: 'https://hulu.com' },
  'Funimation': { color: '#5b0bb5', url: 'https://funimation.com' },
  'Disney Plus': { color: '#113ccf', url: 'https://disneyplus.com' },
  'Amazon Prime Video': { color: '#00a8e1', url: 'https://primevideo.com' },
  'HBO Max': { color: '#b535f6', url: 'https://max.com' },
  'HIDIVE': { color: '#00baff', url: 'https://hidive.com' },
}

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isInWatchlist, toggleWatchlist } = useWatchlist()

  const [anime, setAnime] = useState(null)
  const [videos, setVideos] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setAnime(null)
    setVideos(null)
    setRecommendations([])

    const load = async () => {
      try {
        const data = await fetchAnimeById(id)
        setAnime(data)

        // Load videos and recommendations after a delay (rate limiting)
        setTimeout(async () => {
          try {
            const vids = await fetchAnimeVideos(id)
            setVideos(vids)
          } catch {}
        }, 500)

        setTimeout(async () => {
          try {
            const recs = await fetchAnimeRecommendations(id)
            setRecommendations(recs?.slice(0, 10) || [])
          } catch {}
        }, 1200)
      } catch (err) {
        console.error('Failed to load anime:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleShare = async () => {
    const shareData = {
      title: anime?.title || '4Aura',
      text: `Check out ${anime?.title} on 4Aura!`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch {}
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
        <button onClick={() => navigate('/')} className="mt-4 text-violet hover:underline">Go home</button>
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
      transition={{ duration: 0.3 }}
      className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
        id="back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero section */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
        {/* Poster */}
        <div className="w-full md:w-72 lg:w-80 shrink-0">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/40">
            <img src={imgSrc} alt={anime.title} className="w-full aspect-[3/4] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => toggleWatchlist(anime)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                inList
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-violet text-white hover:bg-violet/80'
              }`}
              id="detail-watchlist-btn"
            >
              <Heart className={`w-4 h-4 ${inList ? 'fill-current' : ''}`} />
              {inList ? 'In My List' : 'Add to List'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-xl bg-surface border border-border text-neutral-300 hover:text-white hover:border-violet/40 transition-all duration-300"
              id="share-btn"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title & status */}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight" id="detail-title">
              {anime.title}
            </h1>
            <StatusBadge status={anime.status} />
          </div>

          {anime.title_english && anime.title_english !== anime.title && (
            <p className="text-sm text-neutral-400 mt-1">{anime.title_english}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-neutral-400">
            {anime.score && (
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <Star className="w-4 h-4 fill-yellow-400" />{anime.score}
              </span>
            )}
            {anime.scored_by && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />{(anime.scored_by / 1000).toFixed(0)}K reviews
              </span>
            )}
            {anime.type && (
              <span className="flex items-center gap-1">
                <Tv className="w-4 h-4" />{anime.type}
              </span>
            )}
            {anime.episodes && (
              <span className="flex items-center gap-1">
                <Play className="w-4 h-4" />{anime.episodes} episodes
              </span>
            )}
            {anime.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />{anime.duration}
              </span>
            )}
            {anime.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{anime.year}
              </span>
            )}
          </div>

          {/* Studios */}
          {anime.studios?.length > 0 && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Building2 className="w-4 h-4 text-violet" />
              <span className="text-neutral-400">Studio:</span>
              <span className="text-white font-medium">{anime.studios.map(s => s.name).join(', ')}</span>
            </div>
          )}

          {/* Genre pills */}
          {anime.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4" id="genre-tags">
              {anime.genres.map(g => (
                <Link
                  key={g.mal_id}
                  to={`/?genre=${g.mal_id}&genreName=${encodeURIComponent(g.name)}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet/15 text-violet border border-violet/20 hover:bg-violet/25 hover:border-violet/40 transition-all duration-300"
                >
                  {g.name}
                </Link>
              ))}
              {anime.themes?.map(t => (
                <Link
                  key={`theme-${t.mal_id}`}
                  to={`/?genre=${t.mal_id}&genreName=${encodeURIComponent(t.name)}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald/15 text-emerald border border-emerald/20 hover:bg-emerald/25 hover:border-emerald/40 transition-all duration-300"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          )}

          {/* About / Description */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-3">About</h2>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {anime.synopsis || 'No description available.'}
            </p>
          </div>

          {/* Background */}
          {anime.background && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white mb-3">Background</h2>
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{anime.background}</p>
            </div>
          )}

          {/* Where to Watch */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-3">Where to Watch</h2>
            <div className="flex flex-wrap gap-2">
              {streamingLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: link.color + '20', borderColor: link.color + '40', border: '1px solid' }}
                  id={`stream-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span style={{ color: link.color }}>{link.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Themes (Openings & Endings) - Media Stack */}
      {themeVideos.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Themes</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
            {themeVideos.map((v, i) => (
              <div key={i} className="shrink-0 w-80 rounded-xl overflow-hidden bg-surface border border-border">
                {v.video?.youtube_id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.video.youtube_id}`}
                    title={v.title || 'Theme'}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-video bg-surface flex items-center justify-center text-neutral-500 text-sm">
                    No video
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                  <p className="text-xs text-violet mt-1">{v.meta?.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text-based themes as fallback */}
      {themeVideos.length === 0 && (anime.theme?.openings?.length > 0 || anime.theme?.endings?.length > 0) && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Themes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {anime.theme?.openings?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-violet mb-2">Openings</h3>
                <div className="space-y-2">
                  {anime.theme.openings.map((op, i) => (
                    <p key={i} className="text-sm text-neutral-300 bg-surface px-3 py-2 rounded-lg border border-border">{op}</p>
                  ))}
                </div>
              </div>
            )}
            {anime.theme?.endings?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-emerald mb-2">Endings</h3>
                <div className="space-y-2">
                  {anime.theme.endings.map((ed, i) => (
                    <p key={i} className="text-sm text-neutral-300 bg-surface px-3 py-2 rounded-lg border border-border">{ed}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {recommendations.map((rec, i) => (
              <AnimeCard key={rec.entry?.mal_id} anime={rec.entry} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
