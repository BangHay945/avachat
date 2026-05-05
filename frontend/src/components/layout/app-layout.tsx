import {
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Circle,
  SendHorizontal,
  Sun,
  Moon,
  TrendingUp,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import type { AgentStatus } from "@/types";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

const mainNav: NavItem[] = [
  { label: "Inbox", icon: MessageSquare, href: "/dashboard", badge: 12 },
  { label: "Deals", icon: TrendingUp, href: "/deals" },
  { label: "Broadcast", icon: SendHorizontal, href: "/broadcast" },
  { label: "Contacts", icon: Users, href: "/contacts" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

const secondaryNav: NavItem[] = [
  { label: "Settings", icon: Settings, href: "/settings" },
];

function NavButton({ item, onNavigate }: { item: NavItem; onNavigate: (href: string) => void }) {
  const router = useRouter();
  const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1 text-[10px] font-bold text-primary-foreground">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, setStatus } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();

  const navigate = (href: string) => {
    router.push(href);
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="hidden lg:flex items-center gap-px px-2 py-3">
        <img src="/logo-icon.svg" alt="AvaChat" className="h-7 w-7" />
        <div>
          <span className="text-sm font-semibold">AvaChat</span>
          <p className="text-[11px] leading-tight text-muted-foreground">{user?.tenantName}</p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 space-y-1 px-2 py-2">
        {user?.role === "admin" && (
          <NavButton item={{ label: "Admin", icon: Building2, href: "/admin" }} onNavigate={navigate} />
        )}
        {mainNav.map((item) => (
          <NavButton key={item.href} item={item} onNavigate={navigate} />
        ))}
      </div>

      <Separator />

      <div className="px-2 py-2 space-y-1">
        {secondaryNav.map((item) => (
          <NavButton key={item.href} item={item} onNavigate={navigate} />
        ))}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <div className="border-t px-2 py-3">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer rounded-full">
              <AgentAvatar name={user?.name ?? ""} status={user?.status} size="default" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-40">
              {(["online", "away", "busy"] as AgentStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => user && setStatus(s)}
                  className="flex items-center gap-2"
                >
                  <Circle
                    className={cn(
                      "h-2.5 w-2.5 fill-current",
                      s === "online" && "text-green-500",
                      s === "away" && "text-yellow-500",
                      s === "busy" && "text-red-500"
                    )}
                  />
                  <span className="capitalize">{s}</span>
                  {user?.status === s && (
                    <span className="ml-auto text-[10px] text-muted-foreground">Active</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-[11px] text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        router.push("/dashboard");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        toggleTheme();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        router.push("/broadcast");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        router.push("/analytics");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        router.push("/contacts");
      }
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleTheme]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="AvaChat" className="h-7 w-7" />
            <span className="text-sm font-semibold">AvaChat</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center gap-4 border-b px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="AvaChat" className="h-7 w-7" />
            <span className="text-sm font-semibold">AvaChat</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
