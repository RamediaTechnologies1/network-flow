export interface Vertex {
  id: string;
  x: number;
  y: number;
  isSource: boolean;
  isSink: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  flow: number;
  isResidual?: boolean;    // backward edge in residual graph
  onAugPath?: boolean;     // part of current augmenting path
  isBottleneck?: boolean;  // bottleneck edge on path
  isSaturated?: boolean;   // flow === capacity
}

export interface FlowNetwork {
  vertices: Vertex[];
  edges: FlowEdge[];
  sourceId: string;
  sinkId: string;
}

export interface AlgorithmStep {
  type: 'init' | 'find-path' | 'bottleneck' | 'update-flow' | 'update-residual' | 'no-path' | 'done';
  description: string;
  detail: string;
  network: FlowNetwork;
  augPath?: string[];       // vertex IDs in order
  bottleneck?: number;
  totalFlow: number;
  residualEdges?: FlowEdge[];
  iterationNumber?: number;
}

export type EditorMode = 'select' | 'add-vertex' | 'add-edge' | 'delete' | 'set-source' | 'set-sink';

export type AlgorithmType = 'ford-fulkerson' | 'edmonds-karp';

export interface PresetNetwork {
  name: string;
  description: string;
  network: FlowNetwork;
}
