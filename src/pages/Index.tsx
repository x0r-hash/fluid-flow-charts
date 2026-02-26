import { useEffect, useState, useRef } from "react";
import DashboardNav from "@/components/DashboardNav";
import FlowChartCanvas from "@/components/FlowChartCanvas";
import { mockFlowData } from "@/data/mockFlowData";
import { FlowData } from "@/types/flow";

const Index = () => {
  const [flowData, setFlowData] = useState<FlowData>(mockFlowData);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 660 });

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

  // TODO: Replace with real API call
  // useEffect(() => {
  //   fetch("/api/flow-data")
  //     .then(res => res.json())
  //     .then(data => setFlowData(data));
  // }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />
      <main ref={containerRef} className="flex-1 overflow-hidden p-2">
        <FlowChartCanvas
          data={flowData}
          width={dimensions.width}
          height={dimensions.height}
        />
      </main>
    </div>
  );
};

export default Index;
