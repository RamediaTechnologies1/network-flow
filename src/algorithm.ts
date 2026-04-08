import type { FlowNetwork, FlowEdge, AlgorithmStep, AlgorithmType } from './types';

function cloneNetwork(net: FlowNetwork): FlowNetwork {
  return {
    vertices: net.vertices.map(v => ({ ...v })),
    edges: net.edges.map(e => ({ ...e })),
    sourceId: net.sourceId,
    sinkId: net.sinkId,
  };
}

function clearHighlights(net: FlowNetwork): FlowNetwork {
  return {
    ...net,
    edges: net.edges.map(e => ({
      ...e,
      onAugPath: false,
      isBottleneck: false,
      isResidual: false,
    })),
  };
}

// Build adjacency for residual graph
interface ResidualEdge {
  to: string;
  capacity: number;  // residual capacity
  edgeIndex: number;  // index in original edges array
  isBackward: boolean;
}

function buildResidualAdj(net: FlowNetwork): Map<string, ResidualEdge[]> {
  const adj = new Map<string, ResidualEdge[]>();
  for (const v of net.vertices) adj.set(v.id, []);

  net.edges.forEach((e, i) => {
    // Forward edge: residual cap = capacity - flow
    if (e.capacity - e.flow > 0) {
      adj.get(e.source)!.push({ to: e.target, capacity: e.capacity - e.flow, edgeIndex: i, isBackward: false });
    }
    // Backward edge: residual cap = flow
    if (e.flow > 0) {
      adj.get(e.target)!.push({ to: e.source, capacity: e.flow, edgeIndex: i, isBackward: true });
    }
  });

  return adj;
}

// BFS for Edmonds-Karp
function bfs(adj: Map<string, ResidualEdge[]>, source: string, sink: string): { path: string[]; edgeIndices: { idx: number; backward: boolean }[] } | null {
  const parent = new Map<string, { from: string; edgeIdx: number; backward: boolean }>();
  const visited = new Set<string>([source]);
  const queue = [source];

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === sink) break;

    for (const re of adj.get(u) || []) {
      if (!visited.has(re.to) && re.capacity > 0) {
        visited.add(re.to);
        parent.set(re.to, { from: u, edgeIdx: re.edgeIndex, backward: re.isBackward });
        queue.push(re.to);
      }
    }
  }

  if (!parent.has(sink)) return null;

  // Reconstruct path
  const path: string[] = [sink];
  const edgeIndices: { idx: number; backward: boolean }[] = [];
  let cur = sink;
  while (cur !== source) {
    const p = parent.get(cur)!;
    path.unshift(p.from);
    edgeIndices.unshift({ idx: p.edgeIdx, backward: p.backward });
    cur = p.from;
  }

  return { path, edgeIndices };
}

// DFS for Ford-Fulkerson
function dfs(adj: Map<string, ResidualEdge[]>, source: string, sink: string): { path: string[]; edgeIndices: { idx: number; backward: boolean }[] } | null {
  const parent = new Map<string, { from: string; edgeIdx: number; backward: boolean }>();
  const visited = new Set<string>([source]);
  const stack = [source];

  while (stack.length > 0) {
    const u = stack.pop()!;
    if (u === sink) break;

    for (const re of adj.get(u) || []) {
      if (!visited.has(re.to) && re.capacity > 0) {
        visited.add(re.to);
        parent.set(re.to, { from: u, edgeIdx: re.edgeIndex, backward: re.isBackward });
        stack.push(re.to);
      }
    }
  }

  if (!parent.has(sink)) return null;

  const path: string[] = [sink];
  const edgeIndices: { idx: number; backward: boolean }[] = [];
  let cur = sink;
  while (cur !== source) {
    const p = parent.get(cur)!;
    path.unshift(p.from);
    edgeIndices.unshift({ idx: p.edgeIdx, backward: p.backward });
    cur = p.from;
  }

  return { path, edgeIndices };
}

