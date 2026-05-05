import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  CreditCard,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Shield,
  DollarSign,
  Activity,
} from "lucide-react";

interface TenantEntry {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: "trial" | "basic" | "pro" | "enterprise";
  status: "active" | "suspended" | "expired";
  agents: number;
  chatsThisMonth: number;
  revenue: string;
  joinedAt: string;
  trialEnds?: string;
}

const mockTenants: TenantEntry[] = [
  { id: "t1", name: "Annisatravel", slug: "annisatravel", email: "admin@annisatravel.com", plan: "pro", status: "active", agents: 5, chatsThisMonth: 1141, revenue: "Rp 2.500.000", joinedAt: "Jan 15, 2026" },
  { id: "t2", name: "Bali Tours Co.", slug: "balitours", email: "info@balitours.co.id", plan: "enterprise", status: "active", agents: 12, chatsThisMonth: 3420, revenue: "Rp 8.500.000", joinedAt: "Feb 3, 2026" },
  { id: "t3", name: "Indo Holiday", slug: "indoholiday", email: "hello@indoholiday.id", plan: "basic", status: "active", agents: 2, chatsThisMonth: 450, revenue: "Rp 500.000", joinedAt: "Mar 10, 2026" },
  { id: "t4", name: "CV Maju Jaya Tour", slug: "majujayatour", email: "support@majujayatour.com", plan: "trial", status: "active", agents: 3, chatsThisMonth: 320, revenue: "Rp 0", joinedAt: "Apr 20, 2026", trialEnds: "May 4, 2026" },
  { id: "t5", name: "Wonderful Nusantara", slug: "wonusantara", email: "admin@wonusantara.com", plan: "pro", status: "active", agents: 7, chatsThisMonth: 1890, revenue: "Rp 2.500.000", joinedAt: "Mar 25, 2026" },
  { id: "t6", name: "TravelKita", slug: "travelkita", email: "cs@travelkita.id", plan: "trial", status: "active", agents: 2, chatsThisMonth: 180, revenue: "Rp 0", joinedAt: "Apr 28, 2026", trialEnds: "May 12, 2026" },
  { id: "t7", name: "PT Pesona Utama", slug: "pesonautama", email: "info@pesonautama.co.id", plan: "basic", status: "suspended", agents: 3, chatsThisMonth: 0, revenue: "Rp 500.000", joinedAt: "Feb 18, 2026" },
  { id: "t8", name: "Explore ID", slug: "exploreid", email: "hello@explore.id", plan: "trial", status: "expired", agents: 1, chatsThisMonth: 45, revenue: "Rp 0", joinedAt: "Mar 5, 2026", trialEnds: "Mar 19, 2026" },
];

function StatCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
  return (
    <Card className="bg-gradient-to-br from-card to-muted/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function TenantSheet({ tenant, onClose }: { tenant: TenantEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full md:w-[420px] bg-card h-full overflow-auto shadow-2xl animate-slide-left">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{tenant.name}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Slug</p><p className="text-[13px] font-medium">{tenant.slug}</p></div>
            <div className="rounded-xl border p-4"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p><p className="text-[13px] font-medium truncate">{tenant.email}</p></div>
            <div className="rounded-xl border p-4"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Plan</p><Badge className={cn("text-[11px]", tenant.plan === "enterprise" ? "bg-yellow-500/10 text-yellow-600" : tenant.plan === "pro" ? "bg-violet-500/10 text-violet-600" : "bg-blue-500/10 text-blue-600")}>{tenant.plan}</Badge></div>
            <div className="rounded-xl border p-4"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</p><Badge className={cn("text-[11px]", tenant.status === "active" ? "bg-green-500/10 text-green-600" : tenant.status === "suspended" ? "bg-red-500/10 text-red-600" : "bg-gray-500/10 text-gray-600")}>{tenant.status}</Badge></div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Usage</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold">{tenant.agents}</p><p className="text-[10px] text-muted-foreground">Agents</p></div>
              <div><p className="text-lg font-bold">{tenant.chatsThisMonth.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Chats/mo</p></div>
              <div><p className="text-lg font-bold">{tenant.revenue}</p><p className="text-[10px] text-muted-foreground">Revenue</p></div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timeline</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{tenant.joinedAt}</span></div>
              {tenant.trialEnds && <div className="flex justify-between"><span className="text-muted-foreground">Trial Ends</span><span className="text-amber-600">{tenant.trialEnds}</span></div>}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Actions</p>
            <Button variant="outline" className="w-full justify-start h-9 text-xs"><Eye className="mr-2 h-4 w-4" /> View as Tenant</Button>
            {tenant.status === "active" ? (
              <Button variant="outline" className="w-full justify-start h-9 text-xs text-red-600"><Shield className="mr-2 h-4 w-4" /> Suspend Account</Button>
            ) : (
              <Button variant="outline" className="w-full justify-start h-9 text-xs text-green-600"><Shield className="mr-2 h-4 w-4" /> Reactivate Account</Button>
            )}
            <Button variant="outline" className="w-full justify-start h-9 text-xs"><CreditCard className="mr-2 h-4 w-4" /> Change Plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "joined" | "revenue">("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedTenant, setSelectedTenant] = useState<TenantEntry | null>(null);
  const [tenants, setTenants] = useState(mockTenants);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const totalRevenue = tenants.filter(t => t.status === "active").reduce((a, t) => {
    const val = parseInt(t.revenue.replace(/[^0-9]/g, "")) || 0;
    return a + val;
  }, 0);
  const totalAgents = tenants.reduce((a, t) => a + t.agents, 0);
  const totalChats = tenants.reduce((a, t) => a + t.chatsThisMonth, 0);
  const trialCount = tenants.filter(t => t.plan === "trial" && t.status === "active").length;
  const suspendedCount = tenants.filter(t => t.status === "suspended").length;

  let filtered = tenants.filter((t) => {
    if (search) { const q = search.toLowerCase(); if (!t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q) && !t.slug.toLowerCase().includes(q)) return false; }
    if (planFilter !== "all" && t.plan !== planFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  if (sortBy === "name") filtered = [...filtered].sort((a, b) => sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  else if (sortBy === "revenue") filtered = [...filtered].sort((a, b) => { const va = parseInt(a.revenue.replace(/[^0-9]/g, "")) || 0; const vb = parseInt(b.revenue.replace(/[^0-9]/g, "")) || 0; return sortDir === "asc" ? va - vb : vb - va; });

  const toggleStatus = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "active" ? "suspended" : "active" } as TenantEntry : t));
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Platform Admin</h2>
          </div>
          <p className="text-[12px] text-muted-foreground ml-6">Manage all tenant accounts</p>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="space-y-6">

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <StatCard label="Active Tenants" value={String(tenants.filter(t => t.status === "active").length)} sub={`${trialCount} on trial`} icon={Building2} color="text-blue-500" bg="bg-blue-500/10" />
              <StatCard label="Monthly Revenue" value={`Rp ${(totalRevenue / 1000000).toFixed(1)}M`} sub={`${tenants.filter(t => parseInt(t.revenue.replace(/[^0-9]/g,'')) > 0).length} paying`} icon={DollarSign} color="text-green-500" bg="bg-green-500/10" />
              <StatCard label="Total Agents" value={String(totalAgents)} sub={`${totalChats.toLocaleString()} chats/mo`} icon={Users} color="text-violet-500" bg="bg-violet-500/10" />
              <StatCard label="Suspended" value={String(suspendedCount)} sub={`${tenants.filter(t => t.status === "expired").length} expired`} icon={Activity} color="text-red-500" bg="bg-red-500/10" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenants..." className="pl-8 h-8 text-xs" />
              </div>
              <Select value={planFilter} onValueChange={(v) => v && setPlanFilter(v)}>
                <SelectTrigger size="sm" className="w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                <SelectTrigger size="sm" className="w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Table - Desktop */}
            <div className="hidden md:block rounded-lg border">
              <div className="grid grid-cols-8 gap-2 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2">
                  <button onClick={() => { setSortBy("name"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-foreground">Tenant {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</button>
                </div>
                <div>Plan</div>
                <div>Status</div>
                <div className="text-center">Agents</div>
                <div className="text-center">Chats/mo</div>
                <div>
                  <button onClick={() => { setSortBy("revenue"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-foreground">Revenue {sortBy === "revenue" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</button>
                </div>
                <div className="text-right">Actions</div>
              </div>
              {filtered.map((t) => (
                <div key={t.id} className="grid grid-cols-8 gap-2 items-center border-b last:border-0 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="col-span-2 cursor-pointer" onClick={() => setSelectedTenant(t)}>
                    <p className="text-[13px] font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.email}</p>
                  </div>
                  <div>
                    <Badge className={cn("text-[10px] px-1.5 py-0 capitalize", t.plan === "enterprise" ? "bg-yellow-500/10 text-yellow-600" : t.plan === "pro" ? "bg-violet-500/10 text-violet-600" : t.plan === "basic" ? "bg-blue-500/10 text-blue-600" : "bg-gray-500/10 text-gray-600")}>{t.plan}</Badge>
                  </div>
                  <div>
                    <Badge className={cn("text-[9px] px-1.5 py-0 capitalize", t.status === "active" ? "bg-green-500/10 text-green-600" : t.status === "suspended" ? "bg-red-500/10 text-red-600" : "bg-gray-500/10 text-gray-500")}>{t.status}</Badge>
                  </div>
                  <div className="text-center"><span className="text-[12px] font-medium">{t.agents}</span></div>
                  <div className="text-center"><span className="text-[12px]">{t.chatsThisMonth.toLocaleString()}</span></div>
                  <div><span className="text-[11px] font-medium">{t.revenue}</span></div>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedTenant(t)}><Eye className="mr-1 h-3 w-3" /> View</Button>
                    <Button variant="ghost" size="sm" className={cn("h-7 text-[10px]", t.status === "active" ? "text-red-600" : "text-green-600")} onClick={() => toggleStatus(t.id)}>
                      {t.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tenant List - Mobile */}
            <div className="md:hidden space-y-2">
              {filtered.map((t) => (
                <div key={t.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTenant(t)}>
                      <p className="text-[13px] font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge className={cn("text-[9px] px-1.5 py-0 capitalize", t.plan === "enterprise" ? "bg-yellow-500/10 text-yellow-600" : t.plan === "pro" ? "bg-violet-500/10 text-violet-600" : t.plan === "basic" ? "bg-blue-500/10 text-blue-600" : "bg-gray-500/10 text-gray-600")}>{t.plan}</Badge>
                      <Badge className={cn("text-[9px] px-1.5 py-0 capitalize", t.status === "active" ? "bg-green-500/10 text-green-600" : t.status === "suspended" ? "bg-red-500/10 text-red-600" : "bg-gray-500/10 text-gray-500")}>{t.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <button onClick={() => setSelectedTenant(t)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </button>
                    <Button variant="ghost" size="sm" className={cn("h-7 text-[10px]", t.status === "active" ? "text-red-600" : "text-green-600")} onClick={() => toggleStatus(t.id)}>
                      {t.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTenant && <TenantSheet tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />}
    </AppLayout>
  );
}
