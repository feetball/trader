import axios from 'axios'

// Use relative path in production, localhost in development
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api'

export const apiClient = axios.create({
  baseURL: API_URL,
})

export default apiClient
