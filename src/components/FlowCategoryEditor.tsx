import { useState } from "react";
import { FlowCategory } from "@/types/flow";
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

interface FlowCategoryEditorProps {
  category: FlowCategory;
  onSave: (category: FlowCategory) => void;
  onClose: () => void;
}

export default function FlowCategoryEditor({ category, onSave, onClose }: FlowCategoryEditorProps) {
  const [form, setForm] = useState<FlowCategory>({ ...category });

  const update = <K extends keyof FlowCategory>(key: K, value: FlowCategory[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Category</DialogTitle>
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
              <Label className="text-muted-foreground text-xs font-mono">X</Label>
              <Input
                type="number"
                value={form.x}
                onChange={(e) => update("x", parseFloat(e.target.value) || 0)}
                className="bg-background border-border font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-mono">Y</Label>
              <Input
                type="number"
                value={form.y}
                onChange={(e) => update("y", parseFloat(e.target.value) || 0)}
                className="bg-background border-border font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-mono">COLOR</Label>
            <Select value={form.color} onValueChange={(v) => update("color", v as ColorOption)}>
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
