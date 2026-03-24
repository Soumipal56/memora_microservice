import { useState, useRef } from 'react'
import Header     from './components/Header'
import StatsBar   from './components/StatsBar'
import GraphCanvas from './components/GraphCanvas'
import NodeDetail  from './components/NodeDetail'
import SavedView   from './components/SavedView'
import SearchView  from './components/SearchView'
import EmptyState  from './components/EmptyState'
import Toast       from './components/Toast'
import { useGraph } from './hooks/useGraph'
import { useToast } from './hooks/useToast'
import { isOldNode } from './utils/constants'

export default function App() {
  const { nodes, edges, loading, progress, ingest, clearAll } = useGraph()
  const { toast, show } = useToast()
  const [view, setView]           = useState('graph') // 'graph' | 'saved' | 'search'
  const [selectedNode, setSelected] = useState(null)
  const inputRef = useRef(null)

  // Decorative stars (stable array)
  const stars = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    size:  (((i * 7) % 3) + 1),
    top:   ((i * 37) % 100),
    left:  ((i * 53) % 100),
    opacity: 0.2 + ((i * 11) % 6) / 10,
    dur:   2 + ((i * 3) % 3),
    delay: ((i * 7) % 30) / 10,
  }))

  const handleIngest = async (url) => {
    try {
      const node = await ingest(url)
      setSelected(node)
      setView('graph')
      show(`✨ "${node.title}" saved!`)
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const handleClearAll = async () => {
    await clearAll()
    setSelected(null)
    show('All nodes cleared')
  }

  const handleNodeClick = (node) => {
    setSelected(node)
    setView('graph')
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

      {/* Header */}
      <Header
        onIngest={handleIngest}
        loading={loading}
        progress={progress}
        onToggleSaved={() => setView(v => v === 'saved'  ? 'graph' : 'saved')}
        onToggleSearch={() => setView(v => v === 'search' ? 'graph' : 'search')}
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
        nodes={nodes} edges={edges}
        onClearAll={handleClearAll}
        onGraphView={() => setView('graph')}
        view={view}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* Graph */}
        {view === 'graph' && (
          <div style={{ flex: 1, position: 'relative' }}>
            {nodes.length === 0
              ? <EmptyState onFocus={() => document.querySelector('input')?.focus()} />
              : <GraphCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodeClick={setSelected}
                  selectedNode={selectedNode}
                />
            }
          </div>
        )}

        {/* Saved */}
        {view === 'saved' && (
          <SavedView nodes={nodes} onNodeClick={handleNodeClick} />
        )}

        {/* Search */}
        {view === 'search' && (
          <SearchView nodes={nodes} onNodeClick={handleNodeClick} />
        )}

        {/* Node detail panel (only in graph view) */}
        {view === 'graph' && selectedNode && (
          <NodeDetail
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onClose={() => setSelected(null)}
            onRelatedClick={setSelected}
          />
        )}
      </div>

      {/* Resurfacing banner */}
      {resurfaceNodes.length > 0 && view === 'graph' && (
        <div
          onClick={() => setSelected(resurfaceNodes[0])}
          style={{
            position: 'fixed', bottom: 20, left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg,rgba(245,158,11,0.95),rgba(251,191,36,0.95))',
            backdropFilter: 'blur(10px)',
            borderRadius: 16, padding: '10px 24px',
            color: '#1a0a2e', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', zIndex: 200,
            boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        >
          🔔 {resurfaceNodes.length} memor{resurfaceNodes.length === 1 ? 'y' : 'ies'} to resurface — click to review
        </div>
      )}
    </div>
  )
}
