import OpenAI from 'openai'

// AI Provider abstraction — swap providers via AI_PROVIDER env var
// Currently supports: openrouter (default)
// Future: openai-direct, anthropic-direct, google-direct

export interface AIProvider {
  client: OpenAI
  model: string
  fastModel: string
  providerName: string
}

let _provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (_provider) return _provider

  const providerName = process.env.AI_PROVIDER ?? 'openrouter'
  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
  const fastModel = process.env.OPENROUTER_FAST_MODEL ?? 'openai/gpt-4o-mini'

  if (providerName === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) throw new Error('Missing OPENROUTER_API_KEY')
    _provider = {
      client: new OpenAI({ apiKey: key, baseURL: 'https://openrouter.ai/api/v1' }),
      model,
      fastModel,
      providerName: `openrouter/${model}`,
    }
  } else {
    throw new Error(`Unknown AI_PROVIDER: ${providerName}`)
  }

  return _provider
}
