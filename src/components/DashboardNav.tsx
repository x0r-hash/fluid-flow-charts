import { Activity, GitBranch, Database, Settings } from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface DashboardNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function DashboardNav({ activeTab = "Dashboard", onTabChange }: DashboardNavProps) {
  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <Activity className="w-4 h-4" />, active: activeTab === "Dashboard" },
    { label: "Pipelines", icon: <GitBranch className="w-4 h-4" />, active: activeTab === "Pipelines" },
    { label: "Repositories", icon: <Database className="w-4 h-4" />, active: activeTab === "Repositories" },
    { label: "Settings", icon: <Settings className="w-4 h-4" />, active: activeTab === "Settings" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/50 backdrop-blur-xl shadow-medium">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/20 transition-smooth hover:ring-primary/40">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono font-bold text-foreground text-lg tracking-tighter bg-clip-text">
              DetectFlow
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  item.active
                    ? "bg-muted text-primary shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-border/50 ring-1 ring-accent/20 cursor-pointer transition-smooth hover:ring-accent/40 hover:shadow-soft">
          AD
        </div>
      </div>
    </header>
  );
}
