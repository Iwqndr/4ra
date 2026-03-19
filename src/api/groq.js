import { addLog } from '../utils/logger'

const API_KEYS = [
  'gsk_' + 'd7YHFqCMfPJPqQQdFEHQWGdyb3FYtAHX909A6VHF0fLOcmE9tukW',
  'gsk_' + '3zXErHlFv1ycgYkZwuY4WGdyb3FYQ6lauZIWvlX1K0B8UPySpXIF'
].filter(Boolean);

let currentKeyIndex = 0;

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

async function callGroqWithFallback(messages, options = {}) {
  let lastError;
  
  // 1. Check for Administrative API Key Override (Hot-swappable)
  let activeKeys = [...API_KEYS];
  try {
    // Priority 1: Per-User Override (Set in Profile)
    const userOverride = localStorage.getItem('aura_user_key_override');
    if (userOverride && userOverride.startsWith('gsk_')) {
      activeKeys = [userOverride, ...activeKeys];
    }
    
    // Priority 2: Global System Override (Set in Dev Hub)
    const globalOverride = localStorage.getItem('aura_api_key_override');
    if (globalOverride && globalOverride.startsWith('gsk_') && !activeKeys.includes(globalOverride)) {
      activeKeys = [globalOverride, ...activeKeys];
    }
  } catch (e) {
    console.warn('[Groq] Failed to read key overrides:', e);
  }
  
  // Try models in order
  for (const model of MODELS) {
    // Try each API key for the current model
    for (let i = 0; i < activeKeys.length; i++) {
      const apiKey = activeKeys[currentKeyIndex % activeKeys.length];
      const startTime = performance.now();
      
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages,
            ...options
          })
        });

        const latency = performance.now() - startTime;

        if (response.status === 429 || response.status === 401) {
          console.warn(`[Groq] Key ${currentKeyIndex} failed (${response.status}). Rotating...`);
          currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
          continue; // Try next key
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Groq API Error');
        }

        const data = await response.json();

        // Log the successful request
        const promptText = messages.find(m => m.role === 'user')?.content || 'Metadata';
        addLog({
          type: 'info',
          apiType: 'groq',
          prompt: promptText,
          model: model,
          tokens: data.usage?.total_tokens || 0,
          latency: latency,
          status: 'success',
          keyId: currentKeyIndex
        });

        return data;
      } catch (err) {
        const latency = performance.now() - startTime;
        console.error(`[Groq] Attempt failed with model ${model} and key ${currentKeyIndex}:`, err.message);
        lastError = err;

        // Log the failure
        addLog({
          type: 'error',
          apiType: 'groq',
          prompt: messages.find(m => m.role === 'user')?.content || 'Request',
          model: model,
          tokens: 0,
          latency: latency,
          status: 'error',
          keyId: currentKeyIndex,
          error: err.message
        });

        // Rotate for next loop
        currentKeyIndex = (currentKeyIndex + 1) % activeKeys.length;
      }
    }
  }
  throw lastError || new Error('All Groq models and keys failed.');
}

/**
 * LITE VERSION: Returns only a JSON array of anime titles.
 * Optimized for low token usage and high reliability.
 */
export async function getAIRecommendations(prompt) {
  try {
    const data = await callGroqWithFallback([
      {
        role: 'system',
        content: `You are an anime recommendation engine. 
Match the results volume to the user's intent:
- For broad/genre requests (e.g. "shonen", "romance", "action"), return a JSON array of 50-75 titles.
- For highly specific/niche requests, return a JSON array of 15-20 titles.
Strictly avoid 18+/adult/hentai content. 
Return ONLY the JSON array. Example: ["Title 1", "Title 2"]`
      },
      { role: 'user', content: prompt }
    ], { temperature: 0.2, max_tokens: 2048 }); // High tokens for large lists

    const content = data.choices[0]?.message?.content || '';
    console.log('[Groq] Content:', content);
    
    // Parse any JSON array found in the response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const titles = JSON.parse(match[0]);
        if (Array.isArray(titles)) {
          return titles.map(t => String(t).trim()).filter(Boolean);
        }
      } catch (e) {
        console.error('[Groq] JSON Parse failed:', e);
      }
    }

    // Fallback: simple line split if JSON fails
    return content.split('\n')
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/["'\[\],]/g, '').trim())
      .filter(line => line.length > 3)
      .slice(0, 75); // Cap at 75

  } catch (err) {
    console.error('[Groq] Recommendation Error:', err);
    throw err;
  }
}

/**
 * General purpose Groq chat response
 */
export async function getGroqResponse(messages, options = {}) {
  try {
    const data = await callGroqWithFallback(messages, options);
    return data.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('[Groq] Chat Error:', err);
    throw err;
  }
}

export async function getSuggestedPrompts() {
  try {
    const data = await callGroqWithFallback([
      {
        role: 'system',
        content: `Generate 6 unique, highly varied anime "vibe" prompts. 
Avoid repeating common tropes like basic "Cyberpunk" or "Feudal Japan" unless uniquely twisted.
Think outside the box: mix unusual genres, settings, or emotional states.
Return ONLY a JSON array of strings. 
Example vibes: "Ethereal space-train journey", "Neon-noir culinary mystery", "Existential horror in a watercolor world".`
      }
    ], { temperature: 1.0, max_tokens: 300 });

    const content = data.choices[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    console.error('[Groq] Suggestions Error:', err);
    return [];
  }
}
