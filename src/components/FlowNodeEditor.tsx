import { useState } from "react";
import { FlowNode } from "@/types/flow";
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

const TYPE_OPTIONS: { value: FlowNode["type"]; label: string }[] = [
  { value: "source", label: "Source" },
  { value: "destination", label: "Destination" },
  { value: "metric", label: "Metric" },
  { value: "process", label: "Process" },
];

interface FlowNodeEditorProps {
  node: FlowNode;
  onSave: (node: FlowNode) => void;
  onClose: () => void;
}

export default function FlowNodeEditor({ node, onSave, onClose }: FlowNodeEditorProps) {
  const [form, setForm] = useState<FlowNode>({ ...node });

  const update = <K extends keyof FlowNode>(key: K, value: FlowNode[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isCircleType = form.type === "metric" || form.type === "process";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Node</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-mono">LABEL</Label>
            <Input
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">TYPE</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v as FlowNode["type"])}>
                <SelectTrigger className="bg-background border-border font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">COLOR</Label>
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
          </div>

          {isCircleType && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-mono">VALUE</Label>
                  <Input
                    value={form.value ?? ""}
                    onChange={(e) => update("value", e.target.value)}
                    className="bg-background border-border font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-mono">SIZE</Label>
                  <Input
                    type="number"
                    value={form.size ?? 60}
                    onChange={(e) => update("size", parseInt(e.target.value) || 60)}
                    className="bg-background border-border font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-mono">SUB LABEL</Label>
                <Input
                  value={form.subLabel ?? ""}
                  onChange={(e) => update("subLabel", e.target.value)}
                  className="bg-background border-border font-mono text-sm"
                />
              </div>
            </>
          )}
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
