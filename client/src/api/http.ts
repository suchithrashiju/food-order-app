export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  // Empty base uses the Vite `/api` proxy in development.
  return ''
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new ApiError('Unable to reach the server. Check that the API is running.', 0)
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : `Request failed with status ${response.status}`

    throw new ApiError(message, response.status)
  }

  return payload as T
}
