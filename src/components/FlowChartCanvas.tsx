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
  cyan: "hsla(185, 100%, 50%, 0.12)",
  purple: "hsla(270, 80%, 60%, 0.12)",
  green: "hsla(155, 100%, 50%, 0.12)",
  orange: "hsla(35, 100%, 55%, 0.12)",
  red: "hsla(0, 100%, 50%, 0.12)",
  yellow: "hsla(60, 100%, 50%, 0.12)",
  blue: "hsla(220, 100%, 50%, 0.12)",
  pink: "hsla(320, 100%, 50%, 0.12)",
  gray: "hsla(0, 0%, 60%, 0.12)",
  lime: "hsla(120, 100%, 50%, 0.12)",
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

const COLOR_RGB: Record<string, [number, number, number]> = {
  cyan: [0, 255, 255],
  purple: [153, 102, 255],
  green: [0, 255, 170],
  orange: [255, 170, 40],
  red: [255, 60, 60],
  yellow: [255, 255, 60],
  blue: [60, 120, 255],
  pink: [255, 60, 200],
  gray: [150, 150, 150],
  lime: [60, 255, 60],
};

interface Particle {
  t: number;
  speed: number;
  edgeId: string;
  size: number;
  opacity: number;
}

interface NodeAnimation {
  nodeId: string;
  type: "enter" | "exit";
  progress: number;
  startTime: number;
}

export interface FlowChartCanvasProps {
  data: FlowData;
  width?: number;
  height?: number;
  selectedNodeId?: string | null;
  selectedNodeIds?: string[];
  selectedEdgeId?: string | null;
  selectedCategoryId?: string | null;
  connectingFrom?: string | null;
  hoveredNodeId?: string | null;
  getNodeAnimations?: () => NodeAnimation[];
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

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export default function FlowChartCanvas({
  data,
  width = 1200,
  height = 660,
  selectedNodeId,
  selectedNodeIds = [],
  selectedEdgeId,
  selectedCategoryId,
  connectingFrom,
  hoveredNodeId,
  getNodeAnimations,
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
        particles.push({
          t: Math.random(),
          speed: speed * (0.8 + Math.random() * 0.4),
          edgeId: edge.id,
          size: 1.5 + Math.random() * 2,
          opacity: 0.5 + Math.random() * 0.5,
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

    timeRef.current += 0.016;
    const time = timeRef.current;

    // === BACKGROUND ===
    // Dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "hsl(222, 47%, 5%)");
    bgGrad.addColorStop(0.5, "hsl(222, 47%, 3%)");
    bgGrad.addColorStop(1, "hsl(222, 47%, 5%)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dot grid
    const gridSize = 30;
    const dotRadius = 0.6;
    ctx.fillStyle = "hsla(210, 20%, 30%, 0.15)";
    for (let gx = gridSize; gx < width; gx += gridSize) {
      for (let gy = gridSize; gy < height; gy += gridSize) {
        ctx.beginPath();
        ctx.arc(gx, gy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const nodeMap = nodeMapRef.current;
    const edgeMap = new Map<string, FlowEdge>();
    data.edges.forEach((e) => edgeMap.set(e.id, e));

    // Node animations
    const animations = getNodeAnimations ? getNodeAnimations() : [];
    const now = performance.now();
    const animScales = new Map<string, number>();
    const ANIM_DURATION = 400;
    for (let i = animations.length - 1; i >= 0; i--) {
      const anim = animations[i];
      const elapsed = now - anim.startTime;
      anim.progress = Math.min(elapsed / ANIM_DURATION, 1);
      if (anim.type === "enter") {
        animScales.set(anim.nodeId, easeOutBack(anim.progress));
      } else {
        animScales.set(anim.nodeId, 1 - anim.progress);
      }
      if (anim.progress >= 1) animations.splice(i, 1);
    }

    // === DRAW EDGES ===
    data.edges.forEach((edge) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = { x: fromNode.x, y: fromNode.y };
      const to = { x: toNode.x, y: toNode.y };
      const { cx1, cy1, cx2, cy2 } = getCurvePath(from, to);
      const color = edge.color || "cyan";
      const isSelected = selectedEdgeId === edge.id;
      const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;

      // Gradient edge
      const edgeGrad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      if (isSelected) {
        edgeGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.7)`);
        edgeGrad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`);
      } else {
        edgeGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`);
        edgeGrad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.08)`);
      }

      // Edge glow (behind)
      if (isSelected) {
        ctx.save();
        ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, to.x, to.y);
        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, to.x, to.y);
      ctx.strokeStyle = edgeGrad;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Edge label with pill background
      if (edge.label) {
        const mid = getPointOnCurve(from, to, 0.5);
        ctx.font = "600 9px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(edge.label).width;
        const pillW = tw + 14;
        const pillH = 18;

        drawRoundedRect(ctx, mid.x - pillW / 2, mid.y - pillH / 2, pillW, pillH, 9);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = COLOR_MAP_GLOW[color];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.label, mid.x, mid.y);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }
    });

    // === PARTICLES with trails ===
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
      const color = edge.color || "cyan";
      const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;

      // Trail
      const trailSteps = 4;
      for (let i = trailSteps; i >= 0; i--) {
        const tt = p.t - i * 0.012;
        if (tt < 0) continue;
        const pos = getPointOnCurve(from, to, tt);
        const trailOpacity = p.opacity * (1 - i / trailSteps) * 0.5;
        const trailSize = p.size * (1 - i / trailSteps * 0.5);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${trailOpacity})`;
        ctx.fill();
      }

      // Main particle with glow
      const pos = getPointOnCurve(from, to, p.t);
      ctx.save();
      ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.8)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.opacity})`;
      ctx.fill();
      ctx.restore();
    });

