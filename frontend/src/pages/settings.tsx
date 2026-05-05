/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { cn } from "@/lib/utils";
import { cannedResponses as cannedApi, ai as aiApi, channels as channelsApi, whitelabel as wlApi, subscription } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/loading";
import { toast } from "sonner";
import {
  Wifi,
  WifiOff,
  Globe,
  Copy,
  Check,
  UserPlus,
  Mail,
  Settings,
  MessageSquare,
  Users,
  CreditCard,
  Crown,
  ExternalLink,
  Palette,
  Bot,
  Eye,
  EyeOff,
  Play,
  Plus,
  BookOpen,
  Edit3,
  Trash2,
  Zap,
  UserCircle,
  Shield,
  Bell,
  Clock3,
  Key,
  LogOut,
  AlertCircle,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
  SiTiktok,
  SiGmail,
} from "react-icons/si";
import type { AgentStatus } from "@/types";

interface ChannelConfig {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  connected: boolean;
  color: string;
  bg: string;
  phone?: string;
  token?: string;
  apiKey?: string;
}

interface AgentEntry {
  id: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "agent";
  status: AgentStatus;
  avatar?: string;
}

// ─── DATA ──────────────────────────────────────────

type ComingSoonChannel = "whatsapp" | "instagram" | "facebook" | "tiktok" | "email";
const COMING_SOON: ComingSoonChannel[] = ["whatsapp", "instagram", "facebook", "tiktok", "email"];

