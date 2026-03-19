const JIKAN_BASE = 'https://api.jikan.moe/v4'

// Rate-limiter: Jikan has a 3 req/s limit. We use a promise queue to serialize calls.
let lastCall = 0
let queue = Promise.resolve()

async function rateLimitedFetch(url) {
  return queue = queue.then(async () => {
    const now = Date.now()
    const diff = now - lastCall
    if (diff < 500) { // 500ms safety (2 req/s)
      await new Promise(r => setTimeout(r, 500 - diff))
    }
    
    let res = await fetch(url)
    
    // Simple retry for 429
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 2000))
      res = await fetch(url)
    }

    if (!res.ok) throw new Error(`Jikan error: ${res.status}`)
    lastCall = Date.now()
    return res.json()
  })
}

export async function fetchTopAnime(page = 1, filter = 'bypopularity', type = 'tv', sfw = true) {
  const filterParam = filter ? `&filter=${filter}` : ''
  const typeParam = type ? `&type=${type}` : ''
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/top/anime?page=${page}${filterParam}${typeParam}&limit=25&sfw=${sfw}`
  )
  return { anime: data.data, pagination: data.pagination }
}

export async function searchAnime(query, page = 1, sfw = true) {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=25&sfw=${sfw}&type=tv`
  )
  return { anime: data.data, pagination: data.pagination }
}

export async function fetchAnimeByGenre(genreId, page = 1, sfw = true) {
  const data = await rateLimitedFetch(
    `${JIKAN_BASE}/anime?genres=${genreId}&page=${page}&limit=25&order_by=score&sort=desc&sfw=${sfw}&type=tv`
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

export async function fetchAnimeCharacters(id) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/anime/${id}/characters`)
  return data.data
}

export async function fetchSeasonNow(page = 1, sfw = true) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/seasons/now?page=${page}&limit=25&sfw=${sfw}`)
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

export async function fetchPersonVoices(id) {
  const data = await rateLimitedFetch(`${JIKAN_BASE}/people/${id}/voices`)
  return data.data
}
