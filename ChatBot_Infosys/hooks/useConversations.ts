'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ConversationItem {
  id: string
  title: string
  created_at: string
  message_count: number
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch {
      // Backend may be offline initially
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createConversation = useCallback(async (title = 'New Chat') => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const data = await res.json()
        setActiveId(data.id)
        fetchConversations()
        return data.id
      }
    } catch {
      // Fallback local ID if offline
      const localId = `local-${Date.now()}`
      setActiveId(localId)
      return localId
    }
  }, [fetchConversations])

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) {
        setActiveId(null)
      }
    } catch {
      // Ignore network failure on delete
    }
  }, [activeId])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    refreshConversations: fetchConversations,
    isLoading,
  }
}
