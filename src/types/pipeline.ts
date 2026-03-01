export interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "error";
  targetNodeId: string; // which flow node this pipeline feeds data to
  interval: number; // ms between updates
  dataSource: "random_walk" | "sine_wave" | "spike_pattern" | "steady_climb" | "heartbeat";
  minValue: number;
  maxValue: number;
  createdAt: number;
  lastValue?: number;
  throughput?: number; // events/sec simulation
  color: "cyan" | "purple" | "green" | "orange";
}

export interface PipelineMetricSnapshot {
  timestamp: number;
  value: number;
  pipelineId: string;
}
