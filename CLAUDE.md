# Network Flow Visualizer

## What This Is
An interactive visualization tool that teaches Ford-Fulkerson and Edmonds-Karp network flow algorithms. Built as a classroom demo: step-by-step algorithm trace, editable flow networks, preset examples.

## Tech Stack
- Framework: React 19 + TypeScript (Vite)
- Styling: Tailwind CSS v4
- Animations: Framer Motion
- Icons: Lucide React
- Deployment: Vercel

## Project Structure
```
src/
  types.ts          - TypeScript interfaces (FlowNetwork, Edge, Vertex, AlgorithmStep, etc.)
  algorithm.ts      - Ford-Fulkerson and Edmonds-Karp implementations with step generation
  presets.ts         - 3+ preset flow networks
  App.tsx            - Main layout, state management, event handlers
  index.css          - Tailwind theme (light theme), custom styles
  main.tsx           - Entry point
  components/
    Header.tsx       - Top bar with title
    GraphCanvas.tsx  - SVG canvas for flow network rendering (directed edges with capacities/flows)
    ControlPanel.tsx - Left sidebar: presets, editor tools, algorithm controls, source/sink picker
    StepNarration.tsx - Right panel: algorithm trace (hidden until algorithm runs)
```

## Design Direction
- **Light theme** — clean white/gray palette, black text, colored accents
- **Blue** for flow/capacity, **emerald** for augmenting paths, **amber** for bottleneck, **rose** for saturated edges
- Font stack: Instrument Serif (display), DM Sans (body), Fira Code (mono)

## Key Concepts
- **Flow Network**: Directed graph with source (s), sink (t), edge capacities
- **Ford-Fulkerson**: Find augmenting paths (any method), push flow along them
- **Edmonds-Karp**: Ford-Fulkerson using BFS (guarantees O(VE²))
- **Residual Graph**: Shows remaining capacity + backward edges for flow cancellation
- **Augmenting Path**: s→t path in residual graph with positive capacity
- **Bottleneck**: Minimum residual capacity along augmenting path

## Commands
```
npm run dev     # Start dev server (localhost:5173)
npm run build   # Production build
```

## Deployment
Vercel auto-deploys. Run `vercel --yes --prod` to deploy manually.
