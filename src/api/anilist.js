const ANILIST_URL = 'https://graphql.anilist.co'

const CHARACTER_VOICE_ACTORS_QUERY = `
query ($idMal: Int, $charName: String) {
  Media (idMal: $idMal, type: ANIME) {
    id
    characters (search: $charName, page: 1, perPage: 1) {
      edges {
        node {
          id
          name {
            full
            native
          }
          image {
            large
          }
          description
          siteUrl
        }
        voiceActors {
          id
          name {
            full
          }
          image {
            large
          }
          languageV2
        }
      }
    }
  }
}
`

export async function fetchCharacterVoiceActors(idMal, charName) {
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: CHARACTER_VOICE_ACTORS_QUERY,
        variables: { idMal: parseInt(idMal), charName }
      }),
    })

    const result = await response.json()
    if (result.errors) {
      console.error('AniList Error:', result.errors)
      return null
    }

    // Get the first character match
    const charEdge = result.data?.Media?.characters?.edges?.[0]
    if (!charEdge) return null

    return {
      character: charEdge.node,
      voiceActors: charEdge.voiceActors,
    }
  } catch (error) {
    console.error('AniList Fetch Fail:', error)
    return null
  }
}
