/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { crm as crmApi } from "@/lib/api";
import {
  Search,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit3,
  Download,
  Upload,
  MessageSquare,
  Send,
  Globe,
  Users,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
  SiTiktok,
  SiGmail,
} from "react-icons/si";
import type { ChannelType } from "@/types";

const channelMap: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  whatsapp: { icon: SiWhatsapp, color: "text-green-500", label: "WhatsApp" },
  instagram: { icon: SiInstagram, color: "text-pink-500", label: "Instagram" },
  telegram: { icon: SiTelegram, color: "text-blue-500", label: "Telegram" },
  livechat: { icon: Globe, color: "text-purple-500", label: "Live Chat" },
  facebook: { icon: SiFacebook, color: "text-blue-600", label: "Facebook" },
  tiktok: { icon: SiTiktok, color: "text-gray-600", label: "TikTok" },
  email: { icon: SiGmail, color: "text-orange-500", label: "Email" },
};

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  channel: ChannelType;
  lastContact: string;
  totalChats: number;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  segment: string;
  location?: string;
  source?: string;
}

const initialContacts: Contact[] = [
  { id: "1", name: "Budi Santoso", phone: "+62812345678", email: "budi@email.com", channel: "whatsapp", lastContact: "2m ago", totalChats: 5, sentiment: "neutral", tags: ["tour", "bali"], segment: "Tour Inquiry", location: "Jakarta", source: "Instagram Ad" },
  { id: "2", name: "Siti Rahayu", phone: "+62823456789", email: "siti@email.com", channel: "instagram", lastContact: "15m ago", totalChats: 3, sentiment: "positive", tags: ["diskon", "grup"], segment: "Group Booking", location: "Bandung", source: "Organic" },
  { id: "3", name: "Agus Wijaya", phone: "+62834567890", email: "agus@email.com", channel: "telegram", lastContact: "45m ago", totalChats: 2, sentiment: "positive", tags: ["booking"], segment: "Booked", location: "Surabaya", source: "Referral" },
  { id: "4", name: "Rina Amelia", phone: "+62898765432", email: "rina@email.com", channel: "livechat", lastContact: "3m ago", totalChats: 8, sentiment: "negative", tags: ["urgent", "guide", "komplain"], segment: "Active Customer", location: "Denpasar", source: "Website" },
  { id: "5", name: "Traveloka Support", email: "support@traveloka.com", channel: "email", lastContact: "2h ago", totalChats: 4, sentiment: "neutral", tags: ["booking", "konfirmasi"], segment: "Partner", source: "B2B" },
  { id: "6", name: "Dian Permata", phone: "+62856789012", channel: "facebook", lastContact: "25m ago", totalChats: 2, sentiment: "positive", tags: ["honeymoon", "lombok"], segment: "Lead", location: "Yogyakarta", source: "Facebook Ad" },
  { id: "7", name: "Hendra Gunawan", phone: "+62867890123", channel: "tiktok", lastContact: "8m ago", totalChats: 1, sentiment: "neutral", tags: ["trip", "info"], segment: "Lead", location: "Malang", source: "TikTok" },
  { id: "8", name: "Maya Putri", phone: "+62878901234", email: "maya@email.com", channel: "whatsapp", lastContact: "1h ago", totalChats: 6, sentiment: "positive", tags: ["tour", "lombok", "repeat"], segment: "Repeat Customer", location: "Medan", source: "Referral" },
  { id: "9", name: "Reza Firmansyah", phone: "+6289012345", channel: "instagram", lastContact: "3h ago", totalChats: 1, sentiment: "negative", tags: ["komplain", "refund"], segment: "Churned", location: "Semarang", source: "Organic" },
  { id: "10", name: "PT Indo Wisata", phone: "+62890123456", email: "info@indowisata.co.id", channel: "email", lastContact: "1d ago", totalChats: 12, sentiment: "positive", tags: ["booking", "enterprise", "vip"], segment: "VIP Client", location: "Jakarta", source: "B2B" },
];

