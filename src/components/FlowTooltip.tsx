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
        className="backdrop-blur-xl border rounded-lg px-4 py-3 shadow-elevated min-w-[220px] max-w-[300px] font-mono text-xs space-y-2"
        style={{
          background: "hsla(222, 47%, 8%, 0.95)",
          borderColor: `${accentColor}40`,
          boxShadow: `0 0 32px ${accentColor}20, 0 12px 40px hsla(0,0%,0%,0.6)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full inline-block ring-2 ring-offset-1.5 flex-shrink-0"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 12px ${accentColor}`,
              ringOffsetColor: "hsla(222, 47%, 8%, 0.95)",
            }}
          />
          <span className="text-foreground font-bold text-sm truncate flex-1">
            {node.label}
          </span>
          <span
            className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-md font-semibold flex-shrink-0 whitespace-nowrap"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {node.type}
          </span>
        </div>

        {/* Value */}
        {node.value !== undefined && (
          <div
            className="text-2xl font-bold tracking-tighter"
            style={{ color: accentColor, textShadow: `0 0 16px ${accentColor}50` }}
          >
            {node.value}
          </div>
        )}

        {node.subLabel && (
          <div className="text-[10px] text-muted-foreground opacity-70">{node.subLabel}</div>
        )}

        {/* Connections */}
        {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
          <div
            className="border-t pt-2 space-y-1.5 text-muted-foreground"
            style={{ borderColor: "hsla(210, 20%, 30%, 0.4)" }}
          >
            {outgoingEdges.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] opacity-50 font-semibold flex-shrink-0 pt-0.5">OUT</span>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground font-bold">{outgoingEdges.length}</span>
                  <span className="text-[10px] opacity-60 ml-1">
                    {outgoingEdges.slice(0, 2).map((e) => getNodeLabel(e.to)).join(", ")}
                    {outgoingEdges.length > 2 ? "…" : ""}
                  </span>
                </div>
              </div>
            )}
            {incomingEdges.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] opacity-50 font-semibold flex-shrink-0 pt-0.5">IN</span>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground font-bold">{incomingEdges.length}</span>
                  <span className="text-[10px] opacity-60 ml-1">
                    {incomingEdges.slice(0, 2).map((e) => getNodeLabel(e.from)).join(", ")}
                    {incomingEdges.length > 2 ? "…" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coordinates */}
        <div className="text-[9px] text-muted-foreground opacity-50 pt-1 border-t" style={{ borderColor: "hsla(210, 20%, 30%, 0.3)" }}>
          <span>x:{Math.round(node.x)} · y:{Math.round(node.y)}</span>
          {node.size && <span className="ml-2">r:{node.size}</span>}
        </div>
      </div>
    </div>
  );
}
