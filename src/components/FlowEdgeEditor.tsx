import { useState } from "react";
import { FlowEdge } from "@/types/flow";
import { ColorOption } from "@/hooks/useFlowEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLOR_OPTIONS: { value: ColorOption; label: string; swatch: string }[] = [
  { value: "cyan", label: "Cyan", swatch: "hsl(185, 100%, 50%)" },
  { value: "purple", label: "Purple", swatch: "hsl(270, 80%, 60%)" },
  { value: "green", label: "Green", swatch: "hsl(155, 100%, 50%)" },
  { value: "orange", label: "Orange", swatch: "hsl(35, 100%, 55%)" },
  { value: "red", label: "Red", swatch: "hsl(0, 100%, 50%)" },
  { value: "yellow", label: "Yellow", swatch: "hsl(60, 100%, 50%)" },
  { value: "blue", label: "Blue", swatch: "hsl(220, 100%, 50%)" },
  { value: "pink", label: "Pink", swatch: "hsl(320, 100%, 50%)" },
  { value: "gray", label: "Gray", swatch: "hsl(0, 0%, 60%)" },
  { value: "lime", label: "Lime", swatch: "hsl(120, 100%, 50%)" },
];

interface FlowEdgeEditorProps {
  edge: FlowEdge;
  fromLabel: string;
  toLabel: string;
  onSave: (edge: FlowEdge) => void;
  onClose: () => void;
}

export default function FlowEdgeEditor({ edge, fromLabel, toLabel, onSave, onClose }: FlowEdgeEditorProps) {
  const [form, setForm] = useState<FlowEdge>({ ...edge });

  const update = <K extends keyof FlowEdge>(key: K, value: FlowEdge[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Connection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection info */}
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-background rounded-md px-3 py-2 border border-border">
            <span className="text-foreground font-semibold">{fromLabel}</span>
            <span className="opacity-50">→</span>
            <span className="text-foreground font-semibold">{toLabel}</span>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-mono">LABEL</Label>
            <Input
              value={form.label ?? ""}
              onChange={(e) => update("label", e.target.value)}
              placeholder="e.g. transforms, 500/sec, primary..."
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">EDGE COLOR</Label>
              <Select value={form.color || "cyan"} onValueChange={(v) => update("color", v as ColorOption)}>
                <SelectTrigger className="bg-background border-border font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ background: c.swatch }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">LABEL COLOR</Label>
              <Select value={form.labelColor || form.color || "cyan"} onValueChange={(v) => update("labelColor", v as ColorOption)}>
                <SelectTrigger className="bg-background border-border font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ background: c.swatch }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">PARTICLE COUNT</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={form.particleCount ?? 4}
                onChange={(e) => update("particleCount", parseInt(e.target.value) || 4)}
                className="bg-background border-border font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">SPEED</Label>
              <Input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={form.speed ?? 1}
                onChange={(e) => update("speed", parseFloat(e.target.value) || 1)}
                className="bg-background border-border font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="font-mono text-sm">
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} className="font-mono text-sm">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
