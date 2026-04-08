import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowNetwork, FlowEdge, EditorMode } from '../types';

interface Props {
  network: FlowNetwork;
  editorMode: EditorMode;
  selectedVertex: string | null;
  edgeStart: string | null;
  isRunning: boolean;
  showResidual: boolean;
  residualEdges?: FlowEdge[];
  onCanvasClick: (x: number, y: number) => void;
  onVertexClick: (id: string) => void;
  onVertexDrag: (id: string, x: number, y: number) => void;
  onEdgeClick: (id: string) => void;
}

export default function GraphCanvas({
  network,
  editorMode,
  selectedVertex,
  edgeStart,
  isRunning,
  showResidual,
  residualEdges,
  onCanvasClick,
  onVertexClick,
  onVertexDrag,
  onEdgeClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const update = () => {
      if (svgRef.current?.parentElement) {
        const r = svgRef.current.parentElement.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const toSVG = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isRunning && editorMode === 'select') return;
    if (editorMode === 'select' && !isRunning) setDragging(id);
    onVertexClick(id);
  }, [editorMode, isRunning, onVertexClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const c = toSVG(e);
    setMousePos(c);
    if (dragging && !isRunning) onVertexDrag(dragging, c.x, c.y);
  }, [dragging, toSVG, isRunning, onVertexDrag]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
      onCanvasClick(toSVG(e).x, toSVG(e).y);
    }
  }, [toSVG, onCanvasClick]);

  const getEdgeColor = (e: FlowEdge) => {
    if (e.isBottleneck) return { stroke: '#d97706', width: 4, opacity: 1 };
    if (e.onAugPath) return { stroke: '#059669', width: 3.5, opacity: 1 };
    if (e.isSaturated) return { stroke: '#dc2626', width: 2.5, opacity: 0.8 };
    if (e.isResidual) return { stroke: '#64748b', width: 1.5, opacity: 0.5 };
    return { stroke: '#334155', width: 2.5, opacity: 0.7 };
  };

  const getNodeStyle = (v: typeof network.vertices[0]) => {
    if (v.isSource) return { fill: '#7c3aed', text: '#fff', label: 'S' };
    if (v.isSink) return { fill: '#ea580c', text: '#fff', label: 'T' };
    return { fill: '#1e293b', text: '#fff', label: '' };
  };

  // Compute arrow for directed edge
  const edgeWithArrow = (src: typeof network.vertices[0], tgt: typeof network.vertices[0], edge: FlowEdge) => {
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const nx = dx / len;
    const ny = dy / len;
    const r = 28;
    const x1 = src.x + nx * r;
    const y1 = src.y + ny * r;
    const x2 = tgt.x - nx * (r + 10);
    const y2 = tgt.y - ny * (r + 10);
    // Arrowhead
    const ax = tgt.x - nx * r;
    const ay = tgt.y - ny * r;
    const arrowSize = 8;
    const a1x = ax - nx * arrowSize + ny * arrowSize * 0.5;
    const a1y = ay - ny * arrowSize - nx * arrowSize * 0.5;
    const a2x = ax - nx * arrowSize - ny * arrowSize * 0.5;
    const a2y = ay - ny * arrowSize + nx * arrowSize * 0.5;

    // Label position (midpoint, offset perpendicular)
    const mx = (x1 + x2) / 2 - ny * 14;
    const my = (y1 + y2) / 2 + nx * 14;

    return { x1, y1, x2: ax, y2: ay, mx, my, arrow: `M${ax},${ay} L${a1x},${a1y} L${a2x},${a2y} Z`, edge };
  };

  const edgesToRender = showResidual && residualEdges ? residualEdges : network.edges;

  const cursor =
    editorMode === 'add-vertex' ? 'cursor-crosshair' :
    editorMode === 'delete' ? 'cursor-pointer' :
    editorMode === 'add-edge' ? 'cursor-pointer' :
    editorMode === 'set-source' || editorMode === 'set-sink' ? 'cursor-pointer' :
    dragging ? 'cursor-grabbing' : 'cursor-default';

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* White canvas */}
      <div className="absolute inset-3 rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      <svg
        ref={svgRef}
        className={`w-full h-full relative z-10 ${cursor}`}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
        onClick={handleCanvasClick}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
          </filter>
          <filter id="shadow-path" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#059669" floodOpacity="0.3" />
          </filter>
          <filter id="shadow-bottleneck" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#d97706" floodOpacity="0.3" />
          </filter>
        </defs>

        <rect width={dims.w} height={dims.h} fill="transparent" />

        {/* Edge preview while drawing */}
        {edgeStart && editorMode === 'add-edge' && (() => {
          const sv = network.vertices.find(v => v.id === edgeStart);
          if (!sv) return null;
          return <line x1={sv.x} y1={sv.y} x2={mousePos.x} y2={mousePos.y} stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 6" opacity={0.5} />;
        })()}

        {/* Edges */}
        <AnimatePresence>
          {edgesToRender.map(edge => {
            const src = network.vertices.find(v => v.id === edge.source);
            const tgt = network.vertices.find(v => v.id === edge.target);
            if (!src || !tgt) return null;
            const ea = edgeWithArrow(src, tgt, edge);
            if (!ea) return null;
            const style = getEdgeColor(edge);

            return (
              <motion.g key={edge.id + (edge.isResidual ? '-res' : '')}>
                {/* Hit area for clicking */}
                {editorMode === 'delete' && !isRunning && (
                  <line x1={ea.x1} y1={ea.y1} x2={ea.x2} y2={ea.y2}
                    stroke="transparent" strokeWidth={16} className="cursor-pointer"
                    onClick={(ev) => { ev.stopPropagation(); onEdgeClick(edge.id); }}
                  />
                )}

                {/* Augmenting path glow */}
                {edge.onAugPath && (
                  <motion.line
                    initial={{ opacity: 0 }} animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    x1={ea.x1} y1={ea.y1} x2={ea.x2} y2={ea.y2}
                    stroke="#059669" strokeWidth={10} strokeLinecap="round" opacity={0.15}
                  />
                )}

                {/* Main edge */}
                <motion.line
                  x1={ea.x1} y1={ea.y1} x2={ea.x2} y2={ea.y2}
                  stroke={style.stroke} strokeWidth={style.width} strokeLinecap="round"
                  strokeDasharray={edge.isResidual ? '6 4' : undefined}
                  initial={{ opacity: 0 }} animate={{ opacity: style.opacity }}
                  transition={{ duration: 0.4 }}
                  filter={edge.isBottleneck ? 'url(#shadow-bottleneck)' : edge.onAugPath ? 'url(#shadow-path)' : undefined}
                />

                {/* Arrowhead */}
                <path d={ea.arrow} fill={style.stroke} opacity={style.opacity} />

                {/* Capacity / Flow label */}
                <g>
                  <rect x={ea.mx - 22} y={ea.my - 10} width={44} height={20} rx={10}
                    fill={edge.isBottleneck ? '#fef3c7' : edge.onAugPath ? '#d1fae5' : edge.isSaturated ? '#fee2e2' : '#ffffff'}
                    stroke={edge.isBottleneck ? '#f59e0b' : edge.onAugPath ? '#10b981' : edge.isSaturated ? '#f87171' : '#d1d5db'}
                    strokeWidth={1}
                  />
                  <text x={ea.mx} y={ea.my + 1} textAnchor="middle" dominantBaseline="middle"
                    fontFamily="'Fira Code', monospace" fontSize={11} fontWeight={600}
                    fill={edge.isBottleneck ? '#92400e' : edge.onAugPath ? '#065f46' : edge.isSaturated ? '#991b1b' : '#374151'}
                    className="select-none pointer-events-none"
                  >
                    {showResidual && residualEdges ? edge.capacity : `${edge.flow}/${edge.capacity}`}
                  </text>
                </g>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Vertices */}
        <AnimatePresence>
          {network.vertices.map(v => {
            const ns = getNodeStyle(v);
            const isSel = selectedVertex === v.id;
            const isEdgeEnd = edgeStart === v.id;
            const r = 28;

            return (
              <motion.g key={v.id}
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ cursor: isRunning ? 'default' : 'pointer' }}
                onMouseDown={(e) => handleMouseDown(e, v.id)}
              >
                {/* Selection ring */}
                {(isSel || isEdgeEnd) && (
                  <motion.circle cx={v.x} cy={v.y} r={r + 6}
                    fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                  />
                )}

                {/* Source/Sink outer ring */}
                {(v.isSource || v.isSink) && (
                  <circle cx={v.x} cy={v.y} r={r + 4}
                    fill="none" stroke={v.isSource ? '#7c3aed' : '#ea580c'}
                    strokeWidth={2} strokeDasharray="4 4" opacity={0.3}
                  />
                )}

                {/* Main circle */}
                <circle cx={v.x} cy={v.y} r={r} fill={ns.fill} filter="url(#shadow)" />

                {/* Label */}
                <text x={v.x} y={v.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'DM Sans', sans-serif" fill={ns.text}
                  fontSize={v.isSource || v.isSink ? 16 : 18} fontWeight={700}
                  className="select-none pointer-events-none"
                >
                  {v.id}
                </text>

                {/* Source/Sink badge */}
                {v.isSource && (
                  <g>
                    <rect x={v.x - 16} y={v.y + r + 4} width={32} height={18} rx={9}
                      fill="#ede9fe" stroke="#7c3aed" strokeWidth={1} />
                    <text x={v.x} y={v.y + r + 14} textAnchor="middle" dominantBaseline="middle"
                      fontFamily="'Fira Code'" fontSize={9} fontWeight={600} fill="#7c3aed"
                      className="select-none pointer-events-none">SOURCE</text>
                  </g>
                )}
                {v.isSink && (
                  <g>
                    <rect x={v.x - 12} y={v.y + r + 4} width={24} height={18} rx={9}
                      fill="#fff7ed" stroke="#ea580c" strokeWidth={1} />
                    <text x={v.x} y={v.y + r + 14} textAnchor="middle" dominantBaseline="middle"
                      fontFamily="'Fira Code'" fontSize={9} fontWeight={600} fill="#ea580c"
                      className="select-none pointer-events-none">SINK</text>
                  </g>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Mode toasts */}
      <AnimatePresence>
        {editorMode === 'add-vertex' && !isRunning && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-heading text-white text-xs font-mono shadow-lg">
            Click to place a vertex
          </motion.div>
        )}
        {editorMode === 'set-source' && !isRunning && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-source text-white text-xs font-mono shadow-lg">
            Click a vertex to set as SOURCE
          </motion.div>
        )}
        {editorMode === 'set-sink' && !isRunning && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-sink text-white text-xs font-mono shadow-lg">
            Click a vertex to set as SINK
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
