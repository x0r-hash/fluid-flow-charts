import { useEffect, useState, useRef, useCallback } from "react";
import DashboardNav from "@/components/DashboardNav";
import FlowChartCanvas from "@/components/FlowChartCanvas";
import FlowNodeEditor from "@/components/FlowNodeEditor";
import FlowContextMenu from "@/components/FlowContextMenu";
import { mockFlowData } from "@/data/mockFlowData";
import { FlowNode, FlowEdge } from "@/types/flow";
import { useFlowEditor } from "@/hooks/useFlowEditor";
import { toast } from "sonner";

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 660 });

  const editor = useFlowEditor(mockFlowData);

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

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // left click only
      const pos = getCanvasPos(e);
      const node = editor.findNodeAt(pos.x, pos.y);

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
        editor.startDrag(node.id, pos.x, pos.y);
      } else {
        const edge = editor.findEdgeAt(pos.x, pos.y);
        if (edge) {
          editor.selectEdge(edge.id);
        } else {
          editor.selectNode(null);
          editor.selectEdge(null);
        }
      }
    },
    [editor, getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (editor.state.isDragging) {
        const pos = getCanvasPos(e);
        editor.drag(pos.x, pos.y);
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
      if (node) {
        editor.openEditNode(node.id);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />
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
        >
          <FlowChartCanvas
            data={editor.flowData}
            width={dimensions.width}
            height={dimensions.height}
            selectedNodeId={editor.state.selectedNodeId}
            selectedEdgeId={editor.state.selectedEdgeId}
            connectingFrom={editor.state.connectingFrom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
          />
        </FlowContextMenu>

        {editor.state.editingNode && (
          <FlowNodeEditor
            node={editor.state.editingNode}
            onSave={editor.saveEditNode}
            onClose={editor.closeEditNode}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
