/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  Smile,
  Users,
  BarChart3,
  Minus,
  Download,
  Target,
  Bot,
  User,
} from "lucide-react";
import { analytics as analyticsApi } from "@/lib/api";

type Period = "7d" | "30d" | "90d" | "custom";

const weeklyData = [
  { day: "Mon", chats: 145, resolved: 132, responseTime: 42 },
  { day: "Tue", chats: 182, resolved: 165, responseTime: 38 },
  { day: "Wed", chats: 215, resolved: 198, responseTime: 35 },
  { day: "Thu", chats: 178, resolved: 160, responseTime: 40 },
  { day: "Fri", chats: 256, resolved: 230, responseTime: 32 },
  { day: "Sat", chats: 98, resolved: 90, responseTime: 55 },
  { day: "Sun", chats: 67, resolved: 62, responseTime: 68 },
];

const prevWeeklyData = [
  { day: "Mon", chats: 120, resolved: 108, responseTime: 48 },
  { day: "Tue", chats: 155, resolved: 140, responseTime: 44 },
  { day: "Wed", chats: 190, resolved: 170, responseTime: 40 },
  { day: "Thu", chats: 150, resolved: 135, responseTime: 46 },
  { day: "Fri", chats: 220, resolved: 195, responseTime: 38 },
  { day: "Sat", chats: 80, resolved: 72, responseTime: 62 },
  { day: "Sun", chats: 55, resolved: 50, responseTime: 75 },
];

const peakHours = [
  { hour: "00", chats: 4 }, { hour: "02", chats: 2 }, { hour: "04", chats: 1 }, { hour: "06", chats: 8 },
  { hour: "08", chats: 45 }, { hour: "09", chats: 78 }, { hour: "10", chats: 95 }, { hour: "11", chats: 88 },
  { hour: "12", chats: 62 }, { hour: "13", chats: 55 }, { hour: "14", chats: 70 }, { hour: "15", chats: 82 },
  { hour: "16", chats: 68 }, { hour: "17", chats: 50 }, { hour: "18", chats: 35 }, { hour: "19", chats: 28 },
  { hour: "20", chats: 18 }, { hour: "21", chats: 10 }, { hour: "22", chats: 6 }, { hour: "23", chats: 3 },
];

const channelData = [
  { name: "WhatsApp", value: 42, color: "bg-green-500" },
  { name: "Instagram", value: 28, color: "bg-pink-500" },
  { name: "Telegram", value: 15, color: "bg-sky-500" },
  { name: "Live Chat", value: 10, color: "bg-violet-500" },
  { name: "Email", value: 3, color: "bg-orange-500" },
  { name: "Facebook", value: 2, color: "bg-blue-600" },
];

const csatByChannel = [
  { name: "WhatsApp", csat: 91, chats: 480 },
  { name: "Instagram", csat: 88, chats: 320 },
  { name: "Telegram", csat: 94, chats: 170 },
  { name: "Live Chat", csat: 82, chats: 115 },
  { name: "Email", csat: 86, chats: 35 },
  { name: "Facebook", csat: 90, chats: 21 },
];

const agentPerformance = [
  { name: "Haeder", chats: 342, resolved: 320, avgTime: "2.4m", sentiment: 92 },
  { name: "Dewi Lestari", chats: 285, resolved: 268, avgTime: "3.1m", sentiment: 88 },
  { name: "Rudi Hidayat", chats: 198, resolved: 175, avgTime: "4.2m", sentiment: 85 },
  { name: "Sari Indah", chats: 156, resolved: 142, avgTime: "3.8m", sentiment: 90 },
  { name: "Bambang S", chats: 220, resolved: 205, avgTime: "2.8m", sentiment: 87 },
];

const aiStats = { aiHandled: 285, humanHandled: 856, escalated: 48, autoResolved: 210 };

const topQueries = [
  { query: "Paket tour ke Bali", count: 145 },
  { query: "Harga paket honeymoon", count: 98 },
  { query: "Diskon grup", count: 82 },
  { query: "Cara booking", count: 76 },
  { query: "Metode pembayaran", count: 65 },
  { query: "Jadwal keberangkatan", count: 58 },
  { query: "Refund / reschedule", count: 45 },
  { query: "Fasilitas hotel", count: 42 },
  { query: "Paket Lombok", count: 38 },
  { query: "Guide / transport", count: 32 },
];

