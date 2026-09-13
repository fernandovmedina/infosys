'use client'

import { useState, useEffect, useCallback } from 'react'

export interface HealthState {
  status: 'ok' | 'error' | 'loading'
  ollamaConnected: boolean
  modelAvailable: boolean
  chromadbConnected: boolean
  error?: string
}

export function useHealthCheck(pollIntervalMs = 10000): HealthState {
  const [health, setHealth] = useState<HealthState>({
    status: 'loading',
    ollamaConnected: false,
    modelAvailable: false,
    chromadbConnected: false,
  })

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setHealth({
        status: data.status === 'ok' ? 'ok' : 'error',
        ollamaConnected: data.ollama_connected ?? false,
        modelAvailable: data.model_available ?? false,
        chromadbConnected: data.chromadb_connected ?? false,
      })
    } catch (err: any) {
      setHealth({
        status: 'error',
        ollamaConnected: false,
        modelAvailable: false,
        chromadbConnected: false,
        error: err.message || 'Failed to connect to backend',
      })
    }
  }, [])

  useEffect(() => {
    checkHealth()
    const timer = setInterval(checkHealth, pollIntervalMs)
    return () => clearInterval(timer)
  }, [checkHealth, pollIntervalMs])

  return health
}
