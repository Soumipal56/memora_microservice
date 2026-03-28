import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

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
    // Skip if not authenticated to prevent 401 errors on initial load
    if (!localStorage.getItem('memora_token')) return;
    
    try {
      const data = await api.getGraph()
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (e) {
      if (!e.message.includes('401') && !e.message.includes('Not authenticated')) {
        console.error('[graph] Failed to load:', e)
      }
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

  const ingestFile = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setProgress('Parsing PDF locally…')
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ""
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items.map(item => item.str)
        text += strings.join(' ') + '\\n'
      }

      const cleanText = text.trim()
      if (!cleanText) throw new Error("No readable text found in this PDF.")
      if (cleanText.length > 25000) {
        setProgress('PDF is very long, cropping to first 25k chars…')
      }

      setProgress('Converting file for storage…')
      const toBase64 = (f) => new Promise((resolve, reject) => {
        const r = new FileReader()
        r.readAsDataURL(f)
        r.onload = () => resolve(r.result.split(',')[1])
        r.onerror = e => reject(e)
      })
      const base64Pdf = await toBase64(file)

      setProgress('Running AI analysis & building graph…')
      const result = await api.ingestText(file.name, cleanText, base64Pdf)

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

  const deleteNode = useCallback(async (nodeId) => {
    try {
      await api.deleteNode(nodeId)
      setNodes(prev => prev.filter(n => n.id !== nodeId))
      setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId && e.source?.id !== nodeId && e.target?.id !== nodeId))
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }, [])

  return { nodes, edges, loading, progress, error, ingest, ingestFile, clearAll, deleteNode, reload: loadGraph }
}
