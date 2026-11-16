import { createHash } from 'node:crypto'

// Browser-facing auth page lives on www.last.fm/api,
// JSON API methods live on ws.audioscrobbler.com/2.0.
function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const trimSlash = (url: string) => url.replace(/\/+$/, '')

export const LASTFM_CALLBACK_PATH = '/api/lastfm/callback'

export function lastfmAuthUrl() {
  const params = new URLSearchParams({
    api_key: env('LAST_FM_API_KEY'),
    cb: new URL(LASTFM_CALLBACK_PATH, env('APP_URL')).toString(),
  })
  return `${trimSlash(env('LAST_FM_BASE_API_URL'))}/auth?${params}`
}

// https://www.last.fm/api/authspec#_8-signing-calls
// Params sorted by name, concatenated as <name><value>, shared secret appended.
// `format` and `callback` are excluded from the signature.
function sign(params: Record<string, string>) {
  const base = Object.keys(params)
    .sort()
    .map((key) => key + params[key])
    .join('')
  return createHash('md5')
    .update(base + env('LAST_FM_API_SECRET'), 'utf8')
    .digest('hex')
}

type GetSessionResponse =
  | { session: { name: string; key: string; subscriber: number } }
  | { error: number; message: string }

export async function getLastfmUsername(token: string): Promise<string> {
  const params = { api_key: env('LAST_FM_API_KEY'), method: 'auth.getSession', token }
  const query = new URLSearchParams({
    ...params,
    api_sig: sign(params),
    format: 'json',
  })

  const res = await fetch(`${trimSlash(env('LAST_FM_API_URL'))}/?${query}`, { cache: 'no-store' })
  const data = (await res.json()) as GetSessionResponse

  if ('error' in data) {
    throw new Error(`Last.fm auth.getSession failed (${data.error}): ${data.message}`)
  }
  return data.session.name
}