    // === CATEGORIES ===
    data.categories?.forEach((cat) => {
      const color = COLOR_MAP[cat.color];
      const isSelected = selectedCategoryId === cat.id;
      const rgb = COLOR_RGB[cat.color] || COLOR_RGB.cyan;

      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.letterSpacing = "2px";
      const tw = ctx.measureText(cat.label).width;

      // Subtle underline
      ctx.beginPath();
      ctx.moveTo(cat.x, cat.y + 5);
      ctx.lineTo(cat.x + tw, cat.y + 5);
      const underGrad = ctx.createLinearGradient(cat.x, 0, cat.x + tw, 0);
      underGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isSelected ? 0.6 : 0.3})`);
      underGrad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
      ctx.strokeStyle = underGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (isSelected) {
        drawRoundedRect(ctx, cat.x - 10, cat.y - 14, tw + 20, 24, 4);
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = color;
      ctx.fillText(cat.label, cat.x, cat.y);
      ctx.letterSpacing = "0px";
    });

    // === NODES ===
    data.nodes.forEach((node) => {
      const color = node.color || "cyan";
      const coreColor = COLOR_MAP[color];
      const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;
      const isSelected = selectedNodeId === node.id || selectedNodeIds.includes(node.id);
      const isConnecting = connectingFrom === node.id;
      const isHovered = hoveredNodeId === node.id;

      const scale = animScales.get(node.id) ?? 1;
      if (scale <= 0) return;

      ctx.save();
      if (scale !== 1) {
        ctx.translate(node.x, node.y);
        ctx.scale(scale, scale);
        ctx.translate(-node.x, -node.y);
      }

      if (node.type === "source" || node.type === "destination") {
        // === CARD-STYLE SOURCE/DESTINATION NODES ===
        const cardW = 170;
        const cardH = 28;
        const cardX = node.x - 18;
        const cardY = node.y - cardH / 2;
        const r = 6;

        // Hover/select glow
        if (isHovered || isSelected) {
          ctx.save();
          ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isSelected ? 0.4 : 0.2})`;
          ctx.shadowBlur = isSelected ? 16 : 10;
          drawRoundedRect(ctx, cardX, cardY, cardW, cardH, r);
          ctx.fillStyle = "transparent";
          ctx.fill();
          ctx.restore();
        }

        // Card background
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, r);
        const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        cardGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isHovered ? 0.08 : 0.03})`);
        cardGrad.addColorStop(1, "hsla(222, 47%, 6%, 0.8)");
        ctx.fillStyle = cardGrad;
        ctx.fill();

        // Card border
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, r);
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isSelected ? 0.6 : isHovered ? 0.35 : 0.15})`;
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.stroke();

        // Status dot with pulse
        const dotX = cardX + 12;
        const dotY = node.y;
        
        // Pulse ring
        if (isHovered || isSelected) {
          const pulseR = 5 + Math.sin(time * 3) * 2;
          ctx.beginPath();
          ctx.arc(dotX, dotY, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();

        // Label
        ctx.font = "500 11px 'Inter', sans-serif";
        ctx.fillStyle = isSelected ? coreColor : isHovered ? "hsl(210, 60%, 90%)" : "hsl(210, 30%, 70%)";
        ctx.fillText(node.label, cardX + 22, node.y + 4);

        // Connection port
        const portX = node.type === "source" ? cardX + cardW : cardX;
        ctx.beginPath();
        ctx.arc(portX, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isHovered ? 0.6 : 0.2})`;
        ctx.fill();

      } else if (node.type === "metric" || node.type === "process") {
        // === GLASSMORPHIC METRIC/PROCESS NODES ===
        const size = node.size || 60;
        const shape = node.shape || "circle";
        const animSpeed = node.animationSpeed || 1;

        // Animated value
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
          // === PULSING RINGS ===
          const ringCount = 3;
          for (let ri = 0; ri < ringCount; ri++) {
            const phase = (time * 0.8 + ri * 0.7) % 3;
            if (phase < 2) {
              const ringR = size + phase * 20;
              const ringAlpha = (1 - phase / 2) * 0.12;
              ctx.beginPath();
              ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${ringAlpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }

          // Selection ring
          if (isSelected || isConnecting) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 10, 0, Math.PI * 2);
            ctx.strokeStyle = COLOR_MAP_SELECTED[color];
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const dashOffset = time * 30;
            ctx.lineDashOffset = -dashOffset;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          }

          // Outer glow ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${isHovered ? 0.5 : 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Inner fill with radial gradient
          const innerGrad = ctx.createRadialGradient(
            node.x - size * 0.2, node.y - size * 0.2, 0,
            node.x, node.y, size
          );
          innerGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`);
          innerGrad.addColorStop(0.6, "hsla(222, 47%, 7%, 0.95)");
          innerGrad.addColorStop(1, "hsla(222, 47%, 4%, 0.98)");

          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fillStyle = innerGrad;
          ctx.fill();

          // Border with gradient arc (partial border effect)
          ctx.beginPath();
          const arcStart = -Math.PI / 2 + time * 0.3;
          ctx.arc(node.x, node.y, size, arcStart, arcStart + Math.PI * 1.5);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Remaining arc dimmer
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, arcStart + Math.PI * 1.5, arcStart + Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Ambient glow
          if (isHovered) {
            const glowGrad = ctx.createRadialGradient(node.x, node.y, size * 0.8, node.x, node.y, size * 1.8);
            glowGrad.addColorStop(0, "transparent");
            glowGrad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`);
            ctx.beginPath();
            ctx.arc(node.x, node.y, size * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();
          }

        } else {
          // === RECTANGLE / HEXAGONAL HYBRID ===
          const rectW = size * 2;
          const rectH = size * 1.4;
          const rectX = node.x - rectW / 2;
          const rectY = node.y - rectH / 2;
          const cornerR = 12;

          // Selection
          if (isSelected || isConnecting) {
            drawRoundedRect(ctx, rectX - 6, rectY - 6, rectW + 12, rectH + 12, cornerR + 4);
            ctx.strokeStyle = COLOR_MAP_SELECTED[color];
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            const dashOffset = time * 30;
            ctx.lineDashOffset = -dashOffset;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineDashOffset = 0;
          }

          // Background
          const rectGrad = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
          rectGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`);
          rectGrad.addColorStop(1, "hsla(222, 47%, 5%, 0.95)");

          drawRoundedRect(ctx, rectX, rectY, rectW, rectH, cornerR);
          ctx.fillStyle = rectGrad;
          ctx.fill();

          // Animated border (top edge brighter)
          drawRoundedRect(ctx, rectX, rectY, rectW, rectH, cornerR);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Top accent line
          ctx.beginPath();
          ctx.moveTo(rectX + cornerR, rectY);
          ctx.lineTo(rectX + rectW - cornerR, rectY);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Hover glow
          if (isHovered) {
            ctx.save();
            ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
            ctx.shadowBlur = 20;
            drawRoundedRect(ctx, rectX, rectY, rectW, rectH, cornerR);
            ctx.strokeStyle = "transparent";
            ctx.stroke();
            ctx.restore();
          }
        }

        // === VALUE TEXT ===
        if (displayValue !== undefined) {
          ctx.save();
          ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
          ctx.shadowBlur = 8;
          ctx.font = "700 24px 'JetBrains Mono', monospace";
          ctx.fillStyle = coreColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(displayValue), node.x, node.y - 2);
          ctx.restore();
        }

        // Sub-label (badge style)
        if (node.subLabel) {
          ctx.font = "600 8px 'JetBrains Mono', monospace";
          const slW = ctx.measureText(node.subLabel).width + 10;
          const slH = 14;
          const slX = node.x - slW / 2;
          const slY = node.y - (node.shape === "circle" ? 24 : 28);

          drawRoundedRect(ctx, slX, slY, slW, slH, 7);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`;
          ctx.fill();

          ctx.fillStyle = COLOR_MAP_GLOW[color];
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.subLabel, node.x, slY + slH / 2);
        }

        // Label
        ctx.font = "500 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = "hsl(210, 20%, 55%)";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(node.label, node.x, node.y + (node.shape === "circle" ? 22 : (node.size || 60) * 0.7 + 14));

        // Status indicator dot (top-left)
        const dotOffset = node.shape === "circle" ? size * 0.65 : (node.size || 60) * 0.85;
        ctx.beginPath();
        ctx.arc(node.x - dotOffset + 6, node.y - dotOffset + 12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();

        // Tiny glow on status dot
        ctx.beginPath();
        ctx.arc(node.x - dotOffset + 6, node.y - dotOffset + 12, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`;
        ctx.fill();

        ctx.textAlign = "start";
      }

      ctx.restore();
    });

    // === CONNECTION MODE INDICATOR ===
    if (connectingFrom) {
      const indicatorW = 220;
      const indicatorH = 32;
      const ix = 20;
      const iy = height - 50;
      drawRoundedRect(ctx, ix, iy, indicatorW, indicatorH, 8);
      ctx.fillStyle = "hsla(185, 100%, 50%, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "hsla(185, 100%, 50%, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "hsl(185, 100%, 50%)";
      ctx.textBaseline = "middle";
      ctx.fillText("⚡ Click a node to connect", ix + 12, iy + indicatorH / 2);
      ctx.textBaseline = "alphabetic";
    }

    // Shortcuts hint
    ctx.font = "400 9px 'JetBrains Mono', monospace";
    ctx.fillStyle = "hsla(210, 20%, 40%, 0.3)";
    ctx.textAlign = "end";
    ctx.fillText("Del · Ctrl+Z · Ctrl+A · ↑↓←→", width - 14, height - 12);
    ctx.textAlign = "start";

    animRef.current = requestAnimationFrame(draw);
  }, [data, width, height, selectedNodeId, selectedNodeIds, selectedEdgeId, selectedCategoryId, connectingFrom, hoveredNodeId, getNodeAnimations]);

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
