import { addLog } from '../utils/logger'

const ANILIST_URL = 'https://graphql.anilist.co'

const MEDIA_FIELDS = `
  id
  idMal
  isAdult
  title { romaji english native }
  coverImage { large extraLarge }
  bannerImage
  description
  episodes
  status
  format
  genres
  averageScore
  season
  seasonYear
  studios(isMain: true) {
    nodes { name }
  }
`

function mapAniListResult(ani) {
  if (!ani) return null;
  const imageUrl = ani.coverImage?.extraLarge || ani.coverImage?.large || '';
  return {
    ...ani,
    mal_id: ani.idMal || ani.id,
    images: { 
      jpg: { 
        large_image_url: imageUrl,
        medium_image_url: imageUrl,
        small_image_url: imageUrl
      },
      webp: { 
        large_image_url: imageUrl,
        medium_image_url: imageUrl,
        small_image_url: imageUrl
      }
    },
    title: ani.title?.english || ani.title?.romaji || ani.title?.native || 'Unknown Title',
    score: ani.averageScore ? (ani.averageScore / 10).toFixed(1) : 'N/A',
    synopsis: ani.description || '',
    year: ani.seasonYear,
    studio: ani.studios?.nodes?.[0]?.name || '',
    type: ani.format
  }
}

/**
 * Fetches real-time trending anime from AniList.
 */
export async function fetchTrendingAnime(perPage = 10) {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(sort: [TRENDING_DESC, POPULARITY_DESC], type: ANIME, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { perPage } }),
    });
    const result = await response.json();
    return result.data?.Page?.media?.map(mapAniListResult) || [];
  } catch (error) {
    console.error('[AniList] Trending Fetch Failure:', error);
    return [];
  }
}

/**
 * LITE VERSION: Fetches anime details by searching for titles in a single batch.
 * Modified to support CHUNKING for high volume (e.g. 75 results).
 */
export async function fetchAnimeDetailsBatch(titles = [], nsfwFilter = true) {
  if (!titles || titles.length === 0) return [];

  const startTime = performance.now();
  
  // Split into smaller chunks (10) to avoid AniList complexity limits
  const CHUNK_SIZE = 10;
  const chunks = [];
  for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
    chunks.push(titles.slice(i, i + CHUNK_SIZE));
  }

  console.log(`[AniList] Fetching ${titles.length} titles in ${chunks.length} parallel chunks...`);

  const results = [];
  const seenIds = new Set();
  let completedChunks = 0;

  const fetchChunk = async (chunk, chunkIdx) => {
    const query = `
      query (${chunk.map((_, i) => `$t${i}: String`).join(', ')}${nsfwFilter ? ', $isAdult: Boolean' : ''}) {
        ${chunk.map((_, i) => `s${i}: Media (search: $t${i}, type: ANIME${nsfwFilter ? ', isAdult: $isAdult' : ''}) { ${MEDIA_FIELDS} }`).join('\n')}
      }
    `;
    const variables = {};
    chunk.forEach((t, i) => variables[`t${i}`] = t);
    if (nsfwFilter) variables.isAdult = false;

    try {
      const resp = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const data = await resp.json();
      
      if (data.errors) {
        console.warn(`[AniList] Chunk ${chunkIdx} encountered errors:`, data.errors);
      }

      if (data.data) {
        let chunkFound = 0;
        Object.values(data.data).filter(Boolean).forEach(ani => {
          const mapped = mapAniListResult(ani);
          if (mapped && !seenIds.has(mapped.mal_id)) {
            results.push(mapped);
            seenIds.add(mapped.mal_id);
            chunkFound++;
          }
        });
        completedChunks++;
        console.log(`[AniList] Chunk ${chunkIdx} done. Found ${chunkFound} matches. (Total: ${results.length})`);
      }
    } catch (e) {
      console.error(`[AniList] Chunk ${chunkIdx} failed severely:`, e.message);
    }
  };

  try {
    // Fetch all chunks in parallel
    await Promise.all(chunks.map((c, i) => fetchChunk(c, i)));
    
    const latency = performance.now() - startTime;
    addLog({
      type: 'info',
      apiType: 'anilist',
      prompt: `Syncing metadata for ${titles.length} titles`,
      latency,
      status: 'success'
    });
  } catch (err) {
    const latency = performance.now() - startTime;
    addLog({
      type: 'error',
      apiType: 'anilist',
      prompt: `Batch sync failed`,
      latency,
      status: 'error',
      error: err.message
    });
  }

  console.log(`[AniList] Batch Sync complete. Found ${results.length} unique anime.`);
  return results;
}

/**
 * Character voice actor search
 */
export async function fetchCharacterVoiceActors(idMal, charName) {
  const query = `
    query ($idMal: Int, $charName: String) {
      Media (idMal: $idMal, type: ANIME) {
        id
        idMal
        isAdult
        characters (search: $charName, page: 1, perPage: 1) {
          edges {
            node {
              id
              name { full native }
              image { large }
              description
              siteUrl
            }
            voiceActors {
              id
              name { full }
              image { large }
              languageV2
            }
          }
        }
      }
    }
  `
  try {
    const res = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: parseInt(idMal), charName } }),
    })
    const data = await res.json()
    const charEdge = data.data?.Media?.characters?.edges?.[0]
    return charEdge ? { character: charEdge.node, voiceActors: charEdge.voiceActors } : null
  } catch {
    return null
  }
}
