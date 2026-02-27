import { useState, useCallback, useRef } from "react";
import { FlowData, FlowNode, FlowEdge, FlowCategory } from "@/types/flow";

export type ColorOption = "cyan" | "purple" | "green" | "orange" | "red" | "yellow" | "blue" | "pink" | "gray" | "lime";

interface NodeAnimation {
  nodeId: string;
  type: "enter" | "exit";
  progress: number; // 0 to 1
  startTime: number;
}

export interface FlowEditorState {
  selectedNodeId: string | null;
  selectedNodeIds: string[]; // multi-select
  selectedEdgeId: string | null;
  selectedCategoryId: string | null;
  isDragging: boolean;
  connectingFrom: string | null;
  editingNode: FlowNode | null;
  editingCategory: FlowCategory | null;
  hoveredNodeId: string | null;
}

export function useFlowEditor(initialData: FlowData) {
  const [flowData, setFlowData] = useState<FlowData>(initialData);
  const [state, setState] = useState<FlowEditorState>({
    selectedNodeId: null,
    selectedNodeIds: [],
    selectedEdgeId: null,
    selectedCategoryId: null,
    isDragging: false,
    connectingFrom: null,
    editingNode: null,
    editingCategory: null,
    hoveredNodeId: null,
  });

  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const multiDragOffsetsRef = useRef<Map<string, { dx: number; dy: number }>>(new Map());
  const nodeAnimationsRef = useRef<NodeAnimation[]>([]);
  const undoStackRef = useRef<FlowData[]>([]);
  const redoStackRef = useRef<FlowData[]>([]);

  const pushUndo = useCallback(() => {
    setFlowData((prev) => {
      undoStackRef.current.push(JSON.parse(JSON.stringify(prev)));
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];
      return prev;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStackRef.current.pop();
    if (prev) {
      setFlowData((current) => {
        redoStackRef.current.push(JSON.parse(JSON.stringify(current)));
        return prev;
      });
    }
  }, []);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (next) {
      setFlowData((current) => {
        undoStackRef.current.push(JSON.parse(JSON.stringify(current)));
        return next;
      });
    }
  }, []);

  const getNodeAnimations = useCallback(() => nodeAnimationsRef.current, []);

  const addNodeAnimation = useCallback((nodeId: string, type: "enter" | "exit") => {
    nodeAnimationsRef.current.push({ nodeId, type, progress: 0, startTime: performance.now() });
  }, []);

  const findNodeAt = useCallback(
    (x: number, y: number): FlowNode | null => {
      for (const node of flowData.nodes) {
        if (node.type === "metric" || node.type === "process") {
          const size = node.size || 60;
          const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
          if (dist <= size + 4) return node;
        } else {
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

  const findCategoryAt = useCallback(
    (x: number, y: number): FlowCategory | null => {
      if (!flowData.categories) return null;
      for (const cat of flowData.categories) {
        if (x >= cat.x - 16 && x <= cat.x + 200 && y >= cat.y - 14 && y <= cat.y + 8) {
          return cat;
        }
      }
      return null;
    },
    [flowData.categories]
  );

  // Hover
  const setHoveredNode = useCallback((nodeId: string | null) => {
    setState((s) => (s.hoveredNodeId === nodeId ? s : { ...s, hoveredNodeId: nodeId }));
  }, []);

  // Drag
  const startDrag = useCallback(
    (nodeId: string, mouseX: number, mouseY: number, shiftKey: boolean = false) => {
      const node = flowData.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      dragOffsetRef.current = { dx: mouseX - node.x, dy: mouseY - node.y };

      setState((s) => {
        let newSelectedIds = s.selectedNodeIds;
        if (shiftKey) {
          // Toggle in multi-select
          newSelectedIds = s.selectedNodeIds.includes(nodeId)
            ? s.selectedNodeIds.filter((id) => id !== nodeId)
            : [...s.selectedNodeIds, nodeId];
        } else if (!s.selectedNodeIds.includes(nodeId)) {
          newSelectedIds = [nodeId];
        }

        // Compute multi-drag offsets for all selected nodes
        const offsets = new Map<string, { dx: number; dy: number }>();
        for (const id of newSelectedIds) {
          const n = flowData.nodes.find((nd) => nd.id === id);
          if (n) offsets.set(id, { dx: mouseX - n.x, dy: mouseY - n.y });
        }
        multiDragOffsetsRef.current = offsets;

        return {
          ...s,
          selectedNodeId: nodeId,
          selectedNodeIds: newSelectedIds,
          isDragging: true,
          selectedEdgeId: null,
          selectedCategoryId: null,
        };
      });
    },
    [flowData.nodes]
  );

  const drag = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!state.isDragging) return;
      
      if (state.selectedNodeIds.length > 1) {
        // Multi-drag
        setFlowData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => {
            const offset = multiDragOffsetsRef.current.get(n.id);
            if (offset) return { ...n, x: mouseX - offset.dx, y: mouseY - offset.dy };
            return n;
          }),
        }));
      } else if (state.selectedNodeId) {
        const { dx, dy } = dragOffsetRef.current;
        setFlowData((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === state.selectedNodeId ? { ...n, x: mouseX - dx, y: mouseY - dy } : n
          ),
        }));
      }
    },
    [state.isDragging, state.selectedNodeId, state.selectedNodeIds]
  );

  const endDrag = useCallback(() => {
    setState((s) => ({ ...s, isDragging: false }));
  }, []);

  // Category drag
  const startCategoryDrag = useCallback(
    (categoryId: string, mouseX: number, mouseY: number) => {
      const category = flowData.categories?.find((c) => c.id === categoryId);
      if (!category) return;
      dragOffsetRef.current = { dx: mouseX - category.x, dy: mouseY - category.y };
      setState((s) => ({ ...s, selectedCategoryId: categoryId, isDragging: true }));
    },
    [flowData.categories]
  );

  const dragCategory = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!state.isDragging || !state.selectedCategoryId) return;
      const { dx, dy } = dragOffsetRef.current;
      setFlowData((prev) => ({
        ...prev,
        categories: prev.categories?.map((c) =>
          c.id === state.selectedCategoryId ? { ...c, x: mouseX - dx, y: mouseY - dy } : c
        ),
      }));
    },
    [state.isDragging, state.selectedCategoryId]
  );

  // Select
  const selectNode = useCallback((nodeId: string | null, shiftKey: boolean = false) => {
    setState((s) => {
      if (shiftKey && nodeId) {
        const newIds = s.selectedNodeIds.includes(nodeId)
          ? s.selectedNodeIds.filter((id) => id !== nodeId)
          : [...s.selectedNodeIds, nodeId];
        return { ...s, selectedNodeId: nodeId, selectedNodeIds: newIds, selectedEdgeId: null, selectedCategoryId: null };
      }
      return { ...s, selectedNodeId: nodeId, selectedNodeIds: nodeId ? [nodeId] : [], selectedEdgeId: null, selectedCategoryId: null };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((s) => ({
      ...s,
      selectedNodeIds: flowData.nodes.map((n) => n.id),
      selectedNodeId: flowData.nodes[0]?.id || null,
    }));
  }, [flowData.nodes]);

  const selectEdge = useCallback((edgeId: string | null) => {
    setState((s) => ({ ...s, selectedEdgeId: edgeId, selectedNodeId: null, selectedNodeIds: [], selectedCategoryId: null }));
  }, []);

  const selectCategory = useCallback((categoryId: string | null) => {
    setState((s) => ({ ...s, selectedCategoryId: categoryId, selectedNodeId: null, selectedNodeIds: [], selectedEdgeId: null }));
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
      pushUndo();
      setFlowData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
      }));
      setState((s) => ({ ...s, editingNode: null }));
    },
    [pushUndo]
  );

  // Edit category
  const openEditCategory = useCallback(
    (categoryId: string) => {
      const category = flowData.categories?.find((c) => c.id === categoryId);
      if (category) setState((s) => ({ ...s, editingCategory: { ...category } }));
    },
    [flowData.categories]
  );

  const closeEditCategory = useCallback(() => {
    setState((s) => ({ ...s, editingCategory: null }));
  }, []);

  const saveEditCategory = useCallback(
    (updatedCategory: FlowCategory) => {
      pushUndo();
      setFlowData((prev) => ({
        ...prev,
        categories: prev.categories?.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)),
      }));
      setState((s) => ({ ...s, editingCategory: null }));
    },
    [pushUndo]
  );

  // Add node with animation
  const addNode = useCallback(
    (x: number, y: number, type: FlowNode["type"] = "source") => {
      pushUndo();
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
      addNodeAnimation(id, "enter");
      return id;
    },
    [pushUndo, addNodeAnimation]
  );

  // Remove node with animation
  const removeNode = useCallback((nodeId: string) => {
    pushUndo();
    addNodeAnimation(nodeId, "exit");
    // Delay actual removal to allow animation
    setTimeout(() => {
      setFlowData((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
      }));
    }, 300);
    setState((s) => ({
      ...s,
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      selectedNodeIds: s.selectedNodeIds.filter((id) => id !== nodeId),
    }));
  }, [pushUndo, addNodeAnimation]);

  // Remove selected nodes
  const removeSelectedNodes = useCallback(() => {
    if (state.selectedNodeIds.length > 0) {
      pushUndo();
      state.selectedNodeIds.forEach((id) => addNodeAnimation(id, "exit"));
      setTimeout(() => {
        setFlowData((prev) => ({
          ...prev,
          nodes: prev.nodes.filter((n) => !state.selectedNodeIds.includes(n.id)),
          edges: prev.edges.filter((e) => !state.selectedNodeIds.includes(e.from) && !state.selectedNodeIds.includes(e.to)),
        }));
      }, 300);
      setState((s) => ({ ...s, selectedNodeId: null, selectedNodeIds: [] }));
    } else if (state.selectedEdgeId) {
      pushUndo();
      setFlowData((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => e.id !== state.selectedEdgeId),
      }));
      setState((s) => ({ ...s, selectedEdgeId: null }));
    }
  }, [state.selectedNodeIds, state.selectedEdgeId, pushUndo, addNodeAnimation]);

  // Nudge selected nodes
  const nudgeNodes = useCallback((dx: number, dy: number) => {
    if (state.selectedNodeIds.length === 0) return;
    setFlowData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        state.selectedNodeIds.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ),
    }));
  }, [state.selectedNodeIds]);

  // Change node color
  const changeNodeColor = useCallback((nodeId: string, color: ColorOption) => {
    pushUndo();
    setFlowData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, color } : n)),
    }));
  }, [pushUndo]);

  // Edge operations
  const addEdge = useCallback((fromId: string, toId: string, color: ColorOption = "cyan") => {
    pushUndo();
    const id = `edge-${Date.now()}`;
    const newEdge: FlowEdge = { id, from: fromId, to: toId, color, particleCount: 4, speed: 1 };
    setFlowData((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
  }, [pushUndo]);

  const removeEdge = useCallback((edgeId: string) => {
    pushUndo();
    setFlowData((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    setState((s) => ({
      ...s,
      selectedEdgeId: s.selectedEdgeId === edgeId ? null : s.selectedEdgeId,
    }));
  }, [pushUndo]);

  const changeEdgeColor = useCallback((edgeId: string, color: ColorOption) => {
    pushUndo();
    setFlowData((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, color } : e)),
    }));
  }, [pushUndo]);

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

  // Add category
  const addCategory = useCallback(
    (x: number, y: number, color: ColorOption = "cyan") => {
      pushUndo();
      const id = `cat-${Date.now()}`;
      const newCategory: FlowCategory = { id, label: "NEW CATEGORY", x, y, color };
      setFlowData((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory],
      }));
      return id;
    },
    [pushUndo]
  );

  const loadFlowData = useCallback((newData: FlowData) => {
    setFlowData(newData);
    setState({
      selectedNodeId: null,
      selectedNodeIds: [],
      selectedEdgeId: null,
      selectedCategoryId: null,
      isDragging: false,
      connectingFrom: null,
      editingNode: null,
      editingCategory: null,
      hoveredNodeId: null,
    });
  }, []);

  return {
    flowData,
    state,
    findNodeAt,
    findEdgeAt,
    findCategoryAt,
    setHoveredNode,
    startDrag,
    drag,
    endDrag,
    startCategoryDrag,
    dragCategory,
    selectNode,
    selectAll,
    selectEdge,
    selectCategory,
    openEditNode,
    closeEditNode,
    saveEditNode,
    openEditCategory,
    closeEditCategory,
    saveEditCategory,
    addNode,
    removeNode,
    removeSelectedNodes,
    nudgeNodes,
    changeNodeColor,
    addCategory,
    addEdge,
    removeEdge,
    changeEdgeColor,
    startConnect,
    endConnect,
    cancelConnect,
    loadFlowData,
    undo,
    redo,
    getNodeAnimations,
  };
}