const sentimentConfig = {
  positive: { icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10 text-green-600 border-green-500/20" },
  neutral: { icon: Minus, color: "text-gray-400", bg: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  negative: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const emptyContact = (): Contact => ({ id: "", name: "", phone: "", email: "", channel: "whatsapp" as ChannelType, lastContact: "Just now", totalChats: 0, sentiment: "neutral", tags: [], segment: "Lead" });

function ContactDetailSheet({ contact, onClose, router }: { contact: Contact; onClose: () => void; router: ReturnType<typeof useRouter> }) {
  const SentimentIcon = sentimentConfig[contact.sentiment].icon;
  const ch = channelMap[contact.channel];
  const ChIcon = ch.icon;

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="!w-full sm:!w-[420px] sm:max-w-[420px] p-6 overflow-auto">
        <SheetHeader className="mb-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{contact.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">{contact.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{contact.segment}</Badge>
                <div className="flex items-center gap-1">
                  <SentimentIcon className={cn("h-3.5 w-3.5", sentimentConfig[contact.sentiment].color)} />
                  <span className="text-[11px] text-muted-foreground capitalize">{contact.sentiment}</span>
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>
        <Separator className="mb-5" />
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3.5">
            {contact.phone && (<div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Phone</p><p className="text-[13px] font-medium">{contact.phone}</p></div>)}
            {contact.email && (<div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Email</p><p className="text-[13px] font-medium truncate">{contact.email}</p></div>)}
            <div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Channel</p><div className="flex items-center gap-2"><ChIcon className={cn("h-4 w-4", ch.color)} /><span className="text-[13px] font-medium">{ch.label}</span></div></div>
            <div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Chats</p><p className="text-[13px] font-medium">{contact.totalChats} conversations</p></div>
            {contact.location && (<div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Location</p><p className="text-[13px]">{contact.location}</p></div>)}
          </div>
          <div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Tags</p><div className="flex flex-wrap gap-1.5">{contact.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-[11px] px-2.5 py-1">{tag}</Badge>))}<button className="inline-flex items-center rounded-full border border-dashed px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"><Plus className="h-3.5 w-3.5 mr-1" /> Add</button></div></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" onClick={() => { router.push("/dashboard"); onClose(); }}><MessageSquare className="mr-2 h-4 w-4 text-blue-500" /> View Chat History</Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" onClick={() => { router.push("/broadcast"); onClose(); }}><Send className="mr-2 h-4 w-4 text-green-500" /> Send Message</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EditDialog({ contact, open, onClose, onSave, segments }: { contact: Contact | null; open: boolean; onClose: () => void; onSave: (c: Contact) => void; segments: string[] }) {
  const [form, setForm] = useState<Contact>(emptyContact());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (contact) setForm({ ...contact });
    else setForm(emptyContact());
  }, [contact, open]);

  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || `c-${Date.now()}` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{contact?.id ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
            </div>
            <Input placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
            <Input placeholder="Email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
            <Select value={form.channel} onValueChange={(v) => v && setForm({ ...form, channel: v as ChannelType })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(channelMap).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={form.segment} onValueChange={(v) => v && setForm({ ...form, segment: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {segments.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={form.sentiment} onValueChange={(v) => v && setForm({ ...form, sentiment: v as Contact["sentiment"] })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">😊 Positive</SelectItem>
                <SelectItem value="neutral">😐 Neutral</SelectItem>
                <SelectItem value="negative">😟 Negative</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 text-sm col-span-2" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-9 flex-1 text-xs" onClick={save}>{contact?.id ? "Save Changes" : "Add Contact"}</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs px-4" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "recent" | "chats">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    crmApi.contacts.list().then((data) => {
      const mapped = (data as any[]).map((c: Record<string, unknown>) => ({
        id: c.id as string, name: c.name as string, phone: c.phone as string | undefined,
        email: c.email as string | undefined, channel: (c.channel || "whatsapp") as ChannelType,
        lastContact: c.lastContact as string, totalChats: c.totalChats as number,
        sentiment: (c.sentiment || "neutral") as "positive" | "neutral" | "negative",
        tags: (c.tags || []) as string[], segment: (c.segment || "Lead") as string,
        location: c.location as string | undefined, source: c.source as string | undefined,
      }));
      setContacts(mapped.length > 0 ? mapped : initialContacts);
    }).catch(() => setContacts(initialContacts));
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))];
  const segments = [...new Set(contacts.map((c) => c.segment))];
  const channelIds = [...new Set(contacts.map((c) => c.channel))] as ChannelType[];

  let filtered = contacts.filter((c) => {
    if (search) { const q = search.toLowerCase(); if (!c.name.toLowerCase().includes(q) && !c.phone?.includes(q) && !c.email?.toLowerCase().includes(q)) return false; }
    if (selectedTag && !c.tags.includes(selectedTag)) return false;
    if (selectedSegment && c.segment !== selectedSegment) return false;
    if (selectedChannel && c.channel !== selectedChannel) return false;
    if (selectedSentiment && c.sentiment !== selectedSentiment) return false;
    return true;
  });

  if (sortBy === "name") filtered = [...filtered].sort((a, b) => sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  else if (sortBy === "chats") filtered = [...filtered].sort((a, b) => sortDir === "asc" ? a.totalChats - b.totalChats : b.totalChats - a.totalChats);

  const toggleSelect = (id: string) => { setSelectedIds((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; }); };
  const toggleAll = () => { if (selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map((c) => c.id))); };
  const bulkDelete = () => { contacts.filter((c) => selectedIds.has(c.id)).forEach((c) => crmApi.contacts.delete(c.id).catch((err) => console.error("Failed to delete contact:", err))); setContacts((prev) => prev.filter((c) => !selectedIds.has(c.id))); setSelectedIds(new Set()); };
  const bulkSegment = (seg: string) => { contacts.filter((c) => selectedIds.has(c.id)).forEach((c) => crmApi.contacts.update(c.id, { segment: seg }).catch((err) => console.error("Failed to update segment:", err))); setContacts((prev) => prev.map((c) => selectedIds.has(c.id) ? { ...c, segment: seg } : c)); setSelectedIds(new Set()); };
  const addContact = async (c: Contact) => {
    if (c.id && contacts.find((x) => x.id === c.id)) {
      const updated = await crmApi.contacts.update(c.id, c);
      setContacts((prev) => prev.map((x) => x.id === c.id ? { ...c, ...updated } : x));
    } else {
      const created = await crmApi.contacts.create(c);
      setContacts((prev) => [{ ...c, id: created.id }, ...prev]);
    }
  };
  const deleteContact = (id: string) => { crmApi.contacts.delete(id).catch((err) => console.error("Failed to delete contact:", err)); setContacts((prev) => prev.filter((c) => c.id !== id)); };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Channel", "Segment", "Sentiment", "Tags", "Location", "Source"];
    const rows = filtered.map((c) => [c.name, c.phone || "", c.email || "", c.channel, c.segment, c.sentiment, c.tags.join(";"), c.location || "", c.source || ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "contacts.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const imported: Contact[] = lines.slice(1).map((line, i) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, ""));
        return { id: `imp-${Date.now()}-${i}`, name: cols[0] || "Unknown", phone: cols[1], email: cols[2], channel: (cols[3] as ChannelType) || "whatsapp", segment: cols[4] || "Lead", sentiment: (cols[5] as Contact["sentiment"]) || "neutral", tags: cols[6]?.split(";").filter(Boolean) || [], location: cols[7], source: cols[8], lastContact: "Just now", totalChats: 0 };
      });
      setContacts((prev) => [...imported, ...prev]);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Contacts</h2>
              </div>
              <p className="text-[12px] text-muted-foreground ml-6">{contacts.length} contacts</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 h-3.5 w-3.5" /> Import</Button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
              <Button size="sm" className="h-8 text-xs" onClick={() => { setEditingContact(null); setShowEdit(true); }}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add</Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <Card className="bg-gradient-to-br from-card to-muted/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{contacts.length}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Total Contacts</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-muted/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{contacts.reduce((a, c) => a + c.totalChats, 0).toLocaleString()}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Total Chats</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-muted/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                      <TrendingUp className="h-5 w-5 text-violet-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{contacts.filter(c => c.sentiment === "positive").length}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Positive</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-muted/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{contacts.filter(c => c.sentiment === "negative").length}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Negative</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email..." className="pl-8 h-8 text-xs" />
              </div>
              <Select value={selectedChannel ?? ""} onValueChange={(v) => setSelectedChannel(v || null)}>
                <SelectTrigger size="sm" className="w-[130px] text-xs"><SelectValue placeholder="All Channels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Channels</SelectItem>
                  {channelIds.map((ch) => (<SelectItem key={ch} value={ch}>{channelMap[ch].label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={selectedSegment ?? ""} onValueChange={(v) => setSelectedSegment(v || null)}>
                <SelectTrigger size="sm" className="w-[130px] text-xs"><SelectValue placeholder="All Segments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Segments</SelectItem>
                  {segments.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={selectedSentiment ?? ""} onValueChange={(v) => setSelectedSentiment(v || null)}>
                <SelectTrigger size="sm" className="w-[140px] text-xs"><SelectValue placeholder="All Sentiment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sentiment</SelectItem>
                  <SelectItem value="positive">😊 Positive</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="negative">😟 Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] border transition-colors", selectedTag === tag ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted")}>{tag}</button>
              ))}
              {(selectedTag || selectedSegment || selectedChannel || selectedSentiment) && (
                <button onClick={() => { setSelectedTag(null); setSelectedSegment(null); setSelectedChannel(null); setSelectedSentiment(null); }} className="shrink-0 text-[10px] text-muted-foreground underline ml-1">Clear</button>
              )}
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 border bg-primary/5 px-4 md:px-8 py-2 shrink-0">
                <span className="text-[11px] font-medium">{selectedIds.size} selected</span>
                <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-600" onClick={bulkDelete}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
                <Select onValueChange={(v: string | null) => { if (v) bulkSegment(v); }}>
                  <SelectTrigger size="sm" className="h-7 text-[10px] w-[150px]"><SelectValue placeholder="Move to segment..." /></SelectTrigger>
                  <SelectContent>
                    {segments.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <button onClick={() => setSelectedIds(new Set())} className="text-[10px] text-muted-foreground underline ml-auto">Cancel</button>
              </div>
            )}

            {/* Content: Desktop Table / Mobile Cards */}
            <div className="flex-1 overflow-auto">
              {/* Mobile cards */}
              <div className="md:hidden space-y-1 p-2">
                {filtered.map((contact) => {
                  const ch = channelMap[contact.channel];
                  const ChIcon = ch.icon;
                  const SentIcon = sentimentConfig[contact.sentiment].icon;
                  return (
                    <div key={contact.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="h-4 w-4 shrink-0" />
                      <button onClick={() => setSelectedContact(contact)} className="flex flex-1 items-center gap-3 text-left">
                        <Avatar className="h-10 w-10 shrink-0"><AvatarFallback className="text-xs">{contact.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><span className="text-[13px] font-medium truncate">{contact.name}</span><ChIcon className={cn("h-3 w-3 shrink-0", ch.color)} /></div>
                          <p className="text-[11px] text-muted-foreground truncate">{contact.phone || contact.email || "—"}</p>
                          <div className="flex items-center gap-1.5 mt-1"><Badge variant="secondary" className="text-[9px] px-1 py-0">{contact.segment}</Badge><SentIcon className={cn("h-2.5 w-2.5", sentimentConfig[contact.sentiment].color)} /><span className="text-[9px] text-muted-foreground ml-auto">{contact.totalChats} chats</span></div>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingContact(contact); setShowEdit(true); }}><Edit3 className="h-3 w-3 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteContact(contact.id)}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <table className="hidden md:table w-full">
                <thead className="border-b bg-muted/30 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 w-8"><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="h-4 w-4" /></th>
                    <th className="px-6 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">
                      <button onClick={() => { setSortBy("name"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-foreground">Name {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">Contact</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">Channel</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">Segment</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">Sentiment</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-muted-foreground uppercase">Tags</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-medium text-muted-foreground uppercase">
                      <button onClick={() => { setSortBy("chats"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-foreground">Chats {sortBy === "chats" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</button>
                    </th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-muted-foreground uppercase w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => {
                    const ch = channelMap[contact.channel];
                    const ChIcon = ch.icon;
                    const SentIcon = sentimentConfig[contact.sentiment].icon;
                    return (
                      <tr key={contact.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="px-4 py-2.5"><input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="h-4 w-4" /></td>
                        <td className="px-6 py-2.5 cursor-pointer" onClick={() => setSelectedContact(contact)}>
                          <div className="flex items-center gap-2.5"><Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{contact.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}</AvatarFallback></Avatar><span className="text-[13px] font-medium">{contact.name}</span></div>
                        </td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1 text-[11px] text-muted-foreground">{contact.phone ? <><Phone className="h-3 w-3" /> {contact.phone}</> : <><Mail className="h-3 w-3" /> {contact.email}</>}</div></td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1"><ChIcon className={cn("h-3 w-3", ch.color)} /><span className="text-[11px] text-muted-foreground">{ch.label}</span></div></td>
                        <td className="px-4 py-2.5"><Badge variant="secondary" className="text-[10px] px-1 py-0">{contact.segment}</Badge></td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1"><SentIcon className={cn("h-2.5 w-2.5", sentimentConfig[contact.sentiment].color)} /><span className="text-[9px] text-muted-foreground capitalize">{contact.sentiment}</span></div></td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1">{contact.tags.slice(0, 3).map((tag) => (<Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">{tag}</Badge>))}{contact.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{contact.tags.length - 3}</span>}</div></td>
                        <td className="px-4 py-2.5 text-center"><span className="text-[12px] font-medium">{contact.totalChats}</span></td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingContact(contact); setShowEdit(true); }}><Edit3 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteContact(contact.id)}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedContact && (<ContactDetailSheet contact={selectedContact} onClose={() => setSelectedContact(null)} router={router} />)}
        {showEdit && (<EditDialog contact={editingContact} open={showEdit} onClose={() => setShowEdit(false)} onSave={addContact} segments={segments} />)}
      </div>
    </AppLayout>
  );
}
