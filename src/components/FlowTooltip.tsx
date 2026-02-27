import { FlowNode, FlowEdge, FlowData } from "@/types/flow";

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

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: mouseX + 16,
        top: mouseY - 8,
      }}
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl min-w-[180px] max-w-[260px] font-mono text-xs">
        <div className="text-foreground font-bold text-sm mb-1 truncate">
          {node.label}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{
              background: `hsl(var(--${node.color === "cyan" ? "primary" : "accent"}))`,
              backgroundColor:
                node.color === "cyan"
                  ? "hsl(185, 100%, 50%)"
                  : node.color === "purple"
                  ? "hsl(270, 80%, 60%)"
                  : node.color === "green"
                  ? "hsl(155, 100%, 50%)"
                  : node.color === "orange"
                  ? "hsl(35, 100%, 55%)"
                  : "hsl(185, 100%, 50%)",
            }}
          />
          <span className="capitalize">{node.type}</span>
          {node.shape && <span>• {node.shape}</span>}
        </div>
        {node.value !== undefined && (
          <div className="text-primary font-bold text-base mb-1">{node.value}</div>
        )}
        {node.subLabel && (
          <div className="text-accent-foreground text-[10px]">{node.subLabel}</div>
        )}
        <div className="border-t border-border mt-1 pt-1 text-muted-foreground">
          <div>↗ {outgoingEdges.length} out: {outgoingEdges.slice(0, 2).map((e) => getNodeLabel(e.to)).join(", ")}{outgoingEdges.length > 2 ? "…" : ""}</div>
          <div>↙ {incomingEdges.length} in: {incomingEdges.slice(0, 2).map((e) => getNodeLabel(e.from)).join(", ")}{incomingEdges.length > 2 ? "…" : ""}</div>
        </div>
      </div>
    </div>
  );
}
