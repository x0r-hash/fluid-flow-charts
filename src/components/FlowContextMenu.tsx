import { FlowNode, FlowEdge, FlowCategory } from "@/types/flow";
import { ColorOption } from "@/hooks/useFlowEditor";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Pencil, Trash2, Plus, Link, Palette, Circle } from "lucide-react";

const COLORS: { value: ColorOption; label: string; swatch: string }[] = [
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

const NODE_TYPES: { value: FlowNode["type"]; label: string }[] = [
  { value: "source", label: "Source Node" },
  { value: "destination", label: "Destination Node" },
  { value: "metric", label: "Metric Node" },
  { value: "process", label: "Process Node" },
];

interface FlowContextMenuProps {
  children: React.ReactNode;
  targetNode: FlowNode | null;
  targetEdge: FlowEdge | null;
  targetCategory: FlowCategory | null;
  contextPos: { x: number; y: number };
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onChangeNodeColor: (nodeId: string, color: ColorOption) => void;
  onAddNode: (x: number, y: number, type: FlowNode["type"]) => void;
  onDeleteEdge: (edgeId: string) => void;
  onChangeEdgeColor: (edgeId: string, color: ColorOption) => void;
  onStartConnect: (nodeId: string) => void;
  onAddCategory: (x: number, y: number, color: ColorOption) => void;
  onEditCategory: (categoryId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function FlowContextMenu({
  children,
  targetNode,
  targetEdge,
  targetCategory,
  contextPos,
  onEditNode,
  onDeleteNode,
  onChangeNodeColor,
  onAddNode,
  onDeleteEdge,
  onChangeEdgeColor,
  onStartConnect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: FlowContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="bg-card border-border text-foreground min-w-[200px] font-mono text-sm">
        {targetCategory ? (
          <>
            <ContextMenuItem
              onClick={() => onEditCategory(targetCategory.id)}
              className="gap-2 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Category
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDeleteCategory(targetCategory.id)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete Category
            </ContextMenuItem>
          </>
        ) : targetNode ? (
          <>
            <ContextMenuItem
              onClick={() => onEditNode(targetNode.id)}
              className="gap-2 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Node
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onStartConnect(targetNode.id)}
              className="gap-2 cursor-pointer"
            >
              <Link className="w-4 h-4" />
              Connect To...
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                <Palette className="w-4 h-4" />
                Change Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                {COLORS.map((c) => (
                  <ContextMenuItem
                    key={c.value}
                    onClick={() => onChangeNodeColor(targetNode.id, c.value)}
                    className="gap-2 cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: c.swatch }}
                    />
                    {c.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDeleteNode(targetNode.id)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete Node
            </ContextMenuItem>
          </>
        ) : targetEdge ? (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                <Palette className="w-4 h-4" />
                Change Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                {COLORS.map((c) => (
                  <ContextMenuItem
                    key={c.value}
                    onClick={() => onChangeEdgeColor(targetEdge.id, c.value)}
                    className="gap-2 cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: c.swatch }}
                    />
                    {c.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDeleteEdge(targetEdge.id)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete Connection
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Node
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                {NODE_TYPES.map((t) => (
                  <ContextMenuItem
                    key={t.value}
                    onClick={() => onAddNode(contextPos.x, contextPos.y, t.value)}
                    className="gap-2 cursor-pointer"
                  >
                    <Circle className="w-3 h-3" />
                    {t.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Category
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-card border-border">
                {COLORS.map((c) => (
                  <ContextMenuItem
                    key={c.value}
                    onClick={() => onAddCategory(contextPos.x, contextPos.y, c.value)}
                    className="gap-2 cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: c.swatch }}
                    />
                    {c.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
