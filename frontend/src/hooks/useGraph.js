import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

export function useGraph() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState(null)

  // Load graph on mount
  useEffect(() => {
    loadGraph()
  }, [])

  const loadGraph = useCallback(async () => {
    try {
      const data = await api.getGraph()
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (e) {
      console.error('[graph] Failed to load:', e)
    }
  }, [])

  const ingest = useCallback(async (url) => {
    setLoading(true)
    setError(null)
    setProgress('Extracting content…')
    try {
      setProgress('Running AI analysis…')
      const result = await api.ingest(url)
      setProgress('Building knowledge graph…')

      const newNodes = result.all_nodes || [result.node]
      const newEdges = []

      // Build edges between the new nodes (parent → child)
      if (newNodes.length > 1) {
        const parent = newNodes[0]
        newNodes.slice(1).forEach(child => {
          newEdges.push({ source: parent.id, target: child.id })
        })
      }

      setNodes(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const fresh = newNodes.filter(n => !existingIds.has(n.id))
        return [...prev, ...fresh]
      })
      setEdges(prev => [...prev, ...newEdges])

      return result.node
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await api.clearAll()
      setNodes([])
      setEdges([])
    } catch (e) {
      setError(e.message)
    }
  }, [])

  return { nodes, edges, loading, progress, error, ingest, clearAll, reload: loadGraph }
}
