const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function getAIRecommendations(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key not configured. Set VITE_GROQ_API_KEY in your .env file.')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an anime recommendation engine. Given a user's description of what they want to watch, respond ONLY with a valid JSON array of anime titles. No explanations, no markdown, just the JSON array. Example: ["Clannad", "Your Lie in April", "Anohana"]. Return between 5 and 12 titles that best match the user's request. Use the most commonly known English or Romaji titles.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error?.message || `Groq API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content?.trim()

  try {
    const titles = JSON.parse(content)
    if (!Array.isArray(titles)) throw new Error('Not an array')
    return titles.filter(t => typeof t === 'string')
  } catch {
    // Try to extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/)
    if (match) {
      return JSON.parse(match[0]).filter(t => typeof t === 'string')
    }
    throw new Error('Failed to parse AI response')
  }
}