const goals = [
  { label: "CSAT > 90%", current: 89, target: 90, color: "bg-amber-500" },
  { label: "SLA Response < 15m", current: 2.8, target: 15, color: "bg-green-500", unit: "m", inverted: true },
  { label: "Resolution > 85%", current: 84, target: 85, color: "bg-blue-500" },
];

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} /></div>;
}

function StatCard({ label, value, sub, icon: Icon, color, bg, trend }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; trend?: "up" | "down" | "flat" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-5 transition-all hover:bg-card hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shadow-sm", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5">
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            {trend === "flat" && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-[13px] font-medium text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("7d");
  const [compare, setCompare] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [apiSummary, setApiSummary] = useState<any>(null);

  useEffect(() => { if (isLoading) return; if (!isAuthenticated) router.replace("/login"); }, [isLoading, isAuthenticated, router]);
  useEffect(() => {
    analyticsApi.summary().then((data) => setApiSummary(data as any)).catch((err) => console.error("Failed to fetch analytics:", err));
  }, []);

  if (!isAuthenticated) return null;

  const totalChats = weeklyData.reduce((a, b) => a + b.chats, 0);
  const prevTotal = prevWeeklyData.reduce((a, b) => a + b.chats, 0);
  const chatsTrend = prevTotal > 0 ? Math.round(((totalChats - prevTotal) / prevTotal) * 100) : 0;

  const avgResponse = apiSummary?.avg_response_time_seconds;
  const avgResponseDisplay = avgResponse ? `${Math.round(avgResponse / 60)}m ${avgResponse % 60}s` : "—";
  const slaBreached = apiSummary?.sla_breached ?? 0;
  const slaTarget = apiSummary?.sla_target_seconds ?? 900;
  const slaBreachRate = apiSummary?.total_chats ? Math.round((slaBreached / Math.max(1, apiSummary.total_chats)) * 100) : 0;

  const exportReport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setExporting(false);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-auto">
        <div className="flex items-center justify-between border-b bg-card px-4 md:px-8 py-3 shrink-0 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Analytics</h2>
            </div>
            <p className="text-[12px] text-muted-foreground ml-6">Annisatravel · {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : period === "90d" ? "Last 90 days" : "Custom"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg border p-0.5">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className={cn("h-8 text-xs", compare && "bg-primary/10 border-primary")} onClick={() => setCompare(!compare)}>
              {compare ? "Hide Comparison" : "Compare"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportReport} disabled={exporting}>
              {exporting ? <><span className="animate-spin mr-1">⏳</span> Exporting...</> : <><Download className="mr-1.5 h-3.5 w-3.5" /> Export</>}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="space-y-6 md:space-y-8">

            {/* Goal Tracking */}
            <div className="group rounded-2xl border bg-card/50 p-5 transition-all hover:bg-card">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Target className="h-4 w-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold">Goal Tracking</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {goals.map((g) => {
                  const pct = g.inverted ? Math.min(100, (g.target / (g.current as number)) * 100) : Math.min(100, ((g.current as number) / g.target) * 100);
                  return (
                    <div key={g.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium">{g.label}</span>
                        <span className={cn("text-[11px] font-semibold", pct >= 90 ? "text-emerald-600/80" : "text-amber-600/80")}>{g.current}{g.unit || "%"} <span className="text-muted-foreground font-normal">/ {g.target}{g.unit || "%"}</span></span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", g.color, pct >= 100 && "opacity-60")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <StatCard label="Total Chats" value={(apiSummary?.total_chats || totalChats).toLocaleString()} sub={`${apiSummary?.resolved_chats || 0} resolved`} icon={MessageSquare} color="text-blue-500/80" bg="bg-blue-500/10" trend="up" />
              <StatCard label="Avg Response Time" value={avgResponseDisplay} sub={`${slaBreached} breached (${slaBreachRate}%)`} icon={Clock} color={slaBreachRate > 20 ? "text-red-500/80" : "text-green-500/80"} bg={slaBreachRate > 20 ? "bg-red-500/10" : "bg-green-500/10"} trend={slaBreachRate > 20 ? "down" : "up"} />
              <StatCard label="CSAT Score" value={`${apiSummary?.csat ?? 89}%`} sub="+2 pts vs last period" icon={Smile} color="text-amber-500" bg="bg-amber-500/10" trend="up" />
              <StatCard label="Active Agents" value={`${apiSummary?.agent_performance?.length || 5}`} sub="All online avg 6h/day" icon={Users} color="text-violet-500" bg="bg-violet-500/10" trend="flat" />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-3">

              {/* Chat Volume */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Chat Volume</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="h-[180px] flex items-end gap-2">
                    {weeklyData.map((d) => {
                      const maxChats = Math.max(...weeklyData.map((w) => w.chats));
                      const pct = (d.chats / maxChats) * 100;
                      const prev = prevWeeklyData.find((p) => p.day === d.day);
                      return (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div className="relative w-full flex flex-col items-center" style={{ height: "140px" }}>
                            <div className="mt-auto w-full flex flex-col-reverse">
                              {compare && prev && (
                                <div className="w-full rounded-md bg-muted-foreground/20" style={{ height: `${(prev.chats / maxChats) * 100}%`, minHeight: "3px" }}>
                                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap">prev: {prev.chats}</div>
                                </div>
                              )}
                              <div className="w-full rounded-md bg-primary/80 group-hover:bg-primary transition-colors relative" style={{ height: `${pct}%`, minHeight: "4px" }}>
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-popover px-1.5 py-0.5 rounded border shadow-sm">{d.chats} chats</div>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-primary/80" /><span className="text-[11px] text-muted-foreground">Chats</span></div>
                    {compare && <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-muted-foreground/20" /><span className="text-[11px] text-muted-foreground">Previous</span></div>}
                    <span className="ml-auto text-[11px] text-muted-foreground">{totalChats.toLocaleString()} total</span>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Peak Hours</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="h-[180px] flex items-end gap-px">
                    {peakHours.filter((_, i) => i % 2 === 0).map((d) => {
                      const max = Math.max(...peakHours.map((p) => p.chats));
                      const pct = (d.chats / max) * 100;
                      return (
                        <div key={d.hour} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div className="w-full flex flex-col justify-end" style={{ height: "140px" }}>
                            <div className="w-full rounded-t-sm bg-blue-500/60 group-hover:bg-blue-500 transition-colors" style={{ height: `${Math.max(2, pct)}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground">{d.hour}h</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Channel + Response Time */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">By Channel</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5 space-y-4">
                  {channelData.map((ch) => (
                    <div key={ch.name}>
                      <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-medium">{ch.name}</span><span className="text-[11px] text-muted-foreground">{ch.value}%</span></div>
                      <MiniBar value={ch.value} max={Math.max(...channelData.map((c) => c.value))} color={ch.color} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Response Time Trend */}
              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Response Time Trend</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="h-[180px] flex items-end gap-2">
                    {weeklyData.map((d) => {
                      const maxRt = Math.max(...weeklyData.map((w) => w.responseTime));
                      const pct = (d.responseTime / maxRt) * 100;
                      return (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div className="w-full flex flex-col justify-end" style={{ height: "140px" }}>
                            <div className="w-full rounded-t-sm bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors" style={{ height: `${Math.max(4, pct)}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center mt-2 text-[11px] text-muted-foreground">Avg: {Math.round(weeklyData.reduce((a, b) => a + b.responseTime, 0) / weeklyData.length)}s</div>
                </CardContent>
              </Card>
            </div>

            {/* CSAT by Channel + Agent */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">CSAT by Channel</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  {csatByChannel.map((ch) => (
                    <div key={ch.name}>
                      <div className="flex items-center justify-between mb-1"><span className="text-[12px] font-medium">{ch.name}</span><span className="text-[11px] font-medium">{ch.csat}%</span></div>
                      <MiniBar value={ch.csat} max={100} color={ch.csat >= 90 ? "bg-green-500" : ch.csat >= 85 ? "bg-yellow-500" : "bg-red-500"} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">CSAT by Agent</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  {agentPerformance.map((a) => (
                    <div key={a.name}>
                      <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-medium truncate">{a.name}</span><span className="text-[10px] font-medium shrink-0 ml-2">{a.sentiment}%</span></div>
                      <MiniBar value={a.sentiment} max={100} color={a.sentiment >= 90 ? "bg-green-500" : a.sentiment >= 85 ? "bg-yellow-500" : "bg-red-500"} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance Table */}
            <Card>
              <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Agent Performance</CardTitle></CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="rounded-lg border">
                  <div className="grid grid-cols-6 gap-4 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-2">Agent</div><div>Chats</div><div>Resolved</div><div>Avg Time</div><div>Sentiment</div>
                  </div>
                  {(apiSummary?.agent_performance || agentPerformance).map((agent: any) => (
                    <div key={agent.name} className="grid grid-cols-6 gap-4 items-center border-b last:border-0 px-4 py-3">
                      <div className="col-span-2"><p className="text-[13px] font-medium">{agent.name}</p></div>
                      <div><span className="text-[12px] font-medium">{agent.chats?.toLocaleString() || agent.chats}</span></div>
                      <div><div className="flex items-center gap-1.5"><span className="text-[12px] font-medium">{agent.resolved}</span><span className="text-[10px] text-muted-foreground">({Math.round((agent.resolved/agent.chats)*100)}%)</span></div></div>
                      <div><span className="text-[12px] text-muted-foreground">{agent.avg_time_seconds ? `${Math.round(agent.avg_time_seconds / 60)}m ${agent.avg_time_seconds % 60}s` : agent.avgTime}</span></div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full", (agent.csat || agent.sentiment) >= 90 ? "bg-green-500" : (agent.csat || agent.sentiment) >= 85 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${agent.csat || agent.sentiment}%` }} /></div>
                          <span className="text-[11px] font-medium">{agent.csat || agent.sentiment}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SLA Detail */}
            <Card>
              <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">SLA Tracking</CardTitle></CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="group rounded-2xl border bg-card/50 p-5 text-center transition-all hover:bg-card hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg Response</p>
                    <p className="text-2xl font-bold tracking-tight">{avgResponseDisplay}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Target: {Math.floor(slaTarget / 60)}m</p>
                  </div>
                  <div className="group rounded-2xl border bg-card/50 p-5 text-center transition-all hover:bg-card hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">SLA Breached</p>
                    <p className={cn("text-2xl font-bold tracking-tight", slaBreached > 0 ? "text-red-600/80" : "text-emerald-600/80")}>{slaBreached}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{slaBreachRate}% of total chats</p>
                  </div>
                  <div className="group rounded-2xl border bg-card/50 p-5 text-center transition-all hover:bg-card hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resolution Rate</p>
                    <p className="text-2xl font-bold tracking-tight">{apiSummary?.resolved_chats ? Math.round((apiSummary.resolved_chats / apiSummary.total_chats) * 100) : 0}%</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{apiSummary?.resolved_chats || 0} of {apiSummary?.total_chats || 0} chats</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI vs Human + Top Queries */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">AI vs Human</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-violet-500" /><span className="text-[11px] font-medium">AI Handled</span></div>
                          <span className="text-[12px] font-bold">{aiStats.aiHandled}</span>
                        </div>
                        <MiniBar value={aiStats.aiHandled} max={aiStats.humanHandled} color="bg-violet-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-blue-500/80" /><span className="text-[11px] font-medium">Human Handled</span></div>
                          <span className="text-[12px] font-bold">{aiStats.humanHandled}</span>
                        </div>
                        <MiniBar value={aiStats.humanHandled} max={aiStats.humanHandled} color="bg-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div className="group rounded-xl border bg-card/50 p-3.5 text-center transition-all hover:bg-card">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Escalated</p>
                        <p className="text-lg font-bold mt-1">{aiStats.escalated}</p>
                        <p className="text-[9px] text-muted-foreground">to human agent</p>
                      </div>
                      <div className="group rounded-xl border bg-card/50 p-3.5 text-center transition-all hover:bg-card">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Auto-Resolved</p>
                        <p className="text-lg font-bold mt-1">{aiStats.autoResolved}</p>
                        <p className="text-[9px] text-muted-foreground">without human</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">
                        AI handles {Math.round((aiStats.aiHandled / (aiStats.aiHandled + aiStats.humanHandled)) * 100)}% of total chats
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Top Customer Queries</CardTitle></CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-2">
                    {topQueries.map((q, i) => (
                      <div key={q.query} className="flex items-center gap-3">
                        <span className="text-[10px] font-medium text-muted-foreground w-5">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] truncate">{q.query}</p>
                          <MiniBar value={q.count} max={topQueries[0].count} color="bg-blue-500" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground w-10 text-right">{q.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
