import { FlowData } from "@/types/flow";
import { Activity, GitBranch, Circle, ArrowRightLeft } from "lucide-react";

interface FlowStatusBarProps {
  data: FlowData;
  selectedCount: number;
}

export default function FlowStatusBar({ data, selectedCount }: FlowStatusBarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="glass-effect-strong rounded-full shadow-xl-soft font-mono text-[11px] tracking-wider">
        <div className="flex items-center gap-5 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/70 animate-pulse-glow" />
            <span className="text-foreground font-semibold">{data.nodes.length}</span>
            <span className="text-muted-foreground">NODES</span>
          </div>
          <div className="w-[1px] h-4 bg-gradient-to-b from-border/30 via-border/50 to-border/30" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary/70 animate-pulse-glow" style={{ animationDelay: '0.4s' }} />
            <span className="text-foreground font-semibold">{data.edges.length}</span>
            <span className="text-muted-foreground">EDGES</span>
          </div>
          <div className="w-[1px] h-4 bg-gradient-to-b from-border/30 via-border/50 to-border/30" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent/70 animate-pulse-glow" style={{ animationDelay: '0.8s' }} />
            <span className="text-foreground font-semibold">{data.categories?.length || 0}</span>
            <span className="text-muted-foreground">GROUPS</span>
          </div>
          {selectedCount > 0 && (
            <>
              <div className="w-[1px] h-4 bg-gradient-to-b from-border/30 via-border/50 to-border/30" />
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Activity className="w-3 h-3 animate-pulse-glow" />
                <span>{selectedCount}</span>
                <span className="text-muted-foreground">SELECTED</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
