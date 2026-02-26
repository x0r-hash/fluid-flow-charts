import { useState, useCallback, useRef } from "react";
import { FlowData, FlowNode, FlowEdge } from "@/types/flow";

export type ColorOption = "cyan" | "purple" | "green" | "orange";

export interface FlowEditorState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isDragging: boolean;
  connectingFrom: string | null;
  editingNode: FlowNode | null;
}

export function useFlowEditor(initialData: FlowData) {
  const [flowData, setFlowData] = useState<FlowData>(initialData);
  const [state, setState] = useState<FlowEditorState>({
    selectedNodeId: null,
    selectedEdgeId: null,
    isDragging: false,
    connectingFrom: null,
    editingNode: null,
  });

  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const findNodeAt = useCallback(
    (x: number, y: number): FlowNode | null => {
      // Check metric/process nodes first (circles)
      for (const node of flowData.nodes) {
        if (node.type === "metric" || node.type === "process") {
          const size = node.size || 60;
          const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
          if (dist <= size + 4) return node;
        } else {
          // Source/destination text nodes – approximate hit box
          if (x >= node.x - 16 && x <= node.x + 160 && y >= node.y - 12 && y <= node.y + 12) {
            return node;
          }
        }
      }
      return null;
    },
    [flowData.nodes]
  );

  const findEdgeAt = useCallback(
    (x: number, y: number): FlowEdge | null => {
      const nodeMap = new Map(flowData.nodes.map((n) => [n.id, n]));
      for (const edge of flowData.edges) {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) continue;

        // Sample points along the bezier and check distance
        for (let t = 0; t <= 1; t += 0.02) {
          const dx = to.x - from.x;
          const cx1 = from.x + dx * 0.4;
          const cy1 = from.y;
          const cx2 = to.x - dx * 0.4;
          const cy2 = to.y;
          const u = 1 - t;
          const px = u ** 3 * from.x + 3 * u ** 2 * t * cx1 + 3 * u * t ** 2 * cx2 + t ** 3 * to.x;
          const py = u ** 3 * from.y + 3 * u ** 2 * t * cy1 + 3 * u * t ** 2 * cy2 + t ** 3 * to.y;
          const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
          if (dist < 8) return edge;
        }
      }
      return null;
    },
    [flowData.nodes, flowData.edges]
  );

  // Drag
  const startDrag = useCallback(
    (nodeId: string, mouseX: number, mouseY: number) => {
      const node = flowData.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      dragOffsetRef.current = { dx: mouseX - node.x, dy: mouseY - node.y };
      setState((s) => ({ ...s, selectedNodeId: nodeId, isDragging: true }));
    },
    [flowData.nodes]
  );

  const drag = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!state.isDragging || !state.selectedNodeId) return;
      const { dx, dy } = dragOffsetRef.current;
      setFlowData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === state.selectedNodeId ? { ...n, x: mouseX - dx, y: mouseY - dy } : n
        ),
      }));
    },
    [state.isDragging, state.selectedNodeId]
  );

  const endDrag = useCallback(() => {
    setState((s) => ({ ...s, isDragging: false }));
  }, []);

  // Select
  const selectNode = useCallback((nodeId: string | null) => {
    setState((s) => ({ ...s, selectedNodeId: nodeId, selectedEdgeId: null }));
  }, []);

  const selectEdge = useCallback((edgeId: string | null) => {
    setState((s) => ({ ...s, selectedEdgeId: edgeId, selectedNodeId: null }));
  }, []);

  // Edit node
  const openEditNode = useCallback(
    (nodeId: string) => {
      const node = flowData.nodes.find((n) => n.id === nodeId);
      if (node) setState((s) => ({ ...s, editingNode: { ...node } }));
    },
    [flowData.nodes]
  );

  const closeEditNode = useCallback(() => {
    setState((s) => ({ ...s, editingNode: null }));
  }, []);

  const saveEditNode = useCallback(
    (updatedNode: FlowNode) => {
      setFlowData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
      }));
      setState((s) => ({ ...s, editingNode: null }));
    },
    []
  );

  // Add node
  const addNode = useCallback(
    (x: number, y: number, type: FlowNode["type"] = "source") => {
      const id = `node-${Date.now()}`;
      const newNode: FlowNode = {
        id,
        label: type === "metric" ? "NEW METRIC" : "new-node",
        x,
        y,
        type,
        color: "cyan",
        ...(type === "metric" || type === "process" ? { value: "0", size: 60 } : {}),
      };
      setFlowData((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      return id;
    },
    []
  );

  // Remove node
  const removeNode = useCallback((nodeId: string) => {
    setFlowData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    }));
    setState((s) => ({
      ...s,
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    }));
  }, []);

  // Change node color
  const changeNodeColor = useCallback((nodeId: string, color: ColorOption) => {
    setFlowData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, color } : n)),
    }));
  }, []);

  // Edge operations
  const addEdge = useCallback((fromId: string, toId: string, color: ColorOption = "cyan") => {
    const id = `edge-${Date.now()}`;
    const newEdge: FlowEdge = { id, from: fromId, to: toId, color, particleCount: 4, speed: 1 };
    setFlowData((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setFlowData((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    setState((s) => ({
      ...s,
      selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
    }));
  }, []);

  const changeEdgeColor = useCallback((edgeId: string, color: ColorOption) => {
    setFlowData((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, color } : e)),
    }));
  }, []);

  // Connect mode
  const startConnect = useCallback((fromId: string) => {
    setState((s) => ({ ...s, connectingFrom: fromId }));
  }, []);

  const endConnect = useCallback(
    (toId: string) => {
      if (state.connectingFrom && state.connectingFrom !== toId) {
        addEdge(state.connectingFrom, toId);
      }
      setState((s) => ({ ...s, connectingFrom: null }));
    },
    [state.connectingFrom, addEdge]
  );

  const cancelConnect = useCallback(() => {
    setState((s) => ({ ...s, connectingFrom: null }));
  }, []);

  return {
    flowData,
    state,
    findNodeAt,
    findEdgeAt,
    startDrag,
    drag,
    endDrag,
    selectNode,
    selectEdge,
    openEditNode,
    closeEditNode,
    saveEditNode,
    addNode,
    removeNode,
    changeNodeColor,
    addEdge,
    removeEdge,
    changeEdgeColor,
    startConnect,
    endConnect,
    cancelConnect,
  };
}
