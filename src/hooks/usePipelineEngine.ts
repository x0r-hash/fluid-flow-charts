import { useState, useEffect, useRef, useCallback } from "react";
import { Pipeline, PipelineMetricSnapshot } from "@/types/pipeline";
import { FlowData } from "@/types/flow";

const DEFAULT_PIPELINES: Pipeline[] = [
  {
    id: "pip-1",
    name: "Winlogbeat Ingest",
    description: "Windows event log ingestion from production fleet",
    status: "active",
    targetNodeId: "proc-events",
    interval: 1500,
    dataSource: "random_walk",
    minValue: 15000,
    maxValue: 25000,
    createdAt: Date.now() - 86400000,
    color: "cyan",
  },
  {
    id: "pip-2",
    name: "Detection Pipeline Feed",
    description: "Active detection rule pipeline count",
    status: "active",
    targetNodeId: "proc-pipeline",
    interval: 5000,
    dataSource: "steady_climb",
    minValue: 1,
    maxValue: 8,
    createdAt: Date.now() - 86400000 * 3,
    color: "cyan",
  },
  {
    id: "pip-3",
    name: "Tag Enrichment",
    description: "Tagged events per second after enrichment",
    status: "active",
    targetNodeId: "proc-tagged",
    interval: 2000,
    dataSource: "sine_wave",
    minValue: 20,
    maxValue: 80,
    createdAt: Date.now() - 86400000 * 2,
    color: "purple",
  },
  {
    id: "pip-4",
    name: "Rule Repository Sync",
    description: "SOC Prime rule count synchronization",
    status: "paused",
    targetNodeId: "rules-1",
    interval: 10000,
    dataSource: "steady_climb",
    minValue: 6000,
    maxValue: 7000,
    createdAt: Date.now() - 86400000 * 7,
    color: "green",
  },
];

function generateValue(
  pipeline: Pipeline,
  prevValue: number | undefined,
  tick: number
): number {
  const { minValue, maxValue, dataSource } = pipeline;
  const range = maxValue - minValue;
  const prev = prevValue ?? (minValue + maxValue) / 2;

  switch (dataSource) {
    case "random_walk": {
      const delta = (Math.random() - 0.5) * range * 0.15;
      return Math.max(minValue, Math.min(maxValue, prev + delta));
    }
    case "sine_wave": {
      const phase = tick * 0.05;
      return minValue + ((Math.sin(phase) + 1) / 2) * range;
    }
    case "spike_pattern": {
      const spike = Math.random() > 0.85 ? range * 0.6 : 0;
      const base = minValue + range * 0.3 + (Math.random() - 0.5) * range * 0.1;
      return Math.min(maxValue, base + spike);
    }
    case "steady_climb": {
      const climb = range * 0.02;
      const noise = (Math.random() - 0.5) * range * 0.05;
      const next = prev + climb + noise;
      return next > maxValue ? minValue + range * 0.1 : Math.max(minValue, next);
    }
    case "heartbeat": {
      const beat = tick % 20;
      if (beat < 3) return minValue + range * (beat / 3);
      if (beat < 6) return maxValue - range * ((beat - 3) / 3) * 0.7;
      return minValue + range * 0.15 + (Math.random() - 0.5) * range * 0.05;
    }
    default:
      return prev;
  }
}

export function usePipelineEngine(
  flowData: FlowData,
  onUpdateNodeValue: (nodeId: string, value: string | number) => void
) {
  const [pipelines, setPipelines] = useState<Pipeline[]>(DEFAULT_PIPELINES);
  const [history, setHistory] = useState<Map<string, PipelineMetricSnapshot[]>>(new Map());
  const tickRef = useRef(0);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const startPipeline = useCallback((pipelineId: string) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === pipelineId ? { ...p, status: "active" as const } : p))
    );
  }, []);

  const pausePipeline = useCallback((pipelineId: string) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === pipelineId ? { ...p, status: "paused" as const } : p))
    );
  }, []);

  const removePipeline = useCallback((pipelineId: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
    setHistory((prev) => {
      const next = new Map(prev);
      next.delete(pipelineId);
      return next;
    });
  }, []);

  const addPipeline = useCallback((pipeline: Omit<Pipeline, "id" | "createdAt">) => {
    const newPipeline: Pipeline = {
      ...pipeline,
      id: `pip-${Date.now()}`,
      createdAt: Date.now(),
    };
    setPipelines((prev) => [...prev, newPipeline]);
  }, []);

  const updatePipeline = useCallback((id: string, updates: Partial<Pipeline>) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  // Main tick engine
  useEffect(() => {
    const mainInterval = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      setPipelines((currentPipelines) => {
        const updated = currentPipelines.map((p) => {
          if (p.status !== "active") return p;
          // Only update at the pipeline's interval rate
          const tickMs = 500; // main loop runs every 500ms
          if (tick % Math.max(1, Math.round(p.interval / tickMs)) !== 0) return p;

          const newValue = generateValue(p, p.lastValue, tick);
          const rounded = Math.round(newValue);

          // Push to node
          onUpdateNodeValue(p.targetNodeId, rounded);

          // Add to history
          setHistory((prev) => {
            const next = new Map(prev);
            const arr = next.get(p.id) || [];
            arr.push({ timestamp: Date.now(), value: rounded, pipelineId: p.id });
            if (arr.length > 60) arr.shift(); // keep last 60 points
            next.set(p.id, arr);
            return next;
          });

          return { ...p, lastValue: rounded, throughput: rounded };
        });
        return updated;
      });
    }, 500);

    return () => clearInterval(mainInterval);
  }, [onUpdateNodeValue]);

  return {
    pipelines,
    history,
    addPipeline,
    removePipeline,
    updatePipeline,
    startPipeline,
    pausePipeline,
  };
}
