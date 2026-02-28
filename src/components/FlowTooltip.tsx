import { FlowNode, FlowData } from "@/types/flow";

const COLOR_HEX: Record<string, string> = {
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

interface FlowTooltipProps {
  node: FlowNode | null;
  mouseX: number;
  mouseY: number;
  flowData: FlowData;
}

export default function FlowTooltip({ node, mouseX, mouseY, flowData }: FlowTooltipProps) {
  if (!node) return null;

  const incomingEdges = flowData.edges.filter((e) => e.to === node.id);
  const outgoingEdges = flowData.edges.filter((e) => e.from === node.id);

  const getNodeLabel = (id: string) =>
    flowData.nodes.find((n) => n.id === id)?.label || id;

  const accentColor = COLOR_HEX[node.color || "cyan"];

  return (
    <div
      className="absolute z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: mouseX + 16,
        top: mouseY - 8,
      }}
    >
      <div
        className="backdrop-blur-xl border rounded-xl px-4 py-3 shadow-2xl min-w-[200px] max-w-[280px] font-mono text-xs"
        style={{
          background: "hsla(222, 47%, 8%, 0.92)",
          borderColor: `${accentColor}33`,
          boxShadow: `0 0 30px ${accentColor}15, 0 8px 32px hsla(0,0%,0%,0.5)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block ring-2 ring-offset-1 ring-offset-transparent"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              borderColor: `${accentColor}40`,
            }}
          />
          <span className="text-foreground font-bold text-sm truncate flex-1">
            {node.label}
          </span>
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-semibold"
            style={{
              background: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {node.type}
          </span>
        </div>

        {/* Value */}
        {node.value !== undefined && (
          <div
            className="text-2xl font-bold mb-1 tracking-tight"
            style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}60` }}
          >
            {node.value}
          </div>
        )}

        {node.subLabel && (
          <div className="text-[10px] text-muted-foreground mb-1 opacity-80">{node.subLabel}</div>
        )}

        {/* Connections */}
        <div
          className="border-t pt-2 mt-2 space-y-1 text-muted-foreground"
          style={{ borderColor: "hsla(210, 20%, 30%, 0.3)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] opacity-50">OUT</span>
            <span className="text-foreground font-semibold">{outgoingEdges.length}</span>
            <span className="truncate text-[10px] opacity-60">
              {outgoingEdges.slice(0, 2).map((e) => getNodeLabel(e.to)).join(", ")}
              {outgoingEdges.length > 2 ? "…" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] opacity-50">IN</span>
            <span className="text-foreground font-semibold">{incomingEdges.length}</span>
            <span className="truncate text-[10px] opacity-60">
              {incomingEdges.slice(0, 2).map((e) => getNodeLabel(e.from)).join(", ")}
              {incomingEdges.length > 2 ? "…" : ""}
            </span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="mt-1.5 text-[9px] text-muted-foreground opacity-40">
          x:{Math.round(node.x)} y:{Math.round(node.y)}
          {node.size && ` · r:${node.size}`}
        </div>
      </div>
    </div>
  );
}
