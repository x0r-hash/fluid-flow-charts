import { useEffect, useState, useRef, useCallback } from "react";
import DashboardNav from "@/components/DashboardNav";
import FlowChartCanvas from "@/components/FlowChartCanvas";
import FlowNodeEditor from "@/components/FlowNodeEditor";
import FlowCategoryEditor from "@/components/FlowCategoryEditor";
import FlowContextMenu from "@/components/FlowContextMenu";
import FlowTooltip from "@/components/FlowTooltip";
import DataManager from "@/components/DataManager";
import { mockFlowData } from "@/data/mockFlowData";
import { FlowNode, FlowEdge, FlowData } from "@/types/flow";
import { useFlowEditor } from "@/hooks/useFlowEditor";
import { toast } from "sonner";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 660 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const editor = useFlowEditor(mockFlowData);

  const handleDataChange = useCallback((newData: FlowData) => {
    editor.loadFlowData(newData);
    toast.info("Graph configuration updated");
  }, [editor]);

  const handleReset = useCallback(() => {
    editor.loadFlowData(mockFlowData);
    toast.info("Reset to default data");
  }, [editor]);

  const [contextTarget, setContextTarget] = useState<{
    node: FlowNode | null;
    edge: FlowEdge | null;
    pos: { x: number; y: number };
  }>({ node: null, edge: null, pos: { x: 0, y: 0 } });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.max(600, window.innerHeight - 80);
        setDimensions({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when editing in dialogs/inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        editor.removeSelectedNodes();
        toast.success("Deleted");
      } else if (e.key === "Escape") {
        editor.cancelConnect();
        editor.selectNode(null);
        editor.selectEdge(null);
        editor.selectCategory(null);
      } else if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        editor.selectAll();
        toast.info("All nodes selected");
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        editor.redo();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        editor.undo();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        editor.nudgeNodes(0, -10);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        editor.nudgeNodes(0, 10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        editor.nudgeNodes(-10, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        editor.nudgeNodes(10, 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const pos = getCanvasPos(e);
      const node = editor.findNodeAt(pos.x, pos.y);
      const category = editor.findCategoryAt(pos.x, pos.y);

      if (editor.state.connectingFrom) {
        if (node) {
          editor.endConnect(node.id);
          toast.success("Connection created");
        } else {
          editor.cancelConnect();
        }
        return;
      }

      if (node) {
        editor.startDrag(node.id, pos.x, pos.y, e.shiftKey);
      } else if (category) {
        editor.startCategoryDrag(category.id, pos.x, pos.y);
      } else {
        const edge = editor.findEdgeAt(pos.x, pos.y);
        if (edge) {
          editor.selectEdge(edge.id);
        } else {
          editor.selectNode(null);
          editor.selectEdge(null);
          editor.selectCategory(null);
        }
      }
    },
    [editor, getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      setMousePos(pos);

      // Hover detection
      const node = editor.findNodeAt(pos.x, pos.y);
      editor.setHoveredNode(node?.id || null);

      if (editor.state.isDragging) {
        if (editor.state.selectedNodeId) {
          editor.drag(pos.x, pos.y);
        } else if (editor.state.selectedCategoryId) {
          editor.dragCategory(pos.x, pos.y);
        }
      }
    },
    [editor, getCanvasPos]
  );

  const handleMouseUp = useCallback(() => {
    editor.endDrag();
  }, [editor]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      const node = editor.findNodeAt(pos.x, pos.y);
      const category = editor.findCategoryAt(pos.x, pos.y);

      if (node) {
        editor.openEditNode(node.id);
      } else if (category) {
        editor.openEditCategory(category.id);
      }
    },
    [editor, getCanvasPos]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      const node = editor.findNodeAt(pos.x, pos.y);
      const edge = node ? null : editor.findEdgeAt(pos.x, pos.y);
      setContextTarget({ node, edge, pos });
    },
    [editor, getCanvasPos]
  );

  const handleAddNode = useCallback(
    (x: number, y: number, type: FlowNode["type"]) => {
      editor.addNode(x, y, type);
      toast.success("Node added — double-click to edit");
    },
    [editor]
  );

  const handleAddCategory = useCallback(
    (x: number, y: number, color: "cyan" | "purple" | "green" | "orange") => {
      editor.addCategory(x, y, color);
      toast.success("Category added — double-click to edit");
    },
    [editor]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      editor.removeNode(nodeId);
      toast.success("Node deleted");
    },
    [editor]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      editor.removeEdge(edgeId);
      toast.success("Connection deleted");
    },
    [editor]
  );

  const handleStartConnect = useCallback(
    (nodeId: string) => {
      editor.startConnect(nodeId);
      toast.info("Click another node to connect");
    },
    [editor]
  );

  // Get hovered node for tooltip
  const hoveredNode = editor.state.hoveredNodeId
    ? editor.flowData.nodes.find((n) => n.id === editor.state.hoveredNodeId) || null
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-between items-center">
        <DashboardNav />
        <DataManager
          data={editor.flowData}
          onDataChange={handleDataChange}
          onReset={handleReset}
        />
      </div>
      <main ref={containerRef} className="flex-1 overflow-hidden p-2 relative">
        <FlowContextMenu
          targetNode={contextTarget.node}
          targetEdge={contextTarget.edge}
          contextPos={contextTarget.pos}
          onEditNode={editor.openEditNode}
          onDeleteNode={handleDeleteNode}
          onChangeNodeColor={editor.changeNodeColor}
          onAddNode={handleAddNode}
          onDeleteEdge={handleDeleteEdge}
          onChangeEdgeColor={editor.changeEdgeColor}
          onStartConnect={handleStartConnect}
          onAddCategory={handleAddCategory}
        >
          <FlowChartCanvas
            data={editor.flowData}
            width={dimensions.width}
            height={dimensions.height}
            selectedNodeId={editor.state.selectedNodeId}
            selectedNodeIds={editor.state.selectedNodeIds}
            selectedEdgeId={editor.state.selectedEdgeId}
            selectedCategoryId={editor.state.selectedCategoryId}
            connectingFrom={editor.state.connectingFrom}
            hoveredNodeId={editor.state.hoveredNodeId}
            getNodeAnimations={editor.getNodeAnimations}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
          />
        </FlowContextMenu>

        {/* Hover tooltip */}
        {hoveredNode && !editor.state.isDragging && (
          <FlowTooltip
            node={hoveredNode}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            flowData={editor.flowData}
          />
        )}

        {editor.state.editingNode && (
          <FlowNodeEditor
            node={editor.state.editingNode}
            onSave={editor.saveEditNode}
            onClose={editor.closeEditNode}
          />
        )}

        {editor.state.editingCategory && (
          <FlowCategoryEditor
            category={editor.state.editingCategory}
            onSave={editor.saveEditCategory}
            onClose={editor.closeEditCategory}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
