import { useState, useCallback, useRef } from 'react';
import type { FlowNetwork, AlgorithmStep, EditorMode, AlgorithmType } from './types';
import { runAlgorithm } from './algorithm';
import { presetNetworks } from './presets';
import GraphCanvas from './components/GraphCanvas';
import ControlPanel from './components/ControlPanel';
import StepNarration from './components/StepNarration';
import Header from './components/Header';

function getDefault(): FlowNetwork {
  return JSON.parse(JSON.stringify(presetNetworks[0].network));
}

function App() {
  const [network, setNetwork] = useState<FlowNetwork>(getDefault);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('edmonds-karp');
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [edgeStart, setEdgeStart] = useState<string | null>(null);
  const nextId = useRef(1);

  const displayNetwork = currentStep >= 0 && steps[currentStep] ? steps[currentStep].network : network;
  const currentTotalFlow = currentStep >= 0 && steps[currentStep] ? steps[currentStep].totalFlow : 0;
  const showResidual = currentStep >= 0 && steps[currentStep]?.type === 'update-residual';
  const residualEdges = showResidual ? steps[currentStep]?.residualEdges : undefined;

  const handleReset = useCallback(() => {
    setSteps([]); setCurrentStep(-1); setIsRunning(false);
    setSelectedVertex(null); setSelectedEdge(null); setEdgeStart(null);
    setNetwork(prev => ({
      ...prev,
      edges: prev.edges.map(e => ({ ...e, flow: 0, onAugPath: false, isBottleneck: false, isSaturated: false, isResidual: false })),
    }));
  }, []);

  const handleRun = useCallback(() => {
    const fresh: FlowNetwork = {
      ...network,
      edges: network.edges.map(e => ({ ...e, flow: 0, onAugPath: false, isBottleneck: false, isSaturated: false, isResidual: false })),
    };
    const s = runAlgorithm(fresh, algorithmType);
    setSteps(s); setCurrentStep(0); setIsRunning(true);
  }, [network, algorithmType]);

  const handleNext = useCallback(() => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); }, [currentStep, steps.length]);
  const handlePrev = useCallback(() => { if (currentStep > 0) setCurrentStep(p => p - 1); }, [currentStep]);

  const handleLoadPreset = useCallback((i: number) => {
    setNetwork(JSON.parse(JSON.stringify(presetNetworks[i].network)));
    setSteps([]); setCurrentStep(-1); setIsRunning(false);
    setSelectedVertex(null); setSelectedEdge(null); setEdgeStart(null);
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (isRunning) return;
    if (editorMode === 'add-vertex') {
      const id = `V${nextId.current++}`;
      setNetwork(prev => ({
        ...prev,
        vertices: [...prev.vertices, { id, x, y, isSource: false, isSink: false }],
      }));
    }
    setSelectedEdge(null);
  }, [editorMode, isRunning]);

  const handleVertexClick = useCallback((id: string) => {
    if (isRunning) return;
    if (editorMode === 'select') {
      setSelectedVertex(p => p === id ? null : id);
      setSelectedEdge(null);
    } else if (editorMode === 'delete') {
      setNetwork(prev => ({
        ...prev,
        vertices: prev.vertices.filter(v => v.id !== id),
        edges: prev.edges.filter(e => e.source !== id && e.target !== id),
        sourceId: prev.sourceId === id ? '' : prev.sourceId,
        sinkId: prev.sinkId === id ? '' : prev.sinkId,
      }));
    } else if (editorMode === 'set-source') {
      setNetwork(prev => ({
        ...prev,
        vertices: prev.vertices.map(v => ({ ...v, isSource: v.id === id, isSink: v.id === id ? false : v.isSink })),
        sourceId: id,
        sinkId: prev.sinkId === id ? '' : prev.sinkId,
      }));
      setEditorMode('select');
    } else if (editorMode === 'set-sink') {
      setNetwork(prev => ({
        ...prev,
        vertices: prev.vertices.map(v => ({ ...v, isSink: v.id === id, isSource: v.id === id ? false : v.isSource })),
        sinkId: id,
        sourceId: prev.sourceId === id ? '' : prev.sourceId,
      }));
      setEditorMode('select');
    } else if (editorMode === 'add-edge') {
      if (!edgeStart) {
        setEdgeStart(id);
      } else if (edgeStart !== id) {
        const exists = network.edges.some(e => e.source === edgeStart && e.target === id);
        if (!exists) {
          setNetwork(prev => ({
            ...prev,
            edges: [...prev.edges, {
              id: `e${Date.now()}`, source: edgeStart!, target: id,
              capacity: 10, flow: 0,
            }],
          }));
        }
        setEdgeStart(null);
      }
    }
  }, [editorMode, edgeStart, network.edges, isRunning]);

  const handleVertexDrag = useCallback((id: string, x: number, y: number) => {
    if (isRunning) return;
    setNetwork(prev => ({
      ...prev,
      vertices: prev.vertices.map(v => v.id === id ? { ...v, x, y } : v),
    }));
  }, [isRunning]);

  const handleEdgeClick = useCallback((edgeId: string) => {
    if (isRunning) return;
    if (editorMode === 'delete') {
      setNetwork(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));
    } else if (editorMode === 'select') {
      setSelectedEdge(p => p === edgeId ? null : edgeId);
      setSelectedVertex(null);
    }
  }, [editorMode, isRunning]);

  const handleCapacityChange = useCallback((edgeId: string, cap: number) => {
    setNetwork(prev => ({
      ...prev,
      edges: prev.edges.map(e => e.id === edgeId ? { ...e, capacity: cap } : e),
    }));
  }, []);

  const handleClear = useCallback(() => {
    setNetwork({ vertices: [], edges: [], sourceId: '', sinkId: '' });
    setSteps([]); setCurrentStep(-1); setIsRunning(false);
    setSelectedVertex(null); setSelectedEdge(null); setEdgeStart(null);
  }, []);

  const handleGenerateRandom = useCallback((count: number) => {
    const pad = 80;
    const w = 700, h = 500;
    const vertices: FlowNetwork['vertices'] = [];

    // Layered layout: source, 2-3 middle layers, sink
    const layers = Math.max(2, Math.min(4, Math.floor(count / 2)));
    const perLayer = Math.ceil((count - 2) / layers);

    // Source
    vertices.push({ id: 's', x: pad, y: h / 2 + pad / 2, isSource: true, isSink: false });

    // Middle vertices
    let vi = 0;
    for (let l = 0; l < layers; l++) {
      const layerX = pad + ((w - pad) * (l + 1)) / (layers + 1);
      const layerCount = Math.min(perLayer, count - 2 - vi);
      for (let j = 0; j < layerCount; j++) {
        const layerY = pad + ((h) * (j + 1)) / (layerCount + 1);
        vertices.push({
          id: String.fromCharCode(65 + vi),
          x: layerX + (Math.random() - 0.5) * 40,
          y: layerY + (Math.random() - 0.5) * 30,
          isSource: false, isSink: false,
        });
        vi++;
      }
    }

    // Sink
    vertices.push({ id: 't', x: w + pad / 2, y: h / 2 + pad / 2, isSource: false, isSink: true });

    // Edges: connect adjacent layers
    const edges: FlowNetwork['edges'] = [];
    let eid = 0;
    const layerGroups: number[][] = [[0]]; // source
    let idx = 1;
    for (let l = 0; l < layers; l++) {
      const group: number[] = [];
      const layerCount = Math.min(perLayer, count - 2 - (idx - 1));
      for (let j = 0; j < layerCount; j++) {
        group.push(idx++);
      }
      layerGroups.push(group);
    }
    layerGroups.push([vertices.length - 1]); // sink

    for (let l = 0; l < layerGroups.length - 1; l++) {
      for (const from of layerGroups[l]) {
        for (const to of layerGroups[l + 1]) {
          if (Math.random() < 0.7 || layerGroups[l].length === 1 || layerGroups[l + 1].length === 1) {
            edges.push({
              id: `e${eid++}`,
              source: vertices[from].id,
              target: vertices[to].id,
              capacity: Math.floor(Math.random() * 14) + 2,
              flow: 0,
            });
          }
        }
      }
    }

    // Ensure every vertex has at least one in-edge and one out-edge (except s/t)
    for (let i = 1; i < vertices.length - 1; i++) {
      const v = vertices[i];
      const hasIn = edges.some(e => e.target === v.id);
      const hasOut = edges.some(e => e.source === v.id);
      if (!hasIn) {
        const prev = layerGroups.find(g => g.some(gi => vertices[gi].id === v.id));
        const li = layerGroups.indexOf(prev!);
        if (li > 0) {
          const from = layerGroups[li - 1][Math.floor(Math.random() * layerGroups[li - 1].length)];
          edges.push({ id: `e${eid++}`, source: vertices[from].id, target: v.id, capacity: Math.floor(Math.random() * 10) + 3, flow: 0 });
        }
      }
      if (!hasOut) {
        const cur = layerGroups.find(g => g.some(gi => vertices[gi].id === v.id));
        const li = layerGroups.indexOf(cur!);
        if (li < layerGroups.length - 1) {
          const to = layerGroups[li + 1][Math.floor(Math.random() * layerGroups[li + 1].length)];
          edges.push({ id: `e${eid++}`, source: v.id, target: vertices[to].id, capacity: Math.floor(Math.random() * 10) + 3, flow: 0 });
        }
      }
    }

    setNetwork({ vertices, edges, sourceId: 's', sinkId: 't' });
    setSteps([]); setCurrentStep(-1); setIsRunning(false);
    setSelectedVertex(null); setSelectedEdge(null); setEdgeStart(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ControlPanel
          editorMode={editorMode} setEditorMode={setEditorMode}
          isRunning={isRunning}
          algorithmType={algorithmType} setAlgorithmType={setAlgorithmType}
          onRun={handleRun} onReset={handleReset}
          onNext={handleNext} onPrev={handlePrev}
          onLoadPreset={handleLoadPreset} onClear={handleClear}
          onGenerateRandom={handleGenerateRandom}
          currentStep={currentStep} totalSteps={steps.length}
          totalFlow={currentTotalFlow}
          selectedVertex={selectedVertex} selectedEdge={selectedEdge}
          network={network} onCapacityChange={handleCapacityChange}
          edgeStart={edgeStart}
        />
        <div className="flex-1 relative">
          <GraphCanvas
            network={displayNetwork}
            editorMode={editorMode}
            selectedVertex={selectedVertex}
            edgeStart={edgeStart}
            isRunning={isRunning}
            showResidual={showResidual}
            residualEdges={residualEdges}
            onCanvasClick={handleCanvasClick}
            onVertexClick={handleVertexClick}
            onVertexDrag={handleVertexDrag}
            onEdgeClick={handleEdgeClick}
          />
        </div>
        {isRunning && (
          <StepNarration steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
        )}
      </div>
    </div>
  );
}

export default App;
