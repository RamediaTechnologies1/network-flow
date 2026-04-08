import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play, RotateCcw, ChevronRight, ChevronLeft, MousePointer2,
  Plus, Link, Trash2, Layers, CircleDot, Target, Shuffle, Zap
} from 'lucide-react';
import type { EditorMode, FlowNetwork, AlgorithmType } from '../types';
import { presetNetworks } from '../presets';

interface Props {
  editorMode: EditorMode;
  setEditorMode: (m: EditorMode) => void;
  isRunning: boolean;
  algorithmType: AlgorithmType;
  setAlgorithmType: (t: AlgorithmType) => void;
  onRun: () => void;
  onReset: () => void;
  onNext: () => void;
  onPrev: () => void;
  onLoadPreset: (i: number) => void;
  onClear: () => void;
  onGenerateRandom: (n: number) => void;
  currentStep: number;
  totalSteps: number;
  totalFlow: number;
  selectedVertex: string | null;
  selectedEdge: string | null;
  network: FlowNetwork;
  onCapacityChange: (edgeId: string, cap: number) => void;
  edgeStart: string | null;
}

const modes: { mode: EditorMode; icon: typeof MousePointer2; label: string }[] = [
  { mode: 'select', icon: MousePointer2, label: 'Select' },
  { mode: 'add-vertex', icon: Plus, label: 'Vertex' },
  { mode: 'add-edge', icon: Link, label: 'Edge' },
  { mode: 'set-source', icon: CircleDot, label: 'Source' },
  { mode: 'set-sink', icon: Target, label: 'Sink' },
  { mode: 'delete', icon: Trash2, label: 'Delete' },
];

