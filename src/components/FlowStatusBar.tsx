import { FlowData } from "@/types/flow";
import { Activity, GitBranch, Circle, ArrowRightLeft } from "lucide-react";

interface FlowStatusBarProps {
  data: FlowData;
  selectedCount: number;
}

export default function FlowStatusBar({ data, selectedCount }: FlowStatusBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="flex items-center gap-4 px-5 py-2.5 rounded-full border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 text-primary" />
          <span className="text-foreground font-semibold">{data.nodes.length}</span>
          <span>nodes</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5">
          <ArrowRightLeft className="w-3 h-3 text-secondary" />
          <span className="text-foreground font-semibold">{data.edges.length}</span>
          <span>edges</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 text-accent" />
          <span className="text-foreground font-semibold">{data.categories?.length || 0}</span>
          <span>groups</span>
        </div>
        {selectedCount > 0 && (
          <>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5 text-primary">
              <Activity className="w-3 h-3" />
              <span className="font-semibold">{selectedCount}</span>
              <span>selected</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
