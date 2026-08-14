import { getApiBaseUrl } from '../config/env'

export const resolveAssetUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('/images/')
  )
    return path
  const base = getApiBaseUrl()
  if (base && base !== '/')
    return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
  return path
}
