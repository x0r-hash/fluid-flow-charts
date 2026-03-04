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

interface AmbientStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  rgb: [number, number, number];
}

interface Particle {
  id: string; // Unique identifier for each particle
  t: number;
  speed: number;
  edgeId: string;
  size: number;
  opacity: number;
  createdAt: number; // Animation time when this particle was created
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
  selectedCategoryIds?: string[];
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

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.85, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.85, cy);
  ctx.closePath();
}

function drawParallelogram(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const w = r * 1.8;
  const h = r * 1.1;
  const skew = r * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + skew, cy - h / 2);
  ctx.lineTo(cx + w / 2 + skew, cy - h / 2);
  ctx.lineTo(cx + w / 2 - skew, cy + h / 2);
  ctx.lineTo(cx - w / 2 - skew, cy + h / 2);
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5;
  const innerR = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : innerR;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawPentagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawOctagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 8;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawShape(ctx: CanvasRenderingContext2D, shape: string, cx: number, cy: number, r: number) {
  switch (shape) {
    case "diamond": drawDiamond(ctx, cx, cy, r); break;
    case "hexagon": drawHexagon(ctx, cx, cy, r); break;
    case "parallelogram": drawParallelogram(ctx, cx, cy, r); break;
    case "triangle": drawTriangle(ctx, cx, cy, r); break;
    case "star": drawStar(ctx, cx, cy, r); break;
    case "pentagon": drawPentagon(ctx, cx, cy, r); break;
    case "octagon": drawOctagon(ctx, cx, cy, r); break;
    case "rectangle": {
      const w = r * 2;
      const h = r * 1.4;
      drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 12);
      break;
    }
    default: // circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
  }
}

