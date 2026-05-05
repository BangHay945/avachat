/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import { campaigns as campaignsApi } from "@/lib/api";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SendHorizontal,
  TrendingUp,
  MousePointerClick,
  Target,
  Check,
  Mail,
  Globe,
  Zap,
  Clock,
  Trash2,
  CopyIcon,
  Edit3,
  Save,
  Search,
  Eye,
  Send,
  ImageIcon,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
} from "react-icons/si";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  segment: string;
  message: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  status: "sent" | "sending" | "draft" | "scheduled";
  createdAt: string;
  scheduledAt?: string;
}

const segments = ["All Customers", "Tour Inquiry", "Group Booking", "Booked", "Active Customer", "Repeat Customer", "Lead", "VIP Client", "Partner", "Churned"];

const templates = [
  { label: "Promo Diskon", text: "🎉 Promo spesial! Diskon 20% untuk semua paket tour domestik. Booking sekarang sebelum kehabisan!" },
  { label: "Follow Up Lead", text: "Halo! Masih tertarik dengan paket tour kami? Ada penawaran spesial bulan ini. Klik link di bio untuk info lengkap! 🏝️" },
  { label: "VIP Exclusive", text: "Dear VIP member, Anda mendapat akses eksklusif ke paket tour premium sebelum publik. Cek katalog terbaru kami! ✨" },
  { label: "Holiday Greeting", text: "Selamat hari raya! 🎊 Semoga selalu bahagia bersama keluarga. Jangan lupa rencanakan liburan Anda bersama kami." },
];

const channelOptions = [
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
  { value: "instagram", label: "Instagram", icon: SiInstagram, color: "text-pink-500" },
  { value: "telegram", label: "Telegram", icon: SiTelegram, color: "text-sky-500" },
  { value: "email", label: "Email", icon: Mail, color: "text-orange-500" },
];

  function StatCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
    return (
      <Card className="bg-gradient-to-br from-card to-muted/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    );
  }

