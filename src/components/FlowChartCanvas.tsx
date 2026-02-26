import { useRef, useEffect, useCallback } from "react";
import { FlowData, FlowNode, FlowEdge } from "@/types/flow";

const COLOR_MAP: Record<string, string> = {
  cyan: "hsl(185, 100%, 50%)",
  purple: "hsl(270, 80%, 60%)",
  green: "hsl(155, 100%, 50%)",
  orange: "hsl(35, 100%, 55%)",
  red: "hsl(0, 100%, 50%)",
  yellow: "hsl(60, 100%, 50%)",
  blue: "hsl(220, 100%, 50%)",
  pink: "hsl(320, 100%, 50%)",
  gray: "hsl(0, 0%, 60%)",
  lime: "hsl(120, 100%, 50%)",
};

const COLOR_MAP_DIM: Record<string, string> = {
  cyan: "hsla(185, 100%, 50%, 0.15)",
  purple: "hsla(270, 80%, 60%, 0.15)",
  green: "hsla(155, 100%, 50%, 0.15)",
  orange: "hsla(35, 100%, 55%, 0.15)",
  red: "hsla(0, 100%, 50%, 0.15)",
  yellow: "hsla(60, 100%, 50%, 0.15)",
  blue: "hsla(220, 100%, 50%, 0.15)",
  pink: "hsla(320, 100%, 50%, 0.15)",
  gray: "hsla(0, 0%, 60%, 0.15)",
  lime: "hsla(120, 100%, 50%, 0.15)",
};

const COLOR_MAP_GLOW: Record<string, string> = {
  cyan: "hsla(185, 100%, 60%, 0.8)",
  purple: "hsla(270, 80%, 70%, 0.8)",
  green: "hsla(155, 100%, 60%, 0.8)",
  orange: "hsla(35, 100%, 65%, 0.8)",
  red: "hsla(0, 100%, 60%, 0.8)",
  yellow: "hsla(60, 100%, 60%, 0.8)",
  blue: "hsla(220, 100%, 60%, 0.8)",
  pink: "hsla(320, 100%, 60%, 0.8)",
  gray: "hsla(0, 0%, 70%, 0.8)",
  lime: "hsla(120, 100%, 60%, 0.8)",
};

const COLOR_MAP_SELECTED: Record<string, string> = {
  cyan: "hsla(185, 100%, 60%, 0.5)",
  purple: "hsla(270, 80%, 70%, 0.5)",
  green: "hsla(155, 100%, 60%, 0.5)",
  orange: "hsla(35, 100%, 65%, 0.5)",
  red: "hsla(0, 100%, 60%, 0.5)",
  yellow: "hsla(60, 100%, 60%, 0.5)",
  blue: "hsla(220, 100%, 60%, 0.5)",
  pink: "hsla(320, 100%, 60%, 0.5)",
  gray: "hsla(0, 0%, 70%, 0.5)",
  lime: "hsla(120, 100%, 60%, 0.5)",
};

interface Particle {
  t: number;
  speed: number;
  edgeId: string;
}

export interface FlowChartCanvasProps {
  data: FlowData;
  width?: number;
  height?: number;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  selectedCategoryId?: string | null;
  connectingFrom?: string | null;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

function getCurvePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  return { cx1: from.x + dx * 0.4, cy1: from.y, cx2: to.x - dx * 0.4, cy2: to.y };
}

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function getPointOnCurve(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  const { cx1, cy1, cx2, cy2 } = getCurvePath(from, to);
  return {
    x: cubicBezier(t, from.x, cx1, cx2, to.x),
    y: cubicBezier(t, from.y, cy1, cy2, to.y),
  };
}

