import { Activity, GitBranch, Database, Settings } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <Activity className="w-4 h-4" />, active: true },
  { label: "Pipelines", icon: <GitBranch className="w-4 h-4" /> },
  { label: "Repositories", icon: <Database className="w-4 h-4" /> },
  { label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardNav() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <span className="font-mono font-bold text-foreground text-lg tracking-tight">
            DetectFlow
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                item.active
                  ? "bg-muted text-primary text-glow-cyan"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border border-border">
        AD
      </div>
    </header>
  );
}
