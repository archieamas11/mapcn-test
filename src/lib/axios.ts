import axios from 'axios'

const API_BASE_URL
  = (import.meta.env.VITE_API_BASE_URL as string | undefined)
    ?? 'http://localhost/mapcn_db'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})