export default function FlowChartCanvas({
  data,
  width = 1200,
  height = 660,
  selectedNodeId,
  selectedNodeIds = [],
  selectedEdgeId,
  selectedCategoryId,
  selectedCategoryIds = [],
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
  const ambientStarsRef = useRef<AmbientStar[]>([]);
  const animRef = useRef<number>(0);
  const nodeMapRef = useRef<Map<string, FlowNode>>(new Map());
  const animatedValuesRef = useRef<Map<string, number>>(new Map());
  const timeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const pulseWavesRef = useRef<PulseWave[]>([]);
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const particleIdCounterRef = useRef<number>(0); // Unique ID generator for particles

  // Store all render props in refs so draw callback is stable
  const propsRef = useRef({
    data, width, height, selectedNodeId, selectedNodeIds, selectedEdgeId,
    selectedCategoryId, selectedCategoryIds, connectingFrom, hoveredNodeId, getNodeAnimations,
  });
  propsRef.current = {
    data, width, height, selectedNodeId, selectedNodeIds, selectedEdgeId,
    selectedCategoryId, selectedCategoryIds, connectingFrom, hoveredNodeId, getNodeAnimations,
  };

  useEffect(() => {
    const map = new Map<string, FlowNode>();
    data.nodes.forEach((n) => map.set(n.id, n));
    nodeMapRef.current = map;

    const particles: Particle[] = [];
    
    data.edges.forEach((edge) => {
      const count = edge.particleCount || 4;
      const speed = (edge.speed || 1) * 0.015;
      // Distribute particles evenly across the journey (0 to 1)
      for (let i = 0; i < count; i++) {
        const particleSpeed = speed * (0.8 + Math.random() * 0.4);
        particles.push({
          id: `particle-${particleIdCounterRef.current++}`, // Unique ID
          t: (i / count) * 0.9, // Stagger: particle 0 at 0%, particle 1 at 23%, etc.
          speed: particleSpeed,
          edgeId: edge.id,
          size: 1.5 + Math.random() * 2,
          opacity: 0.5 + Math.random() * 0.5,
          createdAt: 0, // Created at animation start
        });
      }
    });
    particlesRef.current = particles;

    // Initialize ambient stars
    if (ambientStarsRef.current.length === 0) {
      const stars: AmbientStar[] = [];
      for (let i = 0; i < 60; i++) {
        stars.push({
          x: Math.random() * 2000,
          y: Math.random() * 1200,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.1,
          size: 0.5 + Math.random() * 1.5,
          opacity: 0.1 + Math.random() * 0.3,
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
      ambientStarsRef.current = stars;
    }
  }, [data]);

  const draw = useCallback((timestamp?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { data, width, height, selectedNodeId, selectedNodeIds, selectedEdgeId,
      selectedCategoryId, selectedCategoryIds, connectingFrom, hoveredNodeId, getNodeAnimations } = propsRef.current;

    // Delta time for smooth animation
    const frameNow = timestamp || performance.now();
    const dt = lastFrameTimeRef.current ? Math.min((frameNow - lastFrameTimeRef.current) / 1000, 0.05) : 0.016;
    lastFrameTimeRef.current = frameNow;
    const dpr = window.devicePixelRatio || 1;
    const targetW = width * dpr;
    const targetH = height * dpr;
    if (canvasSizeRef.current.w !== targetW || canvasSizeRef.current.h !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvasSizeRef.current = { w: targetW, h: targetH };
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    timeRef.current += dt;
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

    // === FLOATING AMBIENT STARS ===
    ambientStarsRef.current.forEach((star) => {
      star.x += star.vx * (dt / 0.016);
      star.y += star.vy * (dt / 0.016);
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.opacity * twinkle;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210, 40%, 80%, ${alpha})`;
      ctx.fill();

      if (star.size > 1) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 40%, 80%, ${alpha * 0.08})`;
        ctx.fill();
      }
    });

    // === AMBIENT LIGHT BLEEDING from nodes ===
    data.nodes.forEach((node) => {
      if (node.type !== "metric" && node.type !== "process") return;
      const color = node.color || "cyan";
      const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;
      const size = node.size || 60;
      const bleedRadius = size * 3;
      const bleedGrad = ctx.createRadialGradient(node.x, node.y, size * 0.3, node.x, node.y, bleedRadius);
      bleedGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.04)`);
      bleedGrad.addColorStop(0.5, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.015)`);
      bleedGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(node.x, node.y, bleedRadius, 0, Math.PI * 2);
      ctx.fillStyle = bleedGrad;
      ctx.fill();
    });

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
    // Update pulse waves
    pulseWavesRef.current = pulseWavesRef.current.filter((pw) => {
      pw.radius += 1.8 * (dt / 0.016); // Reduced expansion speed
      pw.opacity -= 0.025 * (dt / 0.016); // Faster fade-out
      return pw.opacity > 0 && pw.radius < pw.maxRadius;
    });

    // Draw pulse waves
    pulseWavesRef.current.forEach((pw) => {
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${pw.rgb[0]}, ${pw.rgb[1]}, ${pw.rgb[2]}, ${pw.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Update particles with independent lifetimes
    const edgeParticleMap = new Map<string, Particle[]>();
    
    particlesRef.current = particlesRef.current.filter((p) => {
      p.t += p.speed * (dt / 0.016);
      
      // Remove particle only after it completes journey (independent of others)
      if (p.t > 1) {
        const edge = edgeMap.get(p.edgeId);
        if (edge) {
          const toNode = nodeMap.get(edge.to);
          if (toNode) {
            const color = edge.color || "cyan";
            const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;
            pulseWavesRef.current.push({
              x: toNode.x,
              y: toNode.y,
              radius: toNode.type === "metric" || toNode.type === "process" ? (toNode.size || 60) : 12,
              maxRadius: 80,
              opacity: 0.15,
              color,
              rgb,
            });
          }
        }
        return false; // Remove only this particle
      }
      
      // Track particles by edge for respawning
      if (!edgeParticleMap.has(p.edgeId)) {
        edgeParticleMap.set(p.edgeId, []);
      }
      edgeParticleMap.get(p.edgeId)!.push(p);
      return true; // Keep particle
    });
    
    // Respawn individual particles as they complete (not in groups)
    data.edges.forEach((edge) => {
      const currentParticles = edgeParticleMap.get(edge.id) || [];
      const targetCount = edge.particleCount || 4;
      const speed = (edge.speed || 1) * 0.015;
      
      // Only spawn one particle at a time to replace the one that just completed
      if (currentParticles.length < targetCount) {
        const particleSpeed = speed * (0.8 + Math.random() * 0.4);
        particlesRef.current.push({
          id: `particle-${particleIdCounterRef.current++}`, // Unique ID ensures independence
          t: 0, // Start fresh at source
          speed: particleSpeed,
          edgeId: edge.id,
          size: 1.5 + Math.random() * 2,
          opacity: 0.5 + Math.random() * 0.5,
          createdAt: time, // Track when this particle was created
        });
      }
    });

    particlesRef.current.forEach((p) => {
      
      const edge = edgeMap.get(p.edgeId);
      if (!edge) return;
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const from = { x: fromNode.x, y: fromNode.y };
      const to = { x: toNode.x, y: toNode.y };
      const color = edge.color || "cyan";
      const rgb = COLOR_RGB[color] || COLOR_RGB.cyan;

      // Long comet trail with fading gradient
      const trailSteps = 14;
      const trailSpacing = 0.008;
      for (let i = trailSteps; i >= 0; i--) {
        const tt = p.t - i * trailSpacing;
        if (tt < 0) continue;
        const pos = getPointOnCurve(from, to, tt);
        const fade = 1 - i / trailSteps;
        const trailOpacity = p.opacity * fade * fade * 0.6;
        const trailSize = p.size * (0.2 + fade * 0.8);

        // Outer glow for trail segments near the head
        if (i < 4) {
          const glowSize = trailSize * (3.5 - i * 0.6);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${trailOpacity * 0.12})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${trailOpacity})`;
        ctx.fill();
      }

      // Main particle head with intense glow
      const pos = getPointOnCurve(from, to, p.t);
      ctx.save();
      // Outer halo
      const haloGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 6);
      haloGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`);
      haloGrad.addColorStop(0.4, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`);
      haloGrad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 6, 0, Math.PI * 2);
      ctx.fillStyle = haloGrad;
      ctx.fill();
      // Bright core
      ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(rgb[0] + 80, 255)}, ${Math.min(rgb[1] + 80, 255)}, ${Math.min(rgb[2] + 80, 255)}, ${p.opacity})`;
      ctx.fill();
      // White-hot center
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.7})`;
      ctx.fill();
      ctx.restore();
    });

    // === CATEGORIES ===
    data.categories?.forEach((cat) => {
      const color = COLOR_MAP[cat.color];
      const isSelected = selectedCategoryId === cat.id || (selectedCategoryIds && selectedCategoryIds.includes(cat.id));
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
        const baseSize = node.size || 60;
        const shape = node.shape || "circle";
        const animSpeed = node.animationSpeed || 1;

        // Dynamic breathing — speed scales with node value
        const breathVal = typeof node.value === "number" ? node.value : 50;
        const breathSpeed = 1 + Math.min(breathVal / 200, 3); // higher value = faster
        const breathAmount = 3 + Math.min(breathVal / 100, 5);  // higher value = bigger pulse
        const breathScale = Math.sin(time * breathSpeed) * breathAmount;
        const size = baseSize + breathScale;

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

        const isPolygonShape = shape !== "circle";

        // === PULSING RINGS ===
        if (shape === "circle") {
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
        } else {
          // Pulse rings for polygon shapes — scale outward
          const ringCount = 3;
          for (let ri = 0; ri < ringCount; ri++) {
            const phase = (time * 0.8 + ri * 0.7) % 3;
            if (phase < 2) {
              const ringR = size + phase * 18;
              const ringAlpha = (1 - phase / 2) * 0.1;
              ctx.save();
              drawShape(ctx, shape, node.x, node.y, ringR);
              ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${ringAlpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // Selection ring
        if (isSelected || isConnecting) {
          if (shape === "circle") {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 10, 0, Math.PI * 2);
          } else {
            drawShape(ctx, shape, node.x, node.y, size + 10);
          }
          ctx.strokeStyle = COLOR_MAP_SELECTED[color];
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -(time * 30);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;
        }

        // Outer glow ring
        drawShape(ctx, shape, node.x, node.y, size + 2);
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

        drawShape(ctx, shape, node.x, node.y, size);
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Border with animated partial effect
        if (shape === "circle") {
          ctx.beginPath();
          const arcStart = -Math.PI / 2 + time * 0.3;
          ctx.arc(node.x, node.y, size, arcStart, arcStart + Math.PI * 1.5);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(node.x, node.y, size, arcStart + Math.PI * 1.5, arcStart + Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.1)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Animated dashed border for polygon shapes
          drawShape(ctx, shape, node.x, node.y, size);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([8, 4]);
          ctx.lineDashOffset = -(time * 20);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineDashOffset = 0;

          // Solid subtle overlay
          drawShape(ctx, shape, node.x, node.y, size);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Hover glow
        if (isHovered) {
          ctx.save();
          ctx.shadowColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`;
          ctx.shadowBlur = 20;
          drawShape(ctx, shape, node.x, node.y, size);
          ctx.strokeStyle = "transparent";
          ctx.stroke();
          ctx.restore();
        }

        // Inner decorative details for special shapes
        if (shape === "hexagon" || shape === "octagon") {
          // Inner concentric shape
          drawShape(ctx, shape, node.x, node.y, size * 0.6);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.08)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        if (shape === "star") {
          // Inner star rotation
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(time * 0.2);
          ctx.translate(-node.x, -node.y);
          drawShape(ctx, "star", node.x, node.y, size * 0.5);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }
        if (shape === "diamond") {
          // Cross-hair lines inside diamond
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - size * 0.4);
          ctx.lineTo(node.x, node.y + size * 0.4);
          ctx.moveTo(node.x - size * 0.35, node.y);
          ctx.lineTo(node.x + size * 0.35, node.y);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.06)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
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
          const slY = node.y - size * 0.45 - 16;

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
        ctx.fillText(node.label, node.x, node.y + size + 14);

        // Status indicator dot (top-left)
        const dotOffset = size * 0.65;
        ctx.beginPath();
        ctx.arc(node.x - dotOffset + 6, node.y - dotOffset + 12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = coreColor;
        ctx.fill();

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

    // === VIGNETTE EFFECT ===
    const vignetteGrad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.35,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    vignetteGrad.addColorStop(0, "transparent");
    vignetteGrad.addColorStop(1, "hsla(222, 47%, 2%, 0.5)");
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);

    // === CRT SCANLINES ===
    ctx.fillStyle = "hsla(0, 0%, 0%, 0.03)";
    for (let sy = 0; sy < height; sy += 3) {
      ctx.fillRect(0, sy, width, 1);
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    lastFrameTimeRef.current = 0;
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: connectingFrom ? "crosshair" : "default" }}
      className="rounded-lg shadow-elevated border border-border/50"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    />
  );
}
