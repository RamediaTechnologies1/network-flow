import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Route, Gauge, ArrowUpRight, GitBranch, Ban, Trophy
} from 'lucide-react';
import type { AlgorithmStep } from '../types';

interface Props {
  steps: AlgorithmStep[];
  currentStep: number;
  onStepClick: (i: number) => void;
}

const stepConfig: Record<AlgorithmStep['type'], {
  icon: typeof Sparkles; color: string; bg: string; border: string;
}> = {
  'init': { icon: Sparkles, color: 'text-flow', bg: 'bg-flow/5', border: 'border-flow/15' },
  'find-path': { icon: Route, color: 'text-path', bg: 'bg-path/5', border: 'border-path/15' },
  'bottleneck': { icon: Gauge, color: 'text-bottleneck', bg: 'bg-bottleneck/5', border: 'border-bottleneck/15' },
  'update-flow': { icon: ArrowUpRight, color: 'text-flow', bg: 'bg-flow/5', border: 'border-flow/15' },
  'update-residual': { icon: GitBranch, color: 'text-residual', bg: 'bg-residual/5', border: 'border-residual/15' },
  'no-path': { icon: Ban, color: 'text-saturated', bg: 'bg-saturated/5', border: 'border-saturated/15' },
  'done': { icon: Trophy, color: 'text-path', bg: 'bg-path/5', border: 'border-path/15' },
};

export default function StepNarration({ steps, currentStep, onStepClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStep]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="w-[300px] min-w-[300px] border-l border-border bg-surface flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium text-flow tracking-[0.15em] uppercase">Algorithm Trace</span>
        <span className="text-[10px] font-mono text-muted">{currentStep + 1} / {steps.length}</span>
      </div>

      {/* Current step detail */}
      <AnimatePresence mode="wait">
        {steps[currentStep] && (
          <motion.div key={currentStep}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-4 border-b border-border"
          >
            {(() => {
              const step = steps[currentStep];
              const cfg = stepConfig[step.type];
              const Icon = cfg.icon;
              return (
                <div className={`rounded-2xl p-4 ${cfg.bg} border ${cfg.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${cfg.color}`} strokeWidth={2} />
                    <span className={`text-[12px] font-body font-semibold ${cfg.color}`}>{step.description}</span>
                  </div>
                  <p className="text-[11.5px] font-body text-text/80 leading-[1.7] pl-6">
                    {step.detail}
                  </p>
                  {step.augPath && (
                    <div className="mt-3 ml-6 flex items-center gap-1.5 flex-wrap">
                      {step.augPath.map((v, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-path/10 text-path font-mono text-[10px] font-semibold">{v}</span>
                          {i < step.augPath!.length - 1 && <span className="text-muted text-[10px]">&rarr;</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {step.bottleneck !== undefined && (
                    <div className="mt-2 ml-6 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-bottleneck/10 border border-bottleneck/15">
                      <span className="text-[9px] font-mono text-muted uppercase">Bottleneck</span>
                      <span className="text-bottleneck font-mono text-xs font-bold">{step.bottleneck}</span>
                    </div>
                  )}
                  <div className="mt-2 ml-6 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-flow/5 border border-flow/10">
                    <span className="text-[9px] font-mono text-muted uppercase">Total Flow</span>
                    <span className="text-flow font-mono text-xs font-bold">{step.totalFlow}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {steps.map((step, i) => {
          const cfg = stepConfig[step.type];
          const Icon = cfg.icon;
          const isCur = i === currentStep;
          const isPast = i < currentStep;

          return (
            <button key={i} ref={isCur ? activeRef : null} onClick={() => onStepClick(i)}
              className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all group
                ${isCur ? `${cfg.bg} border ${cfg.border}` :
                  isPast ? 'bg-transparent border border-transparent opacity-50 hover:opacity-70' :
                  'bg-transparent border border-transparent opacity-30 hover:opacity-50'}`}>
              <div className="flex flex-col items-center mt-0.5 flex-shrink-0">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center
                  ${isCur ? `${cfg.bg} border ${cfg.border}` : 'bg-raised border border-border'}`}>
                  <Icon className={`w-2.5 h-2.5 ${isCur ? cfg.color : 'text-muted'}`} strokeWidth={2} />
                </div>
                {i < steps.length - 1 && <div className={`w-px h-3 mt-0.5 ${isPast ? 'bg-border-hover' : 'bg-border'}`} />}
              </div>
              <div className="flex-1 min-w-0 pt-px">
                <div className={`text-[11px] font-body font-medium truncate ${isCur ? cfg.color : 'text-text'}`}>{step.description}</div>
                {isCur && (
                  <div className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">
                    {step.detail.slice(0, 90)}{step.detail.length > 90 ? '...' : ''}
                  </div>
                )}
              </div>
              <span className={`text-[8px] font-mono mt-1 ${isCur ? cfg.color : 'text-muted'}`}>{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3.5 border-t border-border">
        <div className="text-[8px] font-mono text-muted uppercase tracking-widest mb-2">Legend</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { color: 'bg-path', label: 'Aug. path' },
            { color: 'bg-bottleneck', label: 'Bottleneck' },
            { color: 'bg-saturated', label: 'Saturated' },
            { color: 'bg-residual', label: 'Residual' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[9px] font-mono text-subtle">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