export default function ControlPanel({
  editorMode, setEditorMode, isRunning,
  algorithmType, setAlgorithmType,
  onRun, onReset, onNext, onPrev,
  onLoadPreset, onClear, onGenerateRandom,
  currentStep, totalSteps, totalFlow,
  selectedEdge, network, onCapacityChange,
}: Props) {
  const selEdge = network.edges.find(e => e.id === selectedEdge);
  const [randomCount, setRandomCount] = useState(6);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-[280px] min-w-[280px] border-r border-border bg-surface flex flex-col overflow-y-auto"
    >
      {/* Presets */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-3.5 h-3.5 text-flow" />
          <span className="text-[10px] font-mono font-medium text-flow tracking-[0.15em] uppercase">Presets</span>
        </div>
        <div className="space-y-1.5">
          {presetNetworks.map((p, i) => (
            <button key={i} onClick={() => onLoadPreset(i)} disabled={isRunning}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-raised hover:bg-border/30 border border-border hover:border-flow/20 transition-all group disabled:opacity-30">
              <div className="text-[12px] font-body font-semibold text-heading group-hover:text-flow transition-colors">{p.name}</div>
              <div className="text-[10px] font-body text-muted mt-0.5">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Random */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Shuffle className="w-3.5 h-3.5 text-bottleneck" />
          <span className="text-[10px] font-mono font-medium text-bottleneck tracking-[0.15em] uppercase">Random</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-muted">Nodes</span>
          <input type="number" min={4} max={12} value={randomCount}
            onChange={e => { const v = parseInt(e.target.value); if (v >= 4 && v <= 12) setRandomCount(v); }}
            disabled={isRunning}
            className="w-14 px-2 py-1 rounded-lg bg-raised border border-border text-heading text-sm font-mono text-center focus:outline-none focus:border-flow/30 disabled:opacity-30" />
          <input type="range" min={4} max={12} value={randomCount}
            onChange={e => setRandomCount(parseInt(e.target.value))} disabled={isRunning} className="flex-1" />
        </div>
        <button onClick={() => onGenerateRandom(randomCount)} disabled={isRunning}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bottleneck/10 border border-bottleneck/20 text-bottleneck font-body font-semibold text-[12px] hover:bg-bottleneck/15 transition-all disabled:opacity-20 group">
          <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          Generate
        </button>
      </div>

      {/* Editor */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-subtle" />
          <span className="text-[10px] font-mono font-medium text-subtle tracking-[0.15em] uppercase">Editor</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {modes.map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setEditorMode(mode)} disabled={isRunning} title={label}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[9px] font-mono transition-all disabled:opacity-20
                ${editorMode === mode
                  ? 'bg-flow/8 border border-flow/20 text-flow'
                  : 'bg-raised border border-border text-muted hover:text-text'}`}>
              <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>
        <button onClick={onClear} disabled={isRunning}
          className="w-full mt-2 px-3 py-1.5 rounded-lg bg-saturated/5 border border-saturated/10 text-saturated/50 hover:text-saturated hover:bg-saturated/10 text-[10px] font-mono transition-all disabled:opacity-20">
          Clear All
        </button>
      </div>

      {/* Edge capacity editor */}
      {selEdge && !isRunning && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="p-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-3.5 h-3.5 text-flow" />
            <span className="text-[10px] font-mono font-medium text-flow tracking-[0.15em] uppercase">
              Edge {selEdge.source} → {selEdge.target}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted">Capacity</span>
            <input type="number" min={1} step={1} value={selEdge.capacity}
              onChange={e => { const c = parseInt(e.target.value); if (c > 0) onCapacityChange(selEdge.id, c); }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-raised border border-border text-heading text-sm font-mono focus:outline-none focus:border-flow/30" />
          </div>
          <input type="range" min={1} max={30} value={selEdge.capacity}
            onChange={e => onCapacityChange(selEdge.id, parseInt(e.target.value))} className="w-full mt-2" />
        </motion.div>
      )}

      {/* Algorithm */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-3.5 h-3.5 text-path" strokeWidth={2} />
          <span className="text-[10px] font-mono font-medium text-path tracking-[0.15em] uppercase">Algorithm</span>
        </div>

        {/* Algorithm picker */}
        {!isRunning && (
          <div className="flex gap-1.5 mb-3">
            {(['ford-fulkerson', 'edmonds-karp'] as AlgorithmType[]).map(t => (
              <button key={t} onClick={() => setAlgorithmType(t)}
                className={`flex-1 px-2 py-2 rounded-xl text-[10px] font-mono transition-all
                  ${algorithmType === t
                    ? 'bg-path/10 border border-path/20 text-path font-semibold'
                    : 'bg-raised border border-border text-muted hover:text-text'}`}>
                {t === 'ford-fulkerson' ? 'Ford-Fulk.' : 'Edmonds-Karp'}
              </button>
            ))}
          </div>
        )}

        {!isRunning ? (
          <button onClick={onRun}
            disabled={network.edges.length === 0 || !network.sourceId || !network.sinkId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-path/10 border border-path/20 text-path font-body font-semibold text-[13px] hover:bg-path/15 transition-all disabled:opacity-20 group">
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            Run Algorithm
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted">Step {currentStep + 1} / {totalSteps}</span>
              <span className="text-[10px] font-mono font-semibold text-flow">Flow: {totalFlow}</span>
            </div>
            <div className="h-1 bg-raised rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-flow to-path"
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }} />
            </div>
            <div className="flex gap-2">
              <button onClick={onPrev} disabled={currentStep <= 0}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-raised border border-border text-text hover:text-heading transition-all text-xs font-mono disabled:opacity-20">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button onClick={onNext} disabled={currentStep >= totalSteps - 1}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-flow/8 border border-flow/15 text-flow hover:bg-flow/12 transition-all text-xs font-mono disabled:opacity-20">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-raised border border-border text-muted hover:text-saturated hover:border-saturated/15 transition-all text-[10px] font-mono">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 mt-auto">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Vertices', value: network.vertices.length, color: 'text-heading' },
            { label: 'Edges', value: network.edges.length, color: 'text-flow' },
            { label: 'Flow', value: totalFlow, color: 'text-path' },
          ].map(s => (
            <div key={s.label} className="px-2.5 py-2 rounded-xl bg-raised border border-border text-center">
              <div className="text-[8px] font-mono text-muted uppercase tracking-widest">{s.label}</div>
              <div className={`text-base font-display ${s.color} mt-0.5`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
