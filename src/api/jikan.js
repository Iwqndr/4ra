const JIKAN_BASE = 'https://api.jikan.moe/v4'

// Rate-limiter: Jikan has a 3 req/s limit
let lastCall = 0
async function rateLimitedFetch(url) {
  const now = Date.now()
  const diff = now - lastCall
  if (diff < 400) {
    await new Promise(r => setTimeout(r, 400 - diff))
  }
  lastCall = Date.now()
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jikan error: ${res.status}`)
  return res.json()
}

export async function fetchTopAnime(page = 1, filter = 'bypopularity') {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/top/anime?page=${page}&filter=${filter}&limit=25`
  )
  return { anime: data.data, pagination: data.pagination }
}

export async function searchAnime(query, page = 1) {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=25&sfw=true`
  )
  return { anime: data.data, pagination: data.pagination }
}

export async function fetchAnimeByGenre(genreId, page = 1) {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/anime?genres=${genreId}&page=${page}&limit=25&order_by=score&sort=desc&sfw=true`
  )
  return { anime: data.data, pagination: data.pagination }
}

export async function fetchAnimeById(id) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/anime/${id}/full`)
  return data.data
}

export async function fetchAnimeVideos(id) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/anime/${id}/videos`)
  return data.data
}

export async function fetchAnimeRecommendations(id) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/anime/${id}/recommendations`)
  return data.data
}

export async function fetchSeasonNow(page = 1) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/seasons/now?page=${page}&limit=25`)
  return { anime: data.data, pagination: data.pagination }
}

export async function fetchAnimeByIds(ids) {
  const results = []
  for (const id of ids) {
    try {
      const anime = await fetchAnimeById(id)
      if (anime) results.push(anime)
    } catch {
      // skip failed lookups
    }
  }
  return results
}

export async function searchAnimeByTitle(title) {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/anime?q=${encodeURIComponent(title)}&limit=1&sfw=true`
  )
  return data.data?.[0] || null
}
