import axios, { AxiosError, type AxiosInstance } from 'axios'
import { toast } from 'sonner'

const baseURL = import.meta.env.VITE_API_URL?.trim()
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : ''

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodorder_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'

    // Let feature screens handle common expected failures without toast spam.
    if (status !== 401 && status !== 404) {
      toast.error(message)
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
