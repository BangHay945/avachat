import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Webhook,
  Send,
  Smartphone,
  Check,
  Copy,
  Code,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
  SiTiktok,
} from "react-icons/si";
import { Globe } from "lucide-react";

const channels = [
  { id: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/30" },
  { id: "telegram", label: "Telegram", icon: SiTelegram, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  { id: "livechat", label: "Live Chat", icon: Globe, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  { id: "facebook", label: "Facebook", icon: SiFacebook, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/30" },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/30" },
];

const templates = [
  { label: "Tour Inquiry", text: "Halo, saya mau tanya soal paket tour ke Raja Ampat bulan Agustus. Ada yang available?" },
  { label: "Booking", text: "Saya mau booking paket Bali 4D3N untuk 2 orang tanggal 20 Juni. Bisa dibantu?" },
  { label: "Complaint", text: "Saya sudah di lokasi tapi guide-nya belum datang. Ini sudah hampir 1 jam. Tolong dibantu!" },
  { label: "Info Harga", text: "Mau tanya harga paket honeymoon ke Lombok untuk bulan depan. Ada promo?" },
  { label: "Custom", text: "" },
];

export default function SimulatorPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [channel, setChannel] = useState("whatsapp");
  const [customerName, setCustomerName] = useState("Andi Pratama");
  const [customerPhone, setCustomerPhone] = useState("+62811112222");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [log, setLog] = useState<{ type: string; text: string; time: string }[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const selectedChannel = channels.find((c) => c.id === channel)!;
  const ChIcon = selectedChannel.icon;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSent(false);

    try {
      const res = await fetch("http://localhost:4000/api/v1/webhook/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customerName,
          customerPhone,
          message,
        }),
      });
      await res.json();
      setSent(true);
      setLog((prev) => [
        {
          type: "success",
          text: `✅ Sent: ${customerName} via ${selectedChannel.label} — "${message}"`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setMessage("");
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setLog((prev) => [
        {
          type: "error",
          text: `❌ Failed to send: ${err}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  const webhookPayload = JSON.stringify({
    channel,
    customerName,
    customerPhone,
    message: message || "Hello, this is a test message",
    timestamp: new Date().toISOString(),
  }, null, 2);

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Webhook Simulator</h2>
          </div>
          <p className="text-[12px] text-muted-foreground ml-6">Simulate incoming messages from external channels</p>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl grid gap-6 lg:grid-cols-2">

            {/* Compose */}
            <Card>
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Simulate Message</CardTitle>
                </div>
                <p className="text-[11px] text-muted-foreground">Send a test message from an external channel</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    {channels.map((ch) => {
                      const Icon = ch.icon;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setChannel(ch.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all",
                            channel === ch.id ? `${ch.border} ${ch.bg} font-medium` : "hover:bg-muted"
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", ch.color)} />
                          {ch.label}
                          {channel === ch.id && <Check className="ml-auto h-3 w-3 text-green-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Customer Name</label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone / ID</label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-9 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Message Templates</label>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {templates.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setMessage(t.text)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                          message === t.text && t.text ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Message</label>
                  <div className="relative">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type the incoming message..."
                      rows={3}
                      className="text-sm resize-none pr-16"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 h-8 text-xs"
                      onClick={handleSend}
                      disabled={sending || !message.trim()}
                    >
                      {sending ? (
                        "Sending..."
                      ) : sent ? (
                        <><Check className="mr-1 h-3.5 w-3.5" /> Sent!</>
                      ) : (
                        <><Send className="mr-1 h-3.5 w-3.5" /> Send</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview + Log */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">Preview</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <ChIcon className={cn("h-4 w-4", selectedChannel.color)} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium">{customerName || "Customer"}</p>
                        <p className="text-[10px] text-muted-foreground">{customerPhone} · via {selectedChannel.label}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-card dark:bg-zinc-800 px-4 py-3 border">
                      <p className="text-[13px] whitespace-pre-wrap">{message || "Message preview will appear here..."}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Delivered via {selectedChannel.label} webhook
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">Webhook Payload</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={() => navigator.clipboard.writeText(webhookPayload)}
                    >
                      <Copy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <pre className="rounded-lg bg-zinc-950 text-green-400 p-4 text-[11px] font-mono overflow-auto max-h-[200px]">
                    {webhookPayload}
                  </pre>
                </CardContent>
              </Card>

              {log.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-1.5 max-h-[200px] overflow-auto">
                      {log.slice(0, 15).map((l, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="text-[10px] text-muted-foreground w-12 shrink-0">{l.time}</span>
                          <span className={l.type === "error" ? "text-red-500" : "text-green-600 dark:text-green-400"}>
                            {l.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
