import { motion } from 'framer-motion';
import { Network } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between px-7 py-3 border-b border-border bg-surface"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-flow/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-flow" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display text-xl text-heading leading-none tracking-tight">
            Network Flow
          </h1>
          <p className="text-[11px] font-mono text-muted tracking-wide mt-0.5">
            Ford-Fulkerson & Edmonds-Karp Visualizer
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline-flex px-3 py-1 rounded-full bg-raised border border-border text-[10px] font-mono text-muted">
          Max-Flow Min-Cut Theorem
        </span>
        <a
          href="https://en.wikipedia.org/wiki/Maximum_flow_problem"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-body text-flow/70 hover:text-flow transition-colors"
        >
          Learn more &rarr;
        </a>
      </div>
    </motion.header>
  );
}
