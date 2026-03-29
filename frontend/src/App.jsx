import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import GraphCanvas from './components/GraphCanvas'
import NodeDetail from './components/NodeDetail'
import SavedView from './components/SavedView'
import SearchView from './components/SearchView'
import EmptyState from './components/EmptyState'
import Toast from './components/Toast'
import AuthOverlay from './components/AuthOverlay'
import HowToUse from './components/HowToUse'
import { useGraph } from './hooks/useGraph'
import { useToast } from './hooks/useToast'
import { isOldNode } from './utils/constants'
import { useMediaQuery } from './hooks/useMediaQuery'

export default function App() {
  const { nodes, edges, loading, progress, ingest, ingestFile, clearAll, deleteNode } = useGraph()
  const { toast, show } = useToast()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [view, setView] = useState('graph') // 'graph' | 'saved' | 'search' | 'howto'
  const [selectedNode, setSelected] = useState(null)
  const [timeFilter, setTimeFilter] = useState(0) // 0: All, 1: 1d, 7: 7d, 30: 30d
  const inputRef = useRef(null)

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('memora_token'))
  const [showAuth, setShowAuth] = useState(false)

  // Keep-alive ping every 14 minutes to prevent Render free tier from sleeping.
  // Note: This only works while the user has the Memora tab open!
  useEffect(() => {
    const interval = setInterval(() => {
      // Ping the FastAPI health endpoint directly
      fetch('/health').catch(() => { });
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for onboarding show flag on mount (persists across reload after signup)
  useEffect(() => {
    if (localStorage.getItem('memora_show_howto')) {
      setView('howto')
      localStorage.removeItem('memora_show_howto')
    }
  }, []);

  // Decorative stars (stable array)
  const stars = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    size: (((i * 7) % 3) + 1),
    top: ((i * 37) % 100),
    left: ((i * 53) % 100),
    opacity: 0.2 + ((i * 11) % 6) / 10,
    dur: 2 + ((i * 3) % 3),
    delay: ((i * 7) % 30) / 10,
  }))

  // Time Filtering Logic
  const filteredNodes = nodes.filter(node => {
    if (timeFilter === 0) return true
    if (!node.createdAt) return true // Keep legacy nodes
    const ageInDays = (Date.now() - new Date(node.createdAt)) / (1000 * 60 * 60 * 24)
    return ageInDays <= timeFilter
  })

  const filteredEdges = edges.filter(edge => {
    return filteredNodes.some(n => n.id === edge.source) && 
           filteredNodes.some(n => n.id === edge.target)
  })

  const handleIngest = async (url) => {
    if (!isAuthenticated) {
      setShowAuth(true)
      return
    }
    try {
      const node = await ingest(url)
      setSelected(node)
      setView('graph')
      show(`✨ "${node.title}" saved!`)
    } catch (e) {
      if (e.message.includes('401')) {
        localStorage.removeItem('memora_token')
        setIsAuthenticated(false)
        setShowAuth(true)
      } else {
        show(e.message, 'error')
      }
    }
  }

  const handleIngestFile = async (file) => {
    if (!isAuthenticated) {
      setShowAuth(true)
      return
    }
    try {
      const node = await ingestFile(file)
      setSelected(node)
      setView('graph')
      show(`✨ "${node.title}" extracted and saved!`)
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const handleClearAll = async () => {
    if (!isAuthenticated) return setShowAuth(true)
    await clearAll()
    setSelected(null)
    show('All nodes cleared')
  }

  const handleNodeClick = (node) => {
    setSelected(node)
  }

  const handleDeleteNode = async (nodeId) => {
    if (!isAuthenticated) return setShowAuth(true)
    const success = await deleteNode(nodeId)
    if (success) {
      setSelected(null)
      show('Memory deleted')
    }
  }

  const resurfaceNodes = nodes.filter(n => isOldNode(n.createdAt))

  return (
    <div style={{
      height: '100vh', width: '100vw', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#0d0221 0%,#1a0a3d 45%,#0d1a2e 100%)',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      color: '#fff', position: 'relative',
    }}>

      {/* Stars */}
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 0,
          width: s.size, height: s.size, borderRadius: '50%',
          background: '#fff', opacity: s.opacity,
          top: `${s.top}%`, left: `${s.left}%`,
          animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}

      <Toast toast={toast} />

      {showAuth && (
        <AuthOverlay onSuccess={() => {
          setIsAuthenticated(true)
          setShowAuth(false)
          window.location.reload() // reload graph data fully
        }} />
      )}

      {/* Header */}
      <Header
        onIngest={handleIngest}
        onIngestFile={handleIngestFile}
        loading={loading}
        progress={progress}
        onToggleSaved={() => setView(v => v === 'saved' ? 'graph' : 'saved')}
        onToggleSearch={() => setView(v => v === 'search' ? 'graph' : 'search')}
        onToggleHowTo={() => setView(v => v === 'howto' ? 'graph' : 'howto')}
        savedCount={nodes.filter(n => !n.parentId).length}
        view={view}
      />

      {/* Marquee */}
      <div style={{
        background: 'linear-gradient(135deg,#ff6eb4,#ec4899)',
        padding: '5px 0', overflow: 'hidden',
        position: 'relative', zIndex: 99, flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 40, whiteSpace: 'nowrap',
          animation: 'marquee 22s linear infinite', width: '200%',
        }}>
          {[0, 1, 2, 3].map(i => (
            <span key={i} style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: 'rgba(255,255,255,0.9)' }}>
              ✦ TURNING EVERYDAY MOMENTS INTO KNOWLEDGE ✦ EXPLORE YOUR GRAPH ✦ SEMANTIC SEARCH ✦ AI TAGGING ✦ MEMORY RESURFACING &nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatsBar
        nodes={filteredNodes} 
        edges={filteredEdges}
        onClearAll={handleClearAll}
        onGraphView={() => setView('graph')}
        view={view}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Graph */}
        {view === 'graph' && (
          <div style={{ flex: 1, position: 'relative' }}>
            {filteredNodes.length === 0
              ? <EmptyState onFocus={() => isAuthenticated ? document.querySelector('input')?.focus() : setShowAuth(true)} />
              : <GraphCanvas
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodeClick={setSelected}
                selectedNode={selectedNode}
              />
            }
          </div>
        )}

        {/* Saved */}
        {view === 'saved' && (
          <SavedView
            nodes={filteredNodes}
            onNodeClick={handleNodeClick}
            onBack={() => setView('graph')}
            onDelete={handleDeleteNode}
            showToast={show}
          />
        )}

        {/* Search */}
        {view === 'search' && (
          <SearchView
            nodes={filteredNodes}
            onNodeClick={handleNodeClick}
            onBack={() => setView('graph')}
            showToast={show}
          />
        )}

        {/* How to use */}
        {view === 'howto' && (
          <HowToUse onGetStarted={() => setView('graph')} />
        )}

        {/* Node detail panel (available in all views) */}
        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onClose={() => setSelected(null)}
            onRelatedClick={setSelected}
            onDelete={handleDeleteNode}
          />
        )}
      </div>

      {/* Resurfacing banner */}
      {resurfaceNodes.length > 0 && view === 'graph' && (
        <div
          onClick={() => setSelected(resurfaceNodes[0])}
          style={{
            position: 'fixed',
            bottom: isMobile ? 16 : 20,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'calc(100vw - 32px)',
            width: 'max-content',
            background: 'linear-gradient(135deg,rgba(245,158,11,0.95),rgba(251,191,36,0.95))',
            backdropFilter: 'blur(10px)',
            borderRadius: 16, padding: isMobile ? '10px 18px' : '10px 24px',
            color: '#1a0a2e', fontSize: isMobile ? 12 : 13, fontWeight: 800,
            cursor: 'pointer', zIndex: 200,
            boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
            animation: 'pulse 2.5s ease-in-out infinite',
            textAlign: 'center',
          }}
        >
          🔔 {resurfaceNodes.length} memor{resurfaceNodes.length === 1 ? 'y' : 'ies'} to resurface — click to review
        </div>
      )}
    </div>
  )
}
