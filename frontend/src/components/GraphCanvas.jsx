import { useRef, useEffect, useState } from 'react'
import { getColor, getIcon } from '../utils/constants'

export default function GraphCanvas({ nodes, edges, onNodeClick, selectedNode }) {
  const canvasRef = useRef(null)
  const simRef    = useRef([])
  const animRef   = useRef(null)
  const panRef    = useRef({ x: 0, y: 0 })
  const zoomRef   = useRef(1)
  const isDragging   = useRef(false)
  const lastMouse    = useRef({ x: 0, y: 0 })
  const dragNodeRef  = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)

  // Sync sim nodes when nodes prop changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    simRef.current = nodes.map((n, i) => {
      const existing = simRef.current.find(s => s.id === n.id)
      if (existing) return { ...existing, data: n }
      const angle = (i / nodes.length) * Math.PI * 2
      const r = 130 + Math.random() * 100
      return { id: n.id, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, vx: 0, vy: 0, data: n }
    })
  }, [nodes])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const tick = () => {
      const sim = simRef.current
      const cx  = canvas.width  / 2
      const cy  = canvas.height / 2

      for (let i = 0; i < sim.length; i++) {
        const a = sim[i]
        // Center gravity
        a.vx += (cx - a.x) * 0.003
        a.vy += (cy - a.y) * 0.003
        // Repulsion
        for (let j = i + 1; j < sim.length; j++) {
          const b = sim[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const f = 3200 / (dist * dist)
          a.vx += (dx / dist) * f; a.vy += (dy / dist) * f
          b.vx -= (dx / dist) * f; b.vy -= (dy / dist) * f
        }
        // Edge springs
        edges.forEach(e => {
          const src = sim.find(n => n.id === e.source)
          const tgt = sim.find(n => n.id === e.target)
          if (!src || !tgt) return
          const dx = tgt.x - src.x, dy = tgt.y - src.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const f = (dist - 160) * 0.01
          src.vx += (dx / dist) * f; src.vy += (dy / dist) * f
          tgt.vx -= (dx / dist) * f; tgt.vy -= (dy / dist) * f
        })
      }

      for (const node of sim) {
        node.vx *= 0.85; node.vy *= 0.85
        node.x  += node.vx; node.y += node.vy
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(panRef.current.x, panRef.current.y)
      ctx.scale(zoomRef.current, zoomRef.current)

      // Edges
      edges.forEach(e => {
        const src = sim.find(n => n.id === e.source)
        const tgt = sim.find(n => n.id === e.target)
        if (!src || !tgt) return
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.lineTo(tgt.x, tgt.y)
        ctx.strokeStyle = 'rgba(255,182,193,0.25)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      })

      // Nodes
      sim.forEach(node => {
        const isSel  = selectedNode?.id === node.id
        const isHov  = hoveredId === node.id
        const color  = getColor(node.data.type)
        const r      = isSel ? 24 : isHov ? 19 : 14

        // Glow ring
        if (isSel || isHov) {
          const grd = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 14)
          grd.addColorStop(0, color + '55')
          grd.addColorStop(1, color + '00')
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 14, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        // Circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = isSel ? '#fff' : color + '99'
        ctx.lineWidth = isSel ? 2.5 : 1
        ctx.stroke()

        // Icon
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.floor(r * 0.85)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(getIcon(node.data.type), node.x, node.y)

        // Label
        if (isSel || isHov || sim.length <= 6) {
          const label = node.data.title?.length > 22
            ? node.data.title.slice(0, 20) + '…'
            : node.data.title || ''
          ctx.font = 'bold 11px Nunito, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const tw = ctx.measureText(label).width
          ctx.fillStyle = 'rgba(10,2,30,0.85)'
          ctx.beginPath()
          ctx.roundRect(node.x - tw / 2 - 5, node.y + r + 3, tw + 10, 17, 4)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.fillText(label, node.x, node.y + r + 5)
        }
      })

      ctx.restore()
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, edges, selectedNode, hoveredId])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    return () => ro.disconnect()
  }, [])

  const getNodeAt = (x, y) => {
    const wx = (x - panRef.current.x) / zoomRef.current
    const wy = (y - panRef.current.y) / zoomRef.current
    return simRef.current.find(n => {
      const dx = wx - n.x, dy = wy - n.y
      return Math.sqrt(dx * dx + dy * dy) < 24
    })
  }

  const onMouseMove = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    if (dragNodeRef.current) {
      dragNodeRef.current.x = (x - panRef.current.x) / zoomRef.current
      dragNodeRef.current.y = (y - panRef.current.y) / zoomRef.current
      dragNodeRef.current.vx = dragNodeRef.current.vy = 0
      return
    }
    if (isDragging.current) {
      panRef.current.x += x - lastMouse.current.x
      panRef.current.y += y - lastMouse.current.y
      lastMouse.current = { x, y }
      return
    }
    const node = getNodeAt(x, y)
    setHoveredId(node?.id || null)
    canvasRef.current.style.cursor = node ? 'pointer' : 'grab'
  }

  const onMouseDown = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const node = getNodeAt(x, y)
    if (node) { dragNodeRef.current = node }
    else { isDragging.current = true; lastMouse.current = { x, y } }
  }

  const onMouseUp = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    if (dragNodeRef.current) {
      const node = getNodeAt(x, y)
      if (node) onNodeClick(node.data)
      dragNodeRef.current = null
    }
    isDragging.current = false
  }

  const onWheel = e => {
    e.preventDefault()
    zoomRef.current = Math.min(3, Math.max(0.25, zoomRef.current - e.deltaY * 0.001))
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
    />
  )
}
