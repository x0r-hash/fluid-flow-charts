import { useState } from "react";
import { Pipeline } from "@/types/pipeline";
import { FlowNode } from "@/types/flow";
import {
  Play,
  Pause,
  Trash2,
  Plus,
  Activity,
  Zap,
  TrendingUp,
  Heart,
  BarChart3,
  Signal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PipelineMetricSnapshot } from "@/types/pipeline";

interface PipelineManagerProps {
  pipelines: Pipeline[];
  history: Map<string, PipelineMetricSnapshot[]>;
  metricNodes: FlowNode[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (pipeline: Omit<Pipeline, "id" | "createdAt">) => void;
  onUpdate: (id: string, updates: Partial<Pipeline>) => void;
}

const DATA_SOURCE_ICONS: Record<Pipeline["dataSource"], React.ReactNode> = {
  random_walk: <Activity className="w-3.5 h-3.5" />,
  sine_wave: <TrendingUp className="w-3.5 h-3.5" />,
  spike_pattern: <Zap className="w-3.5 h-3.5" />,
  steady_climb: <BarChart3 className="w-3.5 h-3.5" />,
  heartbeat: <Heart className="w-3.5 h-3.5" />,
};

const DATA_SOURCE_LABELS: Record<Pipeline["dataSource"], string> = {
  random_walk: "Random Walk",
  sine_wave: "Sine Wave",
  spike_pattern: "Spike Pattern",
  steady_climb: "Steady Climb",
  heartbeat: "Heartbeat",
};

const STATUS_COLORS: Record<Pipeline["status"], string> = {
  active: "bg-emerald-500",
  paused: "bg-amber-500",
  error: "bg-red-500",
};

function MiniSparkline({ data }: { data: PipelineMetricSnapshot[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PipelineCard({
  pipeline,
  history,
  metricNodes,
  onStart,
  onPause,
  onRemove,
}: {
  pipeline: Pipeline;
  history: PipelineMetricSnapshot[];
  metricNodes: FlowNode[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const targetNode = metricNodes.find((n) => n.id === pipeline.targetNodeId);

  return (
    <div className="border border-border rounded-lg bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-primary/30">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[pipeline.status]} ${pipeline.status === "active" ? "animate-pulse" : ""}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground truncate">
              {pipeline.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              → {targetNode?.label || pipeline.targetNodeId}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {pipeline.lastValue !== undefined && (
            <span className="font-mono text-xs text-primary text-glow-cyan tabular-nums">
              {Math.round(pipeline.lastValue).toLocaleString()}
            </span>
          )}
          {DATA_SOURCE_ICONS[pipeline.dataSource]}
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Sparkline bar */}
      <div className="px-3 pb-1">
        <MiniSparkline data={history} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2 animate-fade-in">
          <p className="text-xs text-muted-foreground">{pipeline.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Source: </span>
              <span className="text-foreground">{DATA_SOURCE_LABELS[pipeline.dataSource]}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interval: </span>
              <span className="text-foreground">{pipeline.interval}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">Range: </span>
              <span className="text-foreground">
                {pipeline.minValue.toLocaleString()} – {pipeline.maxValue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className={pipeline.status === "active" ? "text-emerald-400" : pipeline.status === "paused" ? "text-amber-400" : "text-red-400"}>
                {pipeline.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {pipeline.status === "active" ? (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onPause(pipeline.id)}>
                <Pause className="w-3 h-3" /> Pause
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onStart(pipeline.id)}>
                <Play className="w-3 h-3" /> Start
              </Button>
            )}
            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => onRemove(pipeline.id)}>
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddPipelineDialog({
  metricNodes,
  onAdd,
}: {
  metricNodes: FlowNode[];
  onAdd: PipelineManagerProps["onAdd"];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetNodeId, setTargetNodeId] = useState("");
  const [dataSource, setDataSource] = useState<Pipeline["dataSource"]>("random_walk");
  const [interval, setInterval] = useState(2000);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(1000);
  const [color, setColor] = useState<Pipeline["color"]>("cyan");

  const handleSubmit = () => {
    if (!name || !targetNodeId) return;
    onAdd({
      name,
      description,
      status: "active",
      targetNodeId,
      interval,
      dataSource,
      minValue,
      maxValue,
      color,
    });
    setOpen(false);
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-mono border-primary/30 hover:border-primary/60">
          <Plus className="w-3.5 h-3.5" /> New Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary text-glow-cyan">Create Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-mono">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Pipeline" className="font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs font-mono">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this pipeline does..." className="font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs font-mono">Target Node</Label>
            <Select value={targetNodeId} onValueChange={setTargetNodeId}>
              <SelectTrigger className="font-mono text-sm">
                <SelectValue placeholder="Select a metric node" />
              </SelectTrigger>
              <SelectContent>
                {metricNodes.map((n) => (
                  <SelectItem key={n.id} value={n.id} className="font-mono text-sm">
                    {n.label} ({n.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono">Data Pattern</Label>
            <Select value={dataSource} onValueChange={(v) => setDataSource(v as Pipeline["dataSource"])}>
              <SelectTrigger className="font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATA_SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="font-mono text-sm">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs font-mono">Min</Label>
              <Input type="number" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} className="font-mono text-sm" />
            </div>
            <div>
              <Label className="text-xs font-mono">Max</Label>
              <Input type="number" value={maxValue} onChange={(e) => setMaxValue(Number(e.target.value))} className="font-mono text-sm" />
            </div>
            <div>
              <Label className="text-xs font-mono">Interval (ms)</Label>
              <Input type="number" value={interval} onChange={(e) => setInterval(Number(e.target.value))} className="font-mono text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono">Color</Label>
            <Select value={color} onValueChange={(v) => setColor(v as Pipeline["color"])}>
              <SelectTrigger className="font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["cyan", "purple", "green", "orange"] as const).map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-sm capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!name || !targetNodeId} className="w-full font-mono">
            <Signal className="w-4 h-4 mr-2" /> Activate Pipeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelineManager({
  pipelines,
  history,
  metricNodes,
  onStart,
  onPause,
  onRemove,
  onAdd,
}: PipelineManagerProps) {
  const activeCount = pipelines.filter((p) => p.status === "active").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Signal className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-sm text-foreground">PIPELINES</span>
          <span className="font-mono text-xs text-muted-foreground">
            {activeCount}/{pipelines.length} active
          </span>
        </div>
        <AddPipelineDialog metricNodes={metricNodes} onAdd={onAdd} />
      </div>

      {/* Pipeline list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Signal className="w-8 h-8 mb-2 opacity-40" />
            <p className="font-mono text-sm">No pipelines configured</p>
            <p className="font-mono text-xs mt-1">Create one to start streaming data</p>
          </div>
        ) : (
          pipelines.map((p) => (
            <PipelineCard
              key={p.id}
              pipeline={p}
              history={history.get(p.id) || []}
              metricNodes={metricNodes}
              onStart={onStart}
              onPause={onPause}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>
          <span className="text-emerald-400">{activeCount}</span> streaming
        </span>
        <span>
          {pipelines.filter((p) => p.status === "paused").length} paused
        </span>
      </div>
    </div>
  );
}
