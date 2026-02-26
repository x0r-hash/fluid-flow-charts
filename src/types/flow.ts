export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "source" | "process" | "metric" | "destination";
  value?: string | number;
  subLabel?: string;
  color?: "cyan" | "purple" | "green" | "orange" | "red" | "yellow" | "blue" | "pink" | "gray" | "lime";
  size?: number;
  shape?: "circle" | "rectangle";
  animateValue?: boolean;
  animationSpeed?: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  color?: "cyan" | "purple" | "green" | "orange" | "red" | "yellow" | "blue" | "pink" | "gray" | "lime";
  particleCount?: number;
  speed?: number;
}

export interface FlowCategory {
  id: string;
  label: string;
  x: number;
  y: number;
  color: "cyan" | "purple" | "green" | "orange" | "red" | "yellow" | "blue" | "pink" | "gray" | "lime";
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  categories?: FlowCategory[];
}