export function runAlgorithm(initialNetwork: FlowNetwork, algorithmType: AlgorithmType): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let net = cloneNetwork(initialNetwork);

  // Reset all flows
  net.edges.forEach(e => { e.flow = 0; e.onAugPath = false; e.isBottleneck = false; e.isSaturated = false; e.isResidual = false; });

  let totalFlow = 0;
  const algoName = algorithmType === 'edmonds-karp' ? 'Edmonds-Karp (BFS)' : 'Ford-Fulkerson (DFS)';

  // Initial state
  steps.push({
    type: 'init',
    description: 'Initial Flow Network',
    detail: `Starting ${algoName}. All edge flows are 0. Source = ${net.sourceId}, Sink = ${net.sinkId}. We will repeatedly find augmenting paths in the residual graph and push flow along them.`,
    network: cloneNetwork(net),
    totalFlow: 0,
  });

  let iteration = 0;
  const maxIter = 200;

  while (iteration < maxIter) {
    iteration++;
    const adj = buildResidualAdj(net);
    const findPath = algorithmType === 'edmonds-karp' ? bfs : dfs;
    const result = findPath(adj, net.sourceId, net.sinkId);

    if (!result) {
      // No augmenting path — done
      net = clearHighlights(cloneNetwork(net));
      net.edges.forEach(e => { e.isSaturated = e.flow >= e.capacity && e.capacity > 0; });

      steps.push({
        type: 'no-path',
        description: 'No Augmenting Path Found',
        detail: `No path from ${net.sourceId} to ${net.sinkId} exists in the residual graph. The algorithm terminates.`,
        network: cloneNetwork(net),
        totalFlow,
        iterationNumber: iteration,
      });
      break;
    }

    const { path, edgeIndices } = result;

    // Step: show augmenting path
    let pathNet = clearHighlights(cloneNetwork(net));
    for (const ei of edgeIndices) {
      pathNet.edges[ei.idx].onAugPath = true;
    }

    steps.push({
      type: 'find-path',
      description: `Iteration ${iteration}: Augmenting Path Found`,
      detail: `Found path: ${path.join(' → ')}. Now we find the bottleneck (minimum residual capacity along this path).`,
      network: cloneNetwork(pathNet),
      augPath: path,
      totalFlow,
      iterationNumber: iteration,
    });

    // Compute bottleneck
    let bottleneck = Infinity;
    let bottleneckEdgeIdx = -1;
    for (const ei of edgeIndices) {
      const e = net.edges[ei.idx];
      const resCap = ei.backward ? e.flow : e.capacity - e.flow;
      if (resCap < bottleneck) {
        bottleneck = resCap;
        bottleneckEdgeIdx = ei.idx;
      }
    }

    // Step: show bottleneck
    let bnNet = clearHighlights(cloneNetwork(net));
    for (const ei of edgeIndices) {
      bnNet.edges[ei.idx].onAugPath = true;
    }
    bnNet.edges[bottleneckEdgeIdx].isBottleneck = true;

    steps.push({
      type: 'bottleneck',
      description: `Bottleneck = ${bottleneck}`,
      detail: `The minimum residual capacity along ${path.join(' → ')} is ${bottleneck}. We will push ${bottleneck} units of flow along this path.`,
      network: cloneNetwork(bnNet),
      augPath: path,
      bottleneck,
      totalFlow,
      iterationNumber: iteration,
    });

    // Update flows
    for (const ei of edgeIndices) {
      if (ei.backward) {
        net.edges[ei.idx].flow -= bottleneck;
      } else {
        net.edges[ei.idx].flow += bottleneck;
      }
    }
    totalFlow += bottleneck;

    // Step: show updated flows
    let flowNet = clearHighlights(cloneNetwork(net));
    for (const ei of edgeIndices) {
      flowNet.edges[ei.idx].onAugPath = true;
    }
    flowNet.edges.forEach(e => { e.isSaturated = e.flow >= e.capacity && e.capacity > 0; });

    steps.push({
      type: 'update-flow',
      description: `Push Flow: +${bottleneck}`,
      detail: `Pushed ${bottleneck} units along ${path.join(' → ')}. Total flow is now ${totalFlow}. Saturated edges (flow = capacity) are highlighted in red.`,
      network: cloneNetwork(flowNet),
      augPath: path,
      bottleneck,
      totalFlow,
      iterationNumber: iteration,
    });

    // Step: show residual graph
    let resNet = clearHighlights(cloneNetwork(net));
    const resAdj = buildResidualAdj(net);
    const residualEdges: FlowEdge[] = [];
    let reId = 0;
    for (const [from, edges] of resAdj) {
      for (const re of edges) {
        if (re.capacity > 0) {
          residualEdges.push({
            id: `res-${reId++}`,
            source: from,
            target: re.to,
            capacity: re.capacity,
            flow: 0,
            isResidual: re.isBackward,
          });
        }
      }
    }

    steps.push({
      type: 'update-residual',
      description: `Residual Graph Updated`,
      detail: `The residual graph now reflects the new flow. Forward edges show remaining capacity. Backward edges (dashed) allow flow cancellation. Looking for next augmenting path...`,
      network: cloneNetwork(resNet),
      totalFlow,
      residualEdges,
      iterationNumber: iteration,
    });
  }

  // Final step
  net = clearHighlights(cloneNetwork(net));
  net.edges.forEach(e => { e.isSaturated = e.flow >= e.capacity && e.capacity > 0; });

  steps.push({
    type: 'done',
    description: `Maximum Flow = ${totalFlow}`,
    detail: `${algoName} complete. The maximum flow from ${net.sourceId} to ${net.sinkId} is ${totalFlow}. This equals the minimum cut capacity (Max-Flow Min-Cut Theorem).`,
    network: cloneNetwork(net),
    totalFlow,
  });

  return steps;
}