function ReportDialog({ campaign, open, onClose }: { campaign: Campaign | null; open: boolean; onClose: () => void }) {
  const [tracking, setTracking] = useState<any>(null);
  useEffect(() => {
    if (campaign) campaignsApi.tracking(campaign.id).then((d) => setTracking(d as any)).catch((err) => console.error("Failed to fetch tracking:", err));
  }, [campaign?.id]);
  if (!campaign) return null;
  const openRate = Math.round((campaign.opened / campaign.delivered) * 100);
  const clickRate = Math.round((campaign.clicked / campaign.delivered) * 100);
  const convRate = tracking ? tracking.openRate : Math.round((campaign.clicked / campaign.opened) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{campaign.name} — Report</DialogTitle>
          <p className="text-[11px] text-muted-foreground">{campaign.segment} · {campaign.channel} · {new Date(campaign.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sent", value: campaign.sent, color: "text-blue-500" },
              { label: "Delivered", value: `${campaign.delivered} (${Math.round((campaign.delivered/campaign.sent)*100)}%)`, color: "text-cyan-500" },
              { label: "Opened", value: `${campaign.opened} (${openRate}%)`, color: "text-green-500" },
              { label: "Clicked", value: `${campaign.clicked} (${clickRate}%)`, color: "text-violet-500" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className={cn("text-lg font-bold", m.color)}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Conversion Funnel</p>
            <div className="flex items-end gap-3 h-24">
              {[
                { label: "Sent", value: campaign.sent, pct: 100, color: "bg-blue-500" },
                { label: "Delivered", value: campaign.delivered, pct: Math.round((campaign.delivered/campaign.sent)*100), color: "bg-cyan-500" },
                { label: "Opened", value: campaign.opened, pct: openRate, color: "bg-green-500" },
                { label: "Clicked", value: campaign.clicked, pct: clickRate, color: "bg-violet-500" },
              ].map((f) => (
                <div key={f.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium">{f.value}</span>
                  <div className={cn("w-full rounded-t-lg", f.color)} style={{ height: `${Math.max(4, f.pct)}%`, minHeight: "8px" }} />
                  <span className="text-[9px] text-muted-foreground">{f.label} ({f.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Engagement</p>
            <div className="space-y-2">
              {[
                { label: "Open-to-Click Rate", value: `${convRate}%`, bar: convRate, color: "bg-violet-500" },
                { label: "Bounce Rate", value: `${Math.round(((campaign.sent-campaign.delivered)/campaign.sent)*100)}%`, bar: Math.round(((campaign.sent-campaign.delivered)/campaign.sent)*100), color: "bg-red-500" },
              ].map((e) => (
                <div key={e.label} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-32">{e.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full", e.color)} style={{ width: `${e.bar}%` }} />
                  </div>
                  <span className="text-[11px] font-medium w-10 text-right">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BroadcastPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"compose" | "campaigns">("campaigns");
  const [channel, setChannel] = useState("whatsapp");
  const [segment, setSegment] = useState("All Customers");
  const [message, setMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [testSending, setTestSending] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    campaignsApi.list().then((data) => setCampaigns(data as any[])).catch((err) => console.error("Failed to fetch campaigns:", err));
  }, []);

  if (!isAuthenticated) return null;

  const totalSent = campaigns.filter(c => c.status === "sent").reduce((a, c) => a + c.sent, 0);
  const totalClicks = campaigns.filter(c => c.status === "sent").reduce((a, c) => a + c.clicked, 0);
  const totalDelivered = campaigns.filter(c => c.status === "sent").reduce((a, c) => a + c.delivered, 0);
  const totalOpened = campaigns.filter(c => c.status === "sent").reduce((a, c) => a + c.opened, 0);

  const addOrUpdateCampaign = () => {
    if (!campaignName || !message) return;
    if (editingCampaign) {
      campaignsApi.update(editingCampaign, { name: campaignName, channel, segment, message, scheduledAt: schedule ? `${scheduleDate} ${scheduleTime}` : undefined }).then((updated) => {
        setCampaigns((prev) => prev.map((c) => c.id === editingCampaign ? updated : c));
      }).catch((err) => console.error("Failed to update campaign:", err));
      setEditingCampaign(null);
    } else {
      const status: Campaign["status"] = schedule ? "scheduled" : "sent";
      campaignsApi.create({ name: campaignName, channel, segment, message, status, scheduledAt: schedule ? `${scheduleDate} ${scheduleTime}` : undefined }).then((created) => {
        setCampaigns((prev) => [{ ...created, createdAt: created.createdAt || "Just now" }, ...prev]);
      }).catch((err) => console.error("Failed to create campaign:", err));
    }
    resetForm();
    setTab("campaigns");
  };

  const saveAsDraft = () => {
    if (!campaignName && !message) return;
    if (editingCampaign) {
      campaignsApi.update(editingCampaign, { name: campaignName, channel, segment, message, status: "draft" }).then((updated) => {
        setCampaigns((prev) => prev.map((c) => c.id === editingCampaign ? updated : c));
      }).catch((err) => console.error("Failed to update draft:", err));
      setEditingCampaign(null);
    } else {
      campaignsApi.create({ name: campaignName || "Untitled Draft", channel, segment, message: message || "(Empty message)", status: "draft" }).then((created) => {
        setCampaigns((prev) => [created, ...prev]);
      }).catch((err) => console.error("Failed to create draft:", err));
    }
    resetForm();
    setTab("campaigns");
  };

  const deleteCampaign = (id: string) => { campaignsApi.delete(id).catch((err) => console.error("Failed to delete campaign:", err)); setCampaigns((prev) => prev.filter((c) => c.id !== id)); };

  const duplicateCampaign = (c: Campaign) => {
    setCampaignName(`${c.name} (Copy)`);
    setChannel(c.channel);
    setSegment(c.segment);
    setMessage(c.message);
    setSchedule(false);
    setEditingCampaign(null);
    setTab("compose");
  };

  const editDraft = (c: Campaign) => {
    setCampaignName(c.name);
    setChannel(c.channel);
    setSegment(c.segment);
    setMessage(c.message);
    setEditingCampaign(c.id);
    setSchedule(false);
    setTab("compose");
  };

  const sendTest = async () => {
    setTestSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setTestSending(false);
  };

  const resetForm = () => {
    setCampaignName("");
    setMessage("");
    setSchedule(false);
    setScheduleDate("");
    setScheduleTime("");
    setEditingCampaign(null);
  };

  const filtered = campaigns.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.segment.toLowerCase().includes(q) && !c.channel.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <SendHorizontal className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Broadcast & Campaigns</h2>
              </div>
              <p className="text-[12px] text-muted-foreground ml-6">Send mass messages to customer segments</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => { resetForm(); setTab("compose"); }}>
              <Zap className="mr-1.5 h-3.5 w-3.5" /> New Broadcast
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="space-y-6 md:space-y-8">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <StatCard label="Total Sent" value={totalSent.toLocaleString()} icon={SendHorizontal} color="text-blue-500" bg="bg-blue-500/10" />
              <StatCard label="Open Rate" value={`${totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0}%`} sub={`${totalOpened} opened`} icon={MousePointerClick} color="text-green-500" bg="bg-green-500/10" />
              <StatCard label="Click Rate" value={`${totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0}%`} sub={`${totalClicks} clicks`} icon={TrendingUp} color="text-violet-500" bg="bg-violet-500/10" />
              <StatCard label="Campaigns" value={String(campaigns.length)} sub={`${campaigns.filter(c => c.status === "draft").length} drafts`} icon={Target} color="text-amber-500" bg="bg-amber-500/10" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-lg border p-1">
                {(["campaigns", "compose"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 text-xs rounded-md font-medium transition-colors capitalize", tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {t === "campaigns" ? "Campaign History" : editingCampaign ? "Edit Campaign" : "Compose"}
                  </button>
                ))}
              </div>
              {tab === "campaigns" && (
                <>
                  <div className="relative flex-1 max-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-xs" />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                    <SelectTrigger size="sm" className="w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {tab === "compose" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-semibold">{editingCampaign ? "Edit Campaign" : "New Broadcast"}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-4">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Campaign Name</label>
                      <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Promo Bulan Ini" className="h-9 text-sm" />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Channel</label>
                      <div className="grid grid-cols-2 gap-2">
                        {channelOptions.map((ch) => {
                          const Icon = ch.icon;
                          return (
                            <button key={ch.value} onClick={() => setChannel(ch.value)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors", channel === ch.value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted")}>
                              <Icon className={cn("h-4 w-4", ch.color)} /> {ch.label}
                              {channel === ch.value && <Check className="ml-auto h-3.5 w-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Target Segment</label>
                      <Select value={segment} onValueChange={(v) => v && setSegment(v)}>
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {segments.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Template</label>
                      <div className="flex flex-wrap gap-1.5">
                        {templates.map((t) => (
                          <button key={t.label} onClick={() => setMessage(t.text)} className={cn("rounded-full border px-2.5 py-1 text-[10px] transition-colors", message === t.text ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Media</label>
                      {attachedImage ? (
                        <div className="relative rounded-lg border overflow-hidden w-fit">
                          <img src={attachedImage} alt="Attached" className="max-h-32 object-cover" />
                          <button
                            onClick={() => { setAttachedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full"
                        >
                          <ImageIcon className="h-4 w-4" /> Attach an image <span className="text-[10px] opacity-60">(optional)</span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setAttachedImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Message</label>
                      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Compose your broadcast message..." rows={5} className="text-sm resize-none" />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{message.length}/1024</span>
                        <span className="text-[10px] text-muted-foreground">Estimated: ~450 customers</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Schedule</label>
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setSchedule(false)} className={cn("rounded-full px-3 py-1 text-[10px] border transition-colors", !schedule ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Send Now</button>
                        <button onClick={() => setSchedule(true)} className={cn("rounded-full px-3 py-1 text-[10px] border transition-colors", schedule ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>
                          <Clock className="mr-1 h-3 w-3 inline" /> Schedule
                        </button>
                      </div>
                      {schedule && (
                        <div className="flex gap-2">
                          <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-9 text-sm flex-1" />
                          <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-9 text-sm w-32" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 h-9 text-sm" disabled={!campaignName || !message} onClick={addOrUpdateCampaign}>
                        {schedule ? <><Clock className="mr-2 h-4 w-4" /> Schedule</> : <><SendHorizontal className="mr-2 h-4 w-4" /> {editingCampaign ? "Update" : "Send Now"}</>}
                      </Button>
                      <Button variant="outline" className="h-9 text-sm px-3" onClick={saveAsDraft}>
                        <Save className="mr-1.5 h-4 w-4" /> Draft
                      </Button>
                      <Button variant="outline" className="h-9 text-sm px-3" onClick={sendTest} disabled={testSending || !message}>
                        {testSending ? <><span className="animate-spin mr-1">⏳</span> Sending...</> : <><Send className="mr-1.5 h-4 w-4" /> Test</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-semibold">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="rounded-xl border bg-muted/30 dark:bg-zinc-800/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <span className="text-[10px] font-bold text-primary-foreground">AT</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-medium">Ava Travel</p>
                          <p className="text-[10px] text-muted-foreground">via {channelOptions.find((c) => c.value === channel)?.label}</p>
                        </div>
                      </div>
                      {attachedImage && (
                        <div className="rounded-lg overflow-hidden">
                          <img src={attachedImage} alt="Preview" className="max-h-40 w-full object-cover" />
                        </div>
                      )}
                      <div className="rounded-2xl rounded-tl-sm bg-card dark:bg-zinc-800 border px-4 py-3">
                        <p className="text-[13px] whitespace-pre-wrap">{message || "Your message preview will appear here..."}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">📊 Sent to {segment} · {schedule ? `Scheduled: ${scheduleDate} ${scheduleTime}` : "Send immediately"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === "campaigns" && (
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No campaigns found</p>
                  </div>
                ) : (
                  filtered.map((c) => {
                    const openRate = c.delivered > 0 ? Math.round((c.opened / c.delivered) * 100) : 0;
                    const clickRate = c.delivered > 0 ? Math.round((c.clicked / c.delivered) * 100) : 0;
                    const chIcon = channelOptions.find((ch) => ch.value === c.channel)?.icon ?? Globe;
                    const ChIcon = chIcon;
                    const statusStyle = {
                      sent: { variant: "default" as const, label: "Sent" },
                      sending: { variant: "secondary" as const, label: "Sending" },
                      draft: { variant: "secondary" as const, label: "Draft" },
                      scheduled: { variant: "outline" as const, label: "Scheduled" },
                    };
                    const st = statusStyle[c.status];
                    return (
                      <Card key={c.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                <ChIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-semibold">{c.name}</h4>
                                  <Badge variant={st.variant} className={cn("text-[9px] px-1.5 py-0", c.status === "scheduled" && "border-yellow-500/30 text-yellow-600")}>{st.label}</Badge>
                                  {c.scheduledAt && <span className="text-[10px] text-muted-foreground">📅 {c.scheduledAt}</span>}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{c.segment} · {c.channel} · {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {c.status === "draft" && (
                                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => editDraft(c)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>
                              )}
                              {c.status === "sent" && (
                                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setReportCampaign(c)}><Eye className="mr-1 h-3 w-3" /> View Report</Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateCampaign(c)} title="Duplicate"><CopyIcon className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCampaign(c.id)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></Button>
                            </div>
                          </div>
                          <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4">{c.message}</p>
                          {c.status === "sent" && (
                            <>
                              <Separator className="mb-3" />
                              <div className="grid grid-cols-4 gap-4">
                                {[
                                  { label: "Sent", value: c.sent.toLocaleString() },
                                  { label: "Delivered", value: `${c.delivered.toLocaleString()} (${Math.round((c.delivered/c.sent)*100)}%)` },
                                  { label: "Opened", value: `${c.opened.toLocaleString()} (${openRate}%)` },
                                  { label: "Clicked", value: `${c.clicked.toLocaleString()} (${clickRate}%)` },
                                ].map((m) => (
                                  <div key={m.label}>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{m.label}</p>
                                    <p className="text-[13px] font-semibold mt-0.5">{m.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
                                  <div className="h-full bg-blue-500" style={{ width: `${Math.round((c.delivered/c.sent)*100)}%` }} />
                                  <div className="h-full bg-green-500" style={{ width: `${openRate}%` }} />
                                  <div className="h-full bg-violet-500" style={{ width: `${clickRate}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground">Funnel: {clickRate}% conversion</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {reportCampaign && (
        <ReportDialog campaign={reportCampaign} open={!!reportCampaign} onClose={() => setReportCampaign(null)} />
      )}
    </AppLayout>
  );
}
