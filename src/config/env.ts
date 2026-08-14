const deriveApiHost = (): string | undefined => {
  const { host } = location
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return undefined
  const parts = host.split('.')
  const tld = parts.pop()
  const domain = parts.pop()
  if (!tld || !domain) return undefined
  return `api.${domain}.${tld}`
}

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) return envUrl as string

  const apiHost = deriveApiHost()
  if (apiHost) return `https://${apiHost}`

  return ''
}