export default function FlowChartCanvas({
  data,
  width = 1200,
  height = 660,
  selectedNodeId,
  selectedEdgeId,
  selectedCategoryId,
  connectingFrom,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDoubleClick,
  onContextMenu,
}: FlowChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const nodeMapRef = useRef<Map<string, FlowNode>>(new Map());
  const animatedValuesRef = useRef<Map<string, number>>(new Map());
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const map = new Map<string, FlowNode>();
    data.nodes.forEach((n) => map.set(n.id, n));
    nodeMapRef.current = map;

    const particles: Particle[] = [];
    data.edges.forEach((edge) => {
      const count = edge.particleCount || 4;
      const speed = (edge.speed || 1) * 0.003;
      for (let i = 0; i < count; i++) {
        particles.push({ t: Math.random(), speed: speed * (0.8 + Math.random() * 0.4), edgeId: edge.id });
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

    ctx.fillStyle = "hsl(222, 47%, 4%)";
    ctx.fillRect(0, 0, width, height);

    const nodeMap = nodeMapRef.current;
    const edgeMap = new Map<string, FlowEdge>();
    data.edges.forEach((e) => edgeMap.set(e.id, e));

    // Draw edges
    data.edges.forEach((edge) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = { x: fromNode.x, y: fromNode.y };
      const to = { x: toNode.x, y: toNode.y };
      const { cx1, cy1, cx2, cy2 } = getCurvePath(from, to);
      const color = edge.color || "cyan";
      const isSelected = selectedEdgeId === edge.id;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, to.x, to.y);
      ctx.strokeStyle = isSelected ? COLOR_MAP_SELECTED[color] : COLOR_MAP_DIM[color];
      ctx.lineWidth = isSelected ? 4 : 2;
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

      const from = { x: fromNode.x, y: fromNode.y };
      const to = { x: toNode.x, y: toNode.y };
      const pos = getPointOnCurve(from, to, p.t);
      const color = edge.color || "cyan";

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_MAP_DIM[color];
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_MAP_GLOW[color];
      ctx.fill();
    });

    // Draw categories
    data.categories?.forEach((cat) => {
      const color = COLOR_MAP[cat.color];
      const isSelected = selectedCategoryId === cat.id;
      
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = color;
      ctx.fillText(cat.label, cat.x, cat.y);
      ctx.beginPath();
      ctx.moveTo(cat.x, cat.y + 4);
      ctx.lineTo(cat.x + ctx.measureText(cat.label).width, cat.y + 4);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = isSelected ? 0.8 : 0.3;
      ctx.stroke();
      
      if (isSelected) {
        const textWidth = ctx.measureText(cat.label).width;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(cat.x - 8, cat.y - 12, textWidth + 16, 20);
        ctx.setLineDash([]);
      }
      
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    data.nodes.forEach((node) => {
      const color = node.color || "cyan";
      const coreColor = COLOR_MAP[color];
      const dimColor = COLOR_MAP_DIM[color];
      const isSelected = selectedNodeId === node.id;
      const isConnecting = connectingFrom === node.id;

      if (node.type === "source" || node.type === "destination") {
        ctx.fillStyle = dimColor;
        ctx.beginPath();
        ctx.arc(node.x - 12, node.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "400 12px 'Inter', sans-serif";
        ctx.fillStyle = isSelected ? coreColor : "hsl(210, 40%, 80%)";
        ctx.fillText(node.label, node.x, node.y + 4);

        if (isSelected) {
          const tw = ctx.measureText(node.label).width;
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;
          ctx.strokeRect(node.x - 16, node.y - 14, tw + 20, 28);
          ctx.globalAlpha = 1;
        }
      } else if (node.type === "metric" || node.type === "process") {
        const size = node.size || 60;
        const shape = node.shape || "circle";
        const animSpeed = node.animationSpeed || 1;

        // Update animated value
        if (node.animateValue) {
          if (!animatedValuesRef.current.has(node.id)) {
            const baseValue = typeof node.value === "number" ? node.value : 0;
            animatedValuesRef.current.set(node.id, baseValue);
          }
          const currentAnimated = animatedValuesRef.current.get(node.id) || 0;
          const increment = (animSpeed * Math.random()) * 0.5;
          animatedValuesRef.current.set(node.id, currentAnimated + increment);
        }

        const displayValue = node.animateValue 
          ? Math.floor(animatedValuesRef.current.get(node.id) || 0)
          : node.value;

        if (shape === "circle") {
          // Selection ring
          if (isSelected || isConnecting) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 8, 0, Math.PI * 2);
            ctx.strokeStyle = COLOR_MAP_SELECTED[color];
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
          ctx.strokeStyle = dimColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fillStyle = "hsla(222, 47%, 6%, 0.9)";
          ctx.fill();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;

          const gradient = ctx.createRadialGradient(node.x, node.y, size * 0.5, node.x, node.y, size * 1.3);
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(1, dimColor);
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        } else {
          // Rectangle shape
          const rectWidth = size * 1.8;
          const rectHeight = size * 1.2;
          const rectX = node.x - rectWidth / 2;
          const rectY = node.y - rectHeight / 2;

          // Selection ring
          if (isSelected || isConnecting) {
            ctx.strokeStyle = COLOR_MAP_SELECTED[color];
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(rectX - 6, rectY - 6, rectWidth + 12, rectHeight + 12);
            ctx.setLineDash([]);
          }

          // Background
          ctx.fillStyle = "hsla(222, 47%, 6%, 0.9)";
          ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

          // Border
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
          ctx.globalAlpha = 1;

          // Outer ring
          ctx.strokeStyle = dimColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(rectX - 2, rectY - 2, rectWidth + 4, rectHeight + 4);
        }

        if (displayValue !== undefined) {
          ctx.font = "700 22px 'JetBrains Mono', monospace";
          ctx.fillStyle = coreColor;
          ctx.textAlign = "center";
          ctx.fillText(String(displayValue), node.x, node.y + 2);
        }

        if (node.subLabel) {
          ctx.font = "500 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = COLOR_MAP_GLOW[color];
          ctx.textAlign = "center";
          ctx.fillText(node.subLabel, node.x, node.y - 20);
        }

        ctx.font = "500 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = "hsl(210, 20%, 55%)";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + 22);
        ctx.textAlign = "start";

        ctx.beginPath();
        ctx.arc(node.x - 30, node.y - 16, 3, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();
      }
    });

    // Connection mode indicator
    if (connectingFrom) {
      ctx.font = "500 12px 'JetBrains Mono', monospace";
      ctx.fillStyle = "hsl(185, 100%, 50%)";
      ctx.textAlign = "start";
      ctx.fillText("⚡ Click a node to connect", 20, height - 20);
    }

    // Increment time for animations
    timeRef.current += 1;

    animRef.current = requestAnimationFrame(draw);
  }, [data, width, height, selectedNodeId, selectedEdgeId, selectedCategoryId, connectingFrom]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: connectingFrom ? "crosshair" : "default" }}
      className="rounded-lg"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    />
  );
}