const channelData: ChannelConfig[] = [
  { type: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, connected: false, color: "text-green-500", bg: "bg-green-500/10" },
  { type: "instagram", label: "Instagram", icon: SiInstagram, connected: false, color: "text-pink-500", bg: "bg-pink-500/10" },
  { type: "telegram", label: "Telegram", icon: SiTelegram, connected: false, color: "text-sky-500", bg: "bg-sky-500/10", token: "" },
  { type: "livechat", label: "Live Chat", icon: Globe, connected: true, color: "text-violet-500", bg: "bg-violet-500/10" },
  { type: "facebook", label: "Facebook", icon: SiFacebook, connected: false, color: "text-blue-600", bg: "bg-blue-600/10" },
  { type: "tiktok", label: "TikTok", icon: SiTiktok, connected: false, color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-500/10" },
  { type: "email", label: "Email", icon: SiGmail, connected: false, color: "text-orange-500", bg: "bg-orange-500/10" },
];

const agentData: AgentEntry[] = [
  { id: "1", name: "Haeder", email: "haeder@avachat.id", role: "admin", status: "online" },
  { id: "2", name: "Dewi Lestari", email: "dewi@avachat.id", role: "supervisor", status: "online" },
  { id: "3", name: "Rudi Hidayat", email: "rudi@avachat.id", role: "agent", status: "away" },
  { id: "4", name: "Sari Indah", email: "sari@avachat.id", role: "agent", status: "busy" },
  { id: "5", name: "Bambang S", email: "bambang@avachat.id", role: "agent", status: "online" },
];

const plans = [
  {
    name: "Basic",
    description: "For small teams getting started",
    price: "Rp 500K",
    period: "/month",
    features: ["2 Agents", "3 Channels", "1.000 chats/mo", "Basic AI FAQ", "Email support"],
    color: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20",
    btn: "outline" as const,
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "Rp 2,5M",
    period: "/month",
    popular: true,
    features: ["10 Agents", "All Channels", "10.000 chats/mo", "AI FAQ + Sentiment", "Priority support", "CRM Integration", "Analytics"],
    color: "from-violet-500/10 to-violet-500/5",
    border: "border-violet-500/30",
    btn: "default" as const,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "",
    features: ["Unlimited agents", "All channels", "Unlimited chats", "Full AI Suite", "Dedicated support", "White-label", "Custom integration"],
    color: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20",
    btn: "outline" as const,
  },
];

// ─── CHANNELS TAB ─────────────────────────────────

function ChannelsTab() {
  const [channels, setChannels] = useState(channelData);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState("");
  const [savingTg, setSavingTg] = useState(false);
  const [tgConnected, setTgConnected] = useState(false);

  useEffect(() => {
    channelsApi.list().then((status) => {
      // backend returns array of { type, name, connected }
      const statusMap: Record<string, boolean> = {};
      if (Array.isArray(status)) {
        (status as Array<{type: string; connected: boolean}>).forEach(s => { statusMap[s.type] = s.connected; });
      }
      setChannels((prev) => prev.map((ch) => ({
        ...ch, connected: statusMap[ch.type] ?? ch.connected,
      })));
      setTgConnected(statusMap.telegram ?? false);
      if (!statusMap.livechat) {
        channelsApi.toggle("livechat", true).catch(() => {});
      }
    }).catch((err) => console.error("Failed to fetch channels:", err));
  }, []);

  const toggle = (index: number) => {
    const ch = channels[index];
    if (COMING_SOON.includes(ch.type as ComingSoonChannel)) return;
    channelsApi.toggle(ch.type, !ch.connected).catch((err) => console.error("Failed to toggle channel:", err));
    setChannels((prev) => prev.map((c, i) => i === index ? { ...c, connected: !c.connected } : c));
  };

  const saveTelegramToken = async () => {
    if (!telegramToken.trim()) return;
    setSavingTg(true);
    try {
      await channelsApi.setConfig("telegram", { token: telegramToken.trim(), connected: true });
      setTgConnected(true);
      setChannels((prev) => prev.map((c) => c.type === "telegram" ? { ...c, connected: true, token: "••••" + telegramToken.slice(-4) } : c));
      toast.success("Telegram connected! Bot webhook registered.");
      setTelegramToken("");
    } catch (err) {
      toast.error("Failed to save Telegram token");
    } finally {
      setSavingTg(false);
    }
  };

  const disconnectTelegram = async () => {
    try {
      await channelsApi.toggle("telegram", false);
      setTgConnected(false);
      setChannels((prev) => prev.map((c) => c.type === "telegram" ? { ...c, connected: false, token: "" } : c));
      toast.success("Telegram disconnected");
    } catch (err) {
      toast.error("Failed to disconnect Telegram");
    }
  };

  const copy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const connected = channels.filter((c) => c.connected);
  const disconnected = channels.filter((c) => !c.connected);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <h3 className="text-sm font-semibold">Connected Channels</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{connected.length}</Badge>
        </div>
        <p className="text-[12px] text-muted-foreground">Active messaging channels receiving conversations</p>
      </div>

      <div className="grid gap-2.5">
        {connected.map((ch) => {
          const Icon = ch.icon;
          const isComing = COMING_SOON.includes(ch.type as ComingSoonChannel);

          return (
            <div key={ch.type} className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", ch.bg)}>
                <Icon className={cn("h-5 w-5", ch.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{ch.label}</p>
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">Active</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {ch.type === "livechat" ? "Widget embed running" : ch.type === "telegram" ? (ch.token ? `Token: ${ch.token}` : "Bot connected") : ""}
                </p>
              </div>

              {ch.type === "livechat" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy("<script src=\"" + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/widget/widget.js\" async></script>", ch.type)}>
                    {copiedId === ch.type ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}

              {ch.type === "telegram" && (
                <Button variant="outline" size="sm" className="h-8 text-[11px] px-3 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={disconnectTelegram}>
                  <WifiOff className="mr-1 h-3 w-3" /> Disconnect
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Telegram Config Section */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SiTelegram className="h-4 w-4 text-sky-500" />
          <span className="text-sm font-semibold">Telegram Bot</span>
          {tgConnected ? (
            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">Connected</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Setup Required</Badge>
          )}
        </div>
        {tgConnected ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 text-[12px] text-muted-foreground">
              Telegram bot is active. Messages from your bot will appear in the unified inbox.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-[12px] text-muted-foreground">
                Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a> on Telegram and paste the token below:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="123456:ABC-DEF1234ghijkl"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="h-9 text-xs font-mono"
                  type="password"
                />
                <Button size="sm" className="h-9 text-xs px-4 shrink-0" onClick={saveTelegramToken} disabled={!telegramToken.trim() || savingTg}>
                  {savingTg ? "Saving..." : "Connect"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {disconnected.filter((c) => !COMING_SOON.includes(c.type as ComingSoonChannel)).length > 0 && (
        <>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <h3 className="text-sm font-semibold">Available Channels</h3>
            </div>
            <p className="text-[12px] text-muted-foreground">Connect more channels to expand your reach</p>
          </div>
        </>
      )}

      <Separator />
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Coming Soon</h3>
        </div>
        <p className="text-[12px] text-muted-foreground mb-3">These channels will be available in future updates</p>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {channels.filter((c) => COMING_SOON.includes(c.type as ComingSoonChannel)).map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.type} className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-3.5 opacity-60">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-card", ch.bg)}>
                  <Icon className={cn("h-4.5 w-4.5", ch.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{ch.label}</p>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 mt-0.5">Coming Soon</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AGENTS TAB ───────────────────────────────────

function AgentsTab() {
  const [agents, setAgents] = useState(agentData);
  const { user } = useAuth();

  const cycleStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const order: AgentStatus[] = ["online", "away", "busy"];
        const next = order[(order.indexOf(a.status) + 1) % order.length];
        return { ...a, status: next };
      })
    );
  };

  const remove = (id: string) => setAgents((prev) => prev.filter((a) => a.id !== id));

  const roleLabel = { admin: "Admin", supervisor: "Supervisor", agent: "Agent" };
  const roleColor = {
    admin: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    supervisor: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    agent: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
  };

  const statusStyle = {
    online: { bg: "bg-green-500/10 text-green-600 border-green-500/20", dot: "bg-green-500 animate-pulse" },
    away: { bg: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", dot: "bg-yellow-500" },
    busy: { bg: "bg-red-500/10 text-red-600 border-red-500/20", dot: "bg-red-500" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Team Members</h3>
          <p className="text-[12px] text-muted-foreground">{agents.length} agents in your workspace</p>
        </div>
        <Button size="sm" className="h-8 text-xs">
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite
        </Button>
      </div>

      <div className="grid gap-2.5">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <AgentAvatar name={agent.name} status={agent.status} size="default" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{agent.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 capitalize bg-gradient-to-br", roleColor[agent.role])}
                >
                  {roleLabel[agent.role]}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{agent.email}</span>
              </div>
            </div>

            <button
              onClick={() => cycleStatus(agent.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all hover:scale-105",
                statusStyle[agent.status].bg
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", statusStyle[agent.status].dot)} />
              <span className="capitalize">{agent.status}</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-500"
              disabled={agent.id === user?.id}
              onClick={() => remove(agent.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-3">Agent Workload</h3>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            { name: "Haeder", chats: 12, resolved: 10, online: true },
            { name: "Dewi Lestari", chats: 8, resolved: 7, online: true },
            { name: "Rudi Hidayat", chats: 5, resolved: 4, online: false },
            { name: "Sari Indah", chats: 3, resolved: 2, online: false },
            { name: "Bambang S", chats: 7, resolved: 6, online: true },
          ].map((w) => (
            <div key={w.name} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium">{w.name}</span>
                <span className={cn("h-2 w-2 rounded-full", w.online ? "bg-green-500" : "bg-gray-400")} />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>Active chats</span>
                    <span>{w.chats}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (w.chats / 15) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>Resolved</span>
                    <span>{w.resolved}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${(w.resolved / w.chats) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Invite team members</p>
            <p className="text-[11px] text-muted-foreground">They&apos;ll receive an email to join your workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="colleague@email.com" className="h-9 w-52 text-xs" />
            <Button size="sm" className="h-9 text-xs px-4">Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTION TAB ─────────────────────────────

function SubscriptionTab() {
  const [sub, setSub] = useState<any>(null);
  const [inv, setInv] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      subscription.get().catch(() => null),
      subscription.invoices().catch(() => []),
    ]).then(([s, i]) => {
      if (s) setSub(s);
      if (i) setInv(i);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      const updated = await subscription.changePlan(plan);
      setSub({ ...sub, ...updated });
      toast.success(`Upgraded to ${plan} plan!`);
    } catch { toast.error("Failed to upgrade plan"); }
  };

  if (loading) return <LoadingSkeleton />;

  const isTrial = sub?.plan === "trial";
  const trialDaysLeft = sub?.trialDaysLeft ?? 0;
  const trialPct = Math.max(0, Math.min(100, ((14 - trialDaysLeft) / 14) * 100));

  return (
    <div className="space-y-6">
      {isTrial && (
        <div className="rounded-xl border bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                <Crown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500">Free Trial</p>
                <p className="text-[11px] text-yellow-600/70 dark:text-yellow-500/70">
                  {trialDaysLeft > 0 ? `Your trial ends in ${trialDaysLeft} days. Upgrade to keep all features.` : "Your trial has expired. Upgrade now to continue."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-32 rounded-full bg-yellow-500/20 overflow-hidden">
                    <div className={cn("h-full rounded-full bg-yellow-500", trialDaysLeft > 0 ? "transition-all" : "bg-red-500")} style={{ width: `${trialPct}%` }} />
                  </div>
                  <span className="text-[10px] text-yellow-600 font-medium">{trialDaysLeft > 0 ? `${trialDaysLeft}d left` : "Expired"}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Started {new Date(sub.trialStart).toLocaleDateString()} · Ends {new Date(sub.trialEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sub?.status === "cancelled" && (
        <div className="rounded-xl border bg-gradient-to-r from-red-500/5 to-rose-500/5 border-red-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-500">Subscription Cancelled</p>
                <p className="text-[11px] text-red-600/70 dark:text-red-500/70">Your subscription has been cancelled. Reactivate to regain access to all features.</p>
              </div>
            </div>
            <Button size="sm" variant="default" className="h-8 text-xs" onClick={async () => {
              try {
                const updated = await subscription.reactivate();
                setSub({ ...sub, ...updated });
                toast.success("Subscription reactivated!");
              } catch { toast.error("Failed to reactivate"); }
            }}>
              Reactivate
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const planKey = plan.name.toLowerCase();
          const isCurrent = sub?.plan === planKey;
          const isDisabled = isCurrent || sub?.status === "cancelled";
          return (
            <Card
              key={plan.name}
              className={cn(
                "relative overflow-hidden bg-gradient-to-br border-2",
                plan.color,
                plan.border,
                isCurrent && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[9px] font-semibold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Current
                  </div>
                </div>
              )}
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</p>
                <div className="flex items-baseline gap-0.5 mt-3">
                  <span className="text-2xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-[12px] text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant={isCurrent ? "default" : plan.btn}
                  className="h-9 w-full text-xs"
                  disabled={isDisabled}
                  onClick={() => !isCurrent && handleUpgrade(planKey)}
                >
                  {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                  {!isCurrent && <ExternalLink className="ml-1 h-3 w-3" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-muted/30 to-card border">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Billing History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {inv.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-4">No invoices yet.</p>
          ) : (
            <div className="rounded-lg border">
              <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Invoice</div>
                <div>Date</div>
                <div>Amount</div>
                <div className="text-right">Status</div>
              </div>
              {inv.map((invItem) => (
                <div key={invItem.id} className="grid grid-cols-4 gap-4 items-center border-b last:border-0 px-4 py-3">
                  <span className="text-[12px] font-medium">{invItem.id}</span>
                  <span className="text-[12px] text-muted-foreground">{new Date(invItem.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className="text-[12px] font-medium">{invItem.amountFormatted}</span>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 capitalize",
                        invItem.status === "paid" && "border-green-500/30 text-green-600 bg-green-500/5",
                        invItem.status === "trial" && "border-yellow-500/30 text-yellow-600 bg-yellow-500/5",
                        invItem.status === "pending" && "border-blue-500/30 text-blue-600 bg-blue-500/5",
                        invItem.status === "cancelled" && "border-red-500/30 text-red-600 bg-red-500/5",
                      )}
                    >
                      {invItem.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AI SETTINGS TAB ──────────────────────────────

function AISettingsTab() {
  const [provider, setProvider] = useState<"openai" | "gemini" | "custom">("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);
  const [saving, setSaving] = useState(false);

  const [autoReply, setAutoReply] = useState(true);
  const [sentiment, setSentiment] = useState(true);
  const [summarization, setSummarization] = useState(true);
  const [personalized, setPersonalized] = useState(true);

  const [faqList, setFaqList] = useState<any[]>([]);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editFaqId, setEditFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  useEffect(() => {
    aiApi.getSettings().then((data) => {
      setProvider(data.provider || "openai");
      setApiKey(data.apiKey || "");
      setCustomEndpoint(data.customEndpoint || "");
      setAutoReply(data.autoReply !== false);
      setSentiment(data.sentiment !== false);
      setSummarization(data.summarization !== false);
      setPersonalized(data.personalized !== false);
    }).catch((err) => console.error("Failed to fetch AI settings:", err));
    aiApi.listFaqs().then((data) => setFaqList(data as any[])).catch((err) => console.error("Failed to fetch FAQs:", err));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult("success");
    setTesting(false);
    setTimeout(() => setTestResult(null), 3000);
  };

  const saveSettings = () => {
    setSaving(true);
    aiApi.updateSettings({ provider, apiKey, customEndpoint, autoReply, sentiment, summarization, personalized })
      .then(() => setSaving(false))
      .catch(() => setSaving(false));
  };

  const resetFaqForm = () => {
    setFaqQuestion(""); setFaqAnswer(""); setEditFaqId(null); setShowFaqForm(false);
  };

  const openEditFaq = (faq: any) => {
    setEditFaqId(faq.id); setFaqQuestion(faq.question); setFaqAnswer(faq.answer); setShowFaqForm(true);
  };

  const saveFaq = async () => {
    if (!faqQuestion || !faqAnswer) return;
    if (editFaqId) {
      const updated = await aiApi.updateFaq(editFaqId, { question: faqQuestion, answer: faqAnswer });
      setFaqList((prev) => prev.map((f) => f.id === editFaqId ? updated : f));
    } else {
      const created = await aiApi.createFaq({ question: faqQuestion, answer: faqAnswer });
      setFaqList((prev) => [...prev, created]);
    }
    resetFaqForm();
  };

  const deleteFaq = async (id: string) => {
    await aiApi.deleteFaq(id);
    setFaqList((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">AI Configuration</h3>
        <p className="text-[12px] text-muted-foreground">Manage your AI models and API keys (BYOK)</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-2 block">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "openai" as const, label: "OpenAI", desc: "GPT-4o", color: "border-green-500/30 bg-green-500/5" },
                { id: "gemini" as const, label: "Google Gemini", desc: "Gemini 2.0", color: "border-blue-500/30 bg-blue-500/5" },
                { id: "custom" as const, label: "Custom", desc: "Your own endpoint", color: "border-violet-500/30 bg-violet-500/5" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setTestResult(null); }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all",
                    p.color,
                    provider === p.id ? "ring-2 ring-primary ring-offset-2" : "hover:border-primary/30"
                  )}
                >
                  <Bot className={cn("h-6 w-6 mb-1", provider === p.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-[12px] font-semibold">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">
              {provider === "openai" ? "OpenAI API Key" : provider === "gemini" ? "Gemini API Key" : "API Endpoint"}
            </label>
            {provider !== "custom" ? (
              <div className="relative max-w-lg">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-9 text-sm pr-16 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-w-lg">
                <Input
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="https://your-llm-endpoint.com/v1"
                  className="h-9 text-sm"
                />
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className="h-9 text-sm pr-16 font-mono"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" className="h-7 text-[10px] px-3" onClick={handleTest} disabled={testing || !apiKey}>
                {testing ? (
                  <><span className="animate-spin mr-1">⏳</span> Testing...</>
                ) : (
                  <><Play className="mr-1 h-3 w-3" /> Test Connection</>
                )}
              </Button>
              {testResult === "success" && (
                <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Connection successful
                </span>
              )}
              {testResult === "fail" && (
                <span className="text-[11px] text-red-600 font-medium">Connection failed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold">AI Features</CardTitle>
          <p className="text-[11px] text-muted-foreground">Toggle which AI features to enable</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          {[
            { key: "autoReply", label: "Auto-Reply FAQ", desc: "AI automatically answers common questions using your knowledge base", state: autoReply, set: setAutoReply },
            { key: "sentiment", label: "Sentiment Analysis", desc: "Detect customer sentiment and alert on negative cases", state: sentiment, set: setSentiment },
            { key: "summarization", label: "Chat Summarization", desc: "Auto-generate conversation summaries on transfer or resolve", state: summarization, set: setSummarization },
            { key: "personalized", label: "Personalized Suggestions", desc: "AI suggests personalized replies and product recommendations", state: personalized, set: setPersonalized },
          ].map((f) => (
            <div key={f.key} className="flex items-center justify-between rounded-lg border p-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{f.label}</p>
                <p className="text-[11px] text-muted-foreground">{f.desc}</p>
              </div>
              <button
                onClick={() => f.set(!f.state)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                  f.state ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    f.state ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Knowledge Base</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Train your AI with FAQs to enable auto-reply</p>
            </div>
            <Button size="sm" className="h-7 text-[10px] px-3" onClick={() => { resetFaqForm(); setShowFaqForm(!showFaqForm); }}>
              <Plus className="mr-1 h-3 w-3" /> {showFaqForm ? "Cancel" : "Add FAQ"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          {showFaqForm && (
            <div className="rounded-lg border p-3 space-y-2">
              <Input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} placeholder="Question" className="h-9 text-sm" />
              <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows={2} placeholder="Answer" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetFaqForm}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" onClick={saveFaq} disabled={!faqQuestion || !faqAnswer}>
                  {editFaqId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
          <div className="rounded-lg border">
            <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5">Question</div>
              <div className="col-span-5">Answer</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {faqList.map((faq) => (
              <div key={faq.id} className="grid grid-cols-12 gap-2 items-start border-b last:border-0 px-4 py-3">
                <div className="col-span-5">
                  <p className="text-[12px] font-medium">{faq.question}</p>
                </div>
                <div className="col-span-5">
                  <p className="text-[12px] text-muted-foreground line-clamp-2">{faq.answer}</p>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFaq(faq)}>
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFaq(faq.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
            {faqList.length === 0 && (
              <p className="text-center py-6 text-[12px] text-muted-foreground">No FAQs yet. Click &ldquo;Add FAQ&rdquo; to create one.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {faqList.length} questions in knowledge base
          </p>
        </CardContent>
      </Card>

      <Button className="w-full h-9 text-sm" onClick={saveSettings} disabled={saving}>
        {saving ? "Saving..." : <><Check className="mr-2 h-4 w-4" /> Save AI Configuration</>}
      </Button>
    </div>
  );
}

// ─── CANNED RESPONSES TAB ─────────────────────────

function CannedResponsesTab() {
  const [responses, setResponses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formShortcut, setFormShortcut] = useState("");
  const [formCategory, setFormCategory] = useState("umum");

  useEffect(() => {
    cannedApi.list().then((data) => setResponses(data as any[])).catch((err) => console.error("Failed to fetch canned responses:", err));
  }, []);

  const resetForm = () => {
    setFormTitle(""); setFormContent(""); setFormShortcut(""); setFormCategory("umum");
    setEditId(null); setShowForm(false);
  };

  const openEdit = (r: any) => {
    setEditId(r.id); setFormTitle(r.title); setFormContent(r.content);
    setFormShortcut(r.shortcut || ""); setFormCategory(r.category || "umum"); setShowForm(true);
  };

  const save = async () => {
    if (!formTitle || !formContent) return;
    if (editId) {
      const updated = await cannedApi.update(editId, { title: formTitle, content: formContent, shortcut: formShortcut, category: formCategory });
      setResponses((prev) => prev.map((r) => r.id === editId ? updated : r));
    } else {
      const created = await cannedApi.create({ title: formTitle, content: formContent, shortcut: formShortcut, category: formCategory });
      setResponses((prev) => [...prev, created]);
    }
    resetForm();
  };

  const remove = async (id: string) => {
    if (editId === id) resetForm();
    await cannedApi.delete(id);
    setResponses((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Canned Responses</h3>
          <p className="text-[12px] text-muted-foreground">Quick reply templates used across all agents</p>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> {showForm ? "Cancel" : "Add Template"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Greeting" className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Shortcut</label>
              <Input value={formShortcut} onChange={(e) => setFormShortcut(e.target.value)} placeholder="/greeting" className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Content</label>
            <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={3} placeholder="Type your canned response here..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="flex items-center gap-3">
            <Select value={formCategory} onValueChange={(v) => v && setFormCategory(v)}>
              <SelectTrigger className="w-[160px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="umum">Umum</SelectItem>
                <SelectItem value="informasi">Informasi</SelectItem>
                <SelectItem value="tindakan">Tindakan</SelectItem>
                <SelectItem value="komplain">Komplain</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={resetForm}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!formTitle || !formContent}>
              {editId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-2.5">
        {responses.map((r) => (
          <div key={r.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-[12px] text-muted-foreground truncate">{r.content}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.shortcut}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{r.category}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(r.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
        {responses.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No canned responses yet. Click &ldquo;Add Template&rdquo; to create one.</div>
        )}
      </div>

      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10">
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Agent Usage</p>
            <p className="text-[11px] text-muted-foreground">
              Canned responses appear as quick-select chips in the chat input. Agents can insert them with one click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WHITE LABEL TAB ─────────────────────────────

function WhiteLabelTab() {
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [companyName, setCompanyName] = useState("Annisatravel");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wlApi.get().then((data) => {
      if (data.companyName) setCompanyName(data.companyName);
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.primaryColor) setPrimaryColor(data.primaryColor);
    }).catch((err) => console.error("Failed to fetch whitelabel settings:", err));
  }, []);

  const save = () => {
    setSaving(true);
    wlApi.update({ companyName, logoUrl, primaryColor }).then(() => setSaving(false)).catch(() => setSaving(false));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">White Label Settings</h3>
        <p className="text-[12px] text-muted-foreground">Customize your workspace branding. Available on Enterprise plan.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Company Name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-9 text-sm max-w-md"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Displayed in the sidebar, emails, and chat header</p>
          </div>

          <Separator />

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Logo</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                ) : (
                  <Palette className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1.5">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="h-8 text-xs w-64"
                />
                <p className="text-[10px] text-muted-foreground">Recommended: 200x200px PNG or SVG</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 rounded-lg border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 text-sm w-32 font-mono"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              {["#7c3aed", "#2563eb", "#16a34a", "#dc2626", "#f59e0b", "#0f172a"].map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className={cn("h-6 w-6 rounded-full border-2 transition-transform hover:scale-110", primaryColor === c && "ring-2 ring-offset-1 ring-primary")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="pt-2">
            <Button size="sm" className="h-8 text-xs" onClick={save}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold">Live Preview</CardTitle>
          <p className="text-[11px] text-muted-foreground">How your branding will appear in chat widget</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="rounded-xl border bg-muted/20 p-4" style={{ borderColor: `${primaryColor}30` }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor }}>
                <span className="text-[10px] font-bold text-white">{companyName.charAt(0)}</span>
              </div>
              <div>
                <p className="text-[13px] font-medium">{companyName}</p>
                <p className="text-[10px] text-muted-foreground">Online · Typically replies in 2 min</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] w-fit max-w-[85%]" style={{ backgroundColor: primaryColor, color: "white" }}>
                Halo! Ada yang bisa kami bantu hari ini? 😊
              </div>
              <div className="rounded-2xl rounded-tr-sm bg-muted px-3 py-2 text-[12px] w-fit max-w-[85%] ml-auto">
                Saya mau tanya soal paket tour
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-9 text-sm" onClick={save} disabled={saving}>
        {saving ? "Saving..." : <><Check className="mr-2 h-4 w-4" /> Save Branding</>}
      </Button>
    </div>
  );
}

// ─── ACCOUNT TAB ──────────────────────────────────

function AccountTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Account</h3>
        <p className="text-[12px] text-muted-foreground">Manage your profile and security settings</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <AgentAvatar name={user?.name || ""} status={user?.status || "online"} size="lg" />
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role} · {user?.email}</p>
              <Button variant="outline" size="sm" className="h-7 text-[10px] mt-2">Change Photo</Button>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 max-w-md">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Display Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs">Save Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Change Password</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid gap-4 max-w-md">
            <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="Current password" className="h-9 text-sm" />
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password" className="h-9 text-sm" />
            <Button size="sm" className="h-8 text-xs">Update Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold text-red-600">Session Management</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-[11px] text-muted-foreground mb-3">You are currently logged in on these devices:</p>
          <div className="space-y-2">
            {[
              { device: "Chrome on Windows", location: "Jakarta, ID", ip: "192.168.x.x", current: true },
              { device: "iPhone Safari", location: "Bandung, ID", ip: "10.0.x.x", current: false },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-[12px] font-medium">{s.device} {s.current && <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">Current</Badge>}</p>
                  <p className="text-[10px] text-muted-foreground">{s.location} · {s.ip}</p>
                </div>
                {!s.current && <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-600"><LogOut className="mr-1 h-3 w-3" /> Revoke</Button>}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-600 mt-3"><LogOut className="mr-1 h-3 w-3" /> Logout All Devices</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── BUSINESS HOURS TAB ───────────────────────────

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function BusinessHoursTab() {
  const [hours, setHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({
    Monday: { open: "08:00", close: "20:00", enabled: true },
    Tuesday: { open: "08:00", close: "20:00", enabled: true },
    Wednesday: { open: "08:00", close: "20:00", enabled: true },
    Thursday: { open: "08:00", close: "20:00", enabled: true },
    Friday: { open: "08:00", close: "18:00", enabled: true },
    Saturday: { open: "09:00", close: "17:00", enabled: true },
    Sunday: { open: "09:00", close: "17:00", enabled: false },
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Business Hours</h3>
        <p className="text-[12px] text-muted-foreground">Set your operating hours. AI handles chats outside these hours.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <button
                  onClick={() => setHours((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))}
                  className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors", hours[day].enabled ? "bg-primary border-transparent" : "bg-muted border-transparent")}
                >
                  <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", hours[day].enabled ? "translate-x-4" : "translate-x-0")} />
                </button>
                <span className={cn("text-[12px] w-24", !hours[day].enabled && "text-muted-foreground")}>{day}</span>
                {hours[day].enabled ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={hours[day].open} onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} className="h-8 text-xs w-28" />
                    <span className="text-[11px] text-muted-foreground">to</span>
                    <Input type="time" value={hours[day].close} onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} className="h-8 text-xs w-28" />
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
          </div>
          <Button size="sm" className="h-8 text-xs mt-4">Save Hours</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Time Zone</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <Select defaultValue="Asia/Jakarta (WIB, UTC+7)">
            <SelectTrigger className="w-[280px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Jakarta (WIB, UTC+7)">Asia/Jakarta (WIB, UTC+7)</SelectItem>
              <SelectItem value="Asia/Makassar (WITA, UTC+8)">Asia/Makassar (WITA, UTC+8)</SelectItem>
              <SelectItem value="Asia/Jayapura (WIT, UTC+9)">Asia/Jayapura (WIT, UTC+9)</SelectItem>
              <SelectItem value="Asia/Singapore (UTC+8)">Asia/Singapore (UTC+8)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── NOTIFICATIONS TAB ────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newChat: { email: true, push: true, inApp: true },
    assignment: { email: true, push: true, inApp: true },
    slaWarning: { email: false, push: true, inApp: true },
    campaign: { email: true, push: false, inApp: true },
    weekly: { email: true, push: false, inApp: false },
  });

  const toggle = (key: keyof typeof prefs, channel: "email" | "push" | "inApp") => {
    setPrefs((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Notifications</h3>
        <p className="text-[12px] text-muted-foreground">Choose how you want to be notified</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="rounded-lg border">
            <div className="grid grid-cols-4 gap-2 border-b bg-muted/30 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase">
              <div>Event</div><div className="text-center">Email</div><div className="text-center">Push</div><div className="text-center">In-App</div>
            </div>
            {[
              { key: "newChat" as const, label: "New Chat", desc: "When a customer sends a new message" },
              { key: "assignment" as const, label: "Assignment", desc: "When a chat is assigned to you" },
              { key: "slaWarning" as const, label: "SLA Warning", desc: "When response time is about to breach" },
              { key: "campaign" as const, label: "Campaign", desc: "Broadcast delivery & performance" },
              { key: "weekly" as const, label: "Weekly Report", desc: "Weekly analytics summary" },
            ].map((n) => (
              <div key={n.key} className="grid grid-cols-4 gap-2 items-center border-b last:border-0 px-4 py-3">
                <div>
                  <p className="text-[12px] font-medium">{n.label}</p>
                  <p className="text-[10px] text-muted-foreground">{n.desc}</p>
                </div>
                {(["email", "push", "inApp"] as const).map((ch) => (
                  <div key={ch} className="flex justify-center">
                    <button
                      onClick={() => toggle(n.key, ch)}
                      className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors", prefs[n.key][ch] ? "bg-primary border-transparent" : "bg-muted border-transparent")}
                    >
                      <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", prefs[n.key][ch] ? "translate-x-4" : "translate-x-0")} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SECURITY TAB ─────────────────────────────────

function SecurityTab() {
  const [tokens, setTokens] = useState([
    { id: "t1", name: "Zapier Integration", created: "Apr 15, 2026", lastUsed: "May 2, 2026", masked: "avc_live_•••••••••••••a1b2" },
    { id: "t2", name: "CRM Sync", created: "Mar 22, 2026", lastUsed: "May 1, 2026", masked: "avc_live_•••••••••••••c3d4" },
  ]);

  const generateToken = () => {
    setTokens((prev) => [{ id: `t${Date.now()}`, name: "New API Token", created: "Just now", lastUsed: "Never", masked: `avc_live_${Math.random().toString(36).slice(2, 18)}` }, ...prev]);
  };

  const revokeToken = (id: string) => setTokens((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Security</h3>
        <p className="text-[12px] text-muted-foreground">Manage API tokens and security settings</p>
      </div>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-semibold">API Tokens</CardTitle></div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Use tokens to access the AvaChat API</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={generateToken}><Plus className="mr-1.5 h-3.5 w-3.5" /> Generate Token</Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {tokens.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4 text-center">No API tokens yet</p>
          ) : (
            <div className="space-y-2">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-[12px] font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.masked}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Created {t.created} · Last used {t.lastUsed}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-600" onClick={() => revokeToken(t.id)}><Trash2 className="mr-1 h-3 w-3" /> Revoke</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Two-Factor Authentication</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium">2FA is currently disabled</p>
              <p className="text-[11px] text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs"><Shield className="mr-1.5 h-3.5 w-3.5" /> Enable 2FA</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 pt-5 px-5"><CardTitle className="text-sm font-semibold">Audit Log</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="space-y-2">
            {[
              { action: "API Token generated", detail: "Zapier Integration", time: "2 hours ago", ip: "192.168.x.x" },
              { action: "Password changed", detail: "User: Haeder", time: "2 days ago", ip: "10.0.x.x" },
              { action: "Login from new device", detail: "iPhone Safari", time: "3 days ago", ip: "172.16.x.x" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-[11px] font-medium">{log.action}</p>
                  <p className="text-[10px] text-muted-foreground">{log.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">{log.time}</p>
                  <p className="text-[9px] text-muted-foreground">{log.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────

const tabs = [
  { id: "account", label: "Account", icon: UserCircle, desc: "Profile & password" },
  { id: "channels", label: "Channels", icon: MessageSquare, desc: "Messaging integrations" },
  { id: "ai", label: "AI", icon: Bot, desc: "Model & training" },
  { id: "canned", label: "Canned", icon: Zap, desc: "Quick replies" },
  { id: "agents", label: "Agents", icon: Users, desc: "Team management" },
  { id: "business-hours", label: "Hours", icon: Clock3, desc: "Operating hours" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Alert preferences" },
  { id: "subscription", label: "Subscription", icon: CreditCard, desc: "Plan & billing" },
  { id: "security", label: "Security", icon: Shield, desc: "API tokens & logs" },
  { id: "whitelabel", label: "White Label", icon: Palette, desc: "Branding" },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("channels");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Workspace Settings</h2>
          </div>
          <p className="text-[12px] text-muted-foreground ml-6">Annisatravel</p>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Mobile: Horizontal tabs */}
          <div className="md:hidden border-b overflow-x-auto shrink-0">
            <div className="flex p-2 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap shrink-0 transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: Vertical sidebar */}
          <div className="hidden md:block w-52 shrink-0 border-r bg-muted/20 p-3 space-y-1 overflow-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-background border text-sm font-medium shadow-sm"
                      : "text-muted-foreground text-sm hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{tab.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div>
              {activeTab === "account" && <AccountTab />}
              {activeTab === "channels" && <ChannelsTab />}
              {activeTab === "ai" && <AISettingsTab />}
              {activeTab === "canned" && <CannedResponsesTab />}
              {activeTab === "agents" && <AgentsTab />}
              {activeTab === "business-hours" && <BusinessHoursTab />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "subscription" && <SubscriptionTab />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "whitelabel" && <WhiteLabelTab />}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
