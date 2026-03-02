import { useState } from "react";
import { FlowData } from "@/types/flow";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Upload, RotateCcw, Settings } from "lucide-react";
import { toast } from "sonner";

interface DataManagerProps {
  data: FlowData;
  onDataChange: (data: FlowData) => void;
  onReset: () => void;
}

export default function DataManager({
  data,
  onDataChange,
  onReset,
}: DataManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleExport = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    setJsonText(jsonStr);

    // Also download as file
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(jsonStr)
    );
    element.setAttribute("download", "flowchart-data.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Data exported and downloaded!");
  };

  const handleImport = () => {
    try {
      const parsedData = JSON.parse(jsonText) as FlowData;

      // Basic validation
      if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
        throw new Error("Invalid data structure: missing 'nodes' array");
      }
      if (!parsedData.edges || !Array.isArray(parsedData.edges)) {
        throw new Error("Invalid data structure: missing 'edges' array");
      }

      onDataChange(parsedData);
      setIsOpen(false);
      toast.success("Data imported successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import data"
      );
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content) as FlowData;

        if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
          throw new Error("Invalid data structure: missing 'nodes' array");
        }
        if (!parsedData.edges || !Array.isArray(parsedData.edges)) {
          throw new Error("Invalid data structure: missing 'edges' array");
        }

        onDataChange(parsedData);
        setIsOpen(false);
        toast.success("Data imported successfully!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to import JSON file"
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-mono hover-glow"
            title="Manage graph data (import/export)"
          >
            <Settings className="w-4 h-4" />
            Data
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[500px] bg-card border-border text-foreground overflow-y-auto max-h-screen shadow-elevated">
          <SheetHeader className="pb-4 border-b border-border/50">
            <SheetTitle className="font-mono text-lg">Data Manager</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="export" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-2 gap-0 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="export" className="rounded-md transition-smooth">Export</TabsTrigger>
              <TabsTrigger value="import" className="rounded-md transition-smooth">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4 mt-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Download your current graph configuration as JSON
                </p>
                <Button
                  onClick={handleExport}
                  className="w-full gap-2 font-mono shadow-soft hover:shadow-medium"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON File
                </Button>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-xs text-muted-foreground font-medium mb-3">
                  Or copy JSON data:
                </p>
                <Textarea
                  value={JSON.stringify(data, null, 2)}
                  readOnly
                  className="bg-background border-border font-mono text-xs h-64 resize-none rounded-lg shadow-soft"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2 font-mono text-xs transition-smooth"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    toast.success("Copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Upload a JSON file or paste JSON data:
                </p>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-smooth cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                    id="json-upload"
                  />
                  <label
                    htmlFor="json-upload"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">
                      Click to select JSON file
                    </span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Or paste JSON data:
                </p>
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='{"nodes": [], "edges": [], "categories": []}'
                  className="bg-background border-border font-mono text-xs h-64 resize-none rounded-lg shadow-soft"
                />
                <Button
                  onClick={handleImport}
                  className="w-full gap-2 font-mono shadow-soft hover:shadow-medium"
                  disabled={!jsonText.trim()}
                >
                  <Upload className="w-4 h-4" />
                  Import JSON
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t border-border/50 mt-6 pt-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-3">
                Reset to original default data:
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowResetDialog(true)}
                className="w-full gap-2 font-mono shadow-soft hover:shadow-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Default
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <p className="text-xs text-muted-foreground font-medium mb-3">
                Graph Statistics
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-sm font-bold text-primary">{data.nodes?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Nodes</div>
                </div>
                <div className="text-center border-l border-r border-border/50">
                  <div className="text-sm font-bold text-secondary">{data.edges?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Edges</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-accent">{data.categories?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">Groups</div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-lg">
              Reset to Default?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will reload the original flowchart data and erase all your
              changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onReset();
              setShowResetDialog(false);
              toast.success("Reset to default data");
            }}
            className="font-mono"
          >
            Reset
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
