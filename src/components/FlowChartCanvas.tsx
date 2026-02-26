import { useRef, useEffect, useCallback } from "react";
import { FlowData, FlowNode, FlowEdge } from "@/types/flow";

const COLOR_MAP: Record<string, string> = {
  cyan: "hsl(185, 100%, 50%)",
  purple: "hsl(270, 80%, 60%)",
  green: "hsl(155, 100%, 50%)",
  orange: "hsl(35, 100%, 55%)",
};

const COLOR_MAP_DIM: Record<string, string> = {
  cyan: "hsla(185, 100%, 50%, 0.15)",
  purple: "hsla(270, 80%, 60%, 0.15)",
  green: "hsla(155, 100%, 50%, 0.15)",
  orange: "hsla(35, 100%, 55%, 0.15)",
};

const COLOR_MAP_GLOW: Record<string, string> = {
  cyan: "hsla(185, 100%, 60%, 0.8)",
  purple: "hsla(270, 80%, 70%, 0.8)",
  green: "hsla(155, 100%, 60%, 0.8)",
  orange: "hsla(35, 100%, 65%, 0.8)",
};

interface Particle {
  t: number; // progress 0..1
  speed: number;
  edgeId: string;
}

interface FlowChartCanvasProps {
  data: FlowData;
  width?: number;
  height?: number;
}

function getNodeCenter(node: FlowNode): { x: number; y: number } {
  return { x: node.x, y: node.y };
}

function getCurvePath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { cx1: number; cy1: number; cx2: number; cy2: number } {
  const dx = to.x - from.x;
  return {
    cx1: from.x + dx * 0.4,
    cy1: from.y,
    cx2: to.x - dx * 0.4,
    cy2: to.y,
  };
}

function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function getPointOnCurve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const { cx1, cy1, cx2, cy2 } = getCurvePath(from, to);
  return {
    x: cubicBezier(t, from.x, cx1, cx2, to.x),
    y: cubicBezier(t, from.y, cy1, cy2, to.y),
  };
}

export default function FlowChartCanvas({ data, width = 1200, height = 660 }: FlowChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const nodeMapRef = useRef<Map<string, FlowNode>>(new Map());

  // Build node map
  useEffect(() => {
    const map = new Map<string, FlowNode>();
    data.nodes.forEach((n) => map.set(n.id, n));
    nodeMapRef.current = map;

    // Init particles
    const particles: Particle[] = [];
    data.edges.forEach((edge) => {
      const count = edge.particleCount || 4;
      const speed = (edge.speed || 1) * 0.003;
      for (let i = 0; i < count; i++) {
        particles.push({
          t: Math.random(),
          speed: speed * (0.8 + Math.random() * 0.4),
          edgeId: edge.id,
        });
      }
    });
    particlesRef.current = particles;
  }, [data]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "hsl(222, 47%, 4%)";
    ctx.fillRect(0, 0, width, height);

    const nodeMap = nodeMapRef.current;
    const edgeMap = new Map<string, FlowEdge>();
    data.edges.forEach((e) => edgeMap.set(e.id, e));

    // Draw edges (dim paths)
    data.edges.forEach((edge) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = getNodeCenter(fromNode);
      const to = getNodeCenter(toNode);
      const { cx1, cy1, cx2, cy2 } = getCurvePath(from, to);
      const color = edge.color || "cyan";

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, to.x, to.y);
      ctx.strokeStyle = COLOR_MAP_DIM[color];
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Update & draw particles
    particlesRef.current.forEach((p) => {
      p.t += p.speed;
      if (p.t > 1) p.t -= 1;

      const edge = edgeMap.get(p.edgeId);
      if (!edge) return;

      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = getNodeCenter(fromNode);
      const to = getNodeCenter(toNode);
      const pos = getPointOnCurve(from, to, p.t);
      const color = edge.color || "cyan";

      // Glow
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_MAP_DIM[color];
      ctx.fill();

      // Core particle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_MAP_GLOW[color];
      ctx.fill();
    });

    // Draw category labels
    data.categories?.forEach((cat) => {
      const color = COLOR_MAP[cat.color];
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = color;
      ctx.fillText(cat.label, cat.x, cat.y);

      // small line under
      ctx.beginPath();
      ctx.moveTo(cat.x, cat.y + 4);
      ctx.lineTo(cat.x + ctx.measureText(cat.label).width, cat.y + 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    data.nodes.forEach((node) => {
      const color = node.color || "cyan";
      const coreColor = COLOR_MAP[color];
      const dimColor = COLOR_MAP_DIM[color];

      if (node.type === "source" || node.type === "destination") {
        // Text label with dot
        ctx.fillStyle = dimColor;
        ctx.beginPath();
        ctx.arc(node.x - 12, node.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "400 12px 'Inter', sans-serif";
        ctx.fillStyle = "hsl(210, 40%, 80%)";
        ctx.fillText(node.label, node.x, node.y + 4);
      } else if (node.type === "metric" || node.type === "process") {
        const size = node.size || 60;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(222, 47%, 6%, 0.9)";
        ctx.fill();
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Glow effect
        const gradient = ctx.createRadialGradient(node.x, node.y, size * 0.5, node.x, node.y, size * 1.3);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(1, dimColor);
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Value text
        if (node.value !== undefined) {
          ctx.font = "700 22px 'JetBrains Mono', monospace";
          ctx.fillStyle = coreColor;
          ctx.textAlign = "center";
          ctx.fillText(String(node.value), node.x, node.y + 2);
        }

        // Sub label
        if (node.subLabel) {
          ctx.font = "500 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = COLOR_MAP_GLOW[color];
          ctx.textAlign = "center";
          ctx.fillText(node.subLabel, node.x, node.y - 20);
        }

        // Label below value
        ctx.font = "500 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = "hsl(210, 20%, 55%)";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + 22);

        ctx.textAlign = "start";

        // Indicator dot
        ctx.beginPath();
        ctx.arc(node.x - 30, node.y - 16, 3, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();
      }
    });

    animRef.current = requestAnimationFrame(draw);
  }, [data, width, height]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-lg"
    />
  );
}
