const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function api(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const body = response.status === 204 ? null : await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}.`)
  }

  return body
}
