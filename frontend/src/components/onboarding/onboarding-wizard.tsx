import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  MessageCircle,
  Globe,
  UserPlus,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
  SiTiktok,
  SiGmail,
} from "react-icons/si";

const allChannels = [
  { id: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500", bg: "bg-green-500/10", desc: "Business API" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, color: "text-pink-500", bg: "bg-pink-500/10", desc: "Graph API" },
  { id: "telegram", label: "Telegram", icon: SiTelegram, color: "text-sky-500", bg: "bg-sky-500/10", desc: "Bot API" },
  { id: "livechat", label: "Live Chat", icon: Globe, color: "text-violet-500", bg: "bg-violet-500/10", desc: "Web widget" },
  { id: "facebook", label: "Facebook", icon: SiFacebook, color: "text-blue-600", bg: "bg-blue-600/10", desc: "Messenger" },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-500/10", desc: "Business API" },
  { id: "email", label: "Email", icon: SiGmail, color: "text-orange-500", bg: "bg-orange-500/10", desc: "SMTP/IMAP" },
];

const steps = [
  { id: 1, label: "Channels", icon: MessageCircle, desc: "Connect your messaging channels" },
  { id: 2, label: "Team", icon: UserPlus, desc: "Invite your agents" },
  { id: 3, label: "AI Training", icon: BookOpen, desc: "Teach your AI assistant" },
];

interface Props {
  onClose: () => void;
}

export function OnboardingWizard({ onClose }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["whatsapp", "instagram"]);
  const [agentEmails, setAgentEmails] = useState<string[]>(["dewi@avachat.id"]);
  const [newEmail, setNewEmail] = useState("");
  const [faqs, setFaqs] = useState([
    { q: "Apa saja paket tour yang tersedia?", a: "Kami menyediakan paket tour domestik dan internasional. Silakan pilih destinasi favorit Anda!" },
    { q: "Bagaimana cara booking?", a: "Hubungi kami via chat ini atau website resmi. Proses booking mudah dan cepat." },
  ]);

  const toggleChannel = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const addAgent = () => {
    if (newEmail.trim() && !agentEmails.includes(newEmail.trim())) {
      setAgentEmails((prev) => [...prev, newEmail.trim()]);
      setNewEmail("");
    }
  };

  const removeAgent = (email: string) => {
    setAgentEmails((prev) => prev.filter((e) => e !== email));
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { q: "", a: "" }]);
  };

  const updateFaq = (index: number, field: "q" | "a", value: string) => {
    setFaqs((prev) => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    localStorage.setItem("avachat_onboarding_done", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold">Welcome to AvaChat</h2>
              <p className="text-[11px] text-muted-foreground">Let&apos;s set up your workspace in 3 steps</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="border-b bg-muted/20 px-6 py-3">
          <div className="flex items-center gap-2 mb-2">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center gap-2 flex-1 rounded-lg px-3 py-2 transition-colors",
                    step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  <s.icon className="h-4 w-4" />
                  <span className="text-[11px] font-medium">{s.label}</span>
                </div>
                {s.id < 3 && <div className={cn("h-px w-4", step > s.id ? "bg-green-500" : "bg-muted-foreground/30")} />}
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Step {step} of 3 — {steps[step - 1].desc}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-auto">
          {/* Step 1: Channels */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Choose your channels</h3>
              </div>
              <p className="text-[12px] text-muted-foreground">Select the messaging platforms you want to connect. You can add more later.</p>
              <div className="grid grid-cols-2 gap-2">
                {allChannels.map((ch) => {
                  const isSelected = selected.includes(ch.id);
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 p-3.5 transition-all text-left",
                        isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted"
                      )}
                    >
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ch.bg)}>
                        <Icon className={cn("h-5 w-5", ch.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium">{ch.label}</p>
                        <p className="text-[10px] text-muted-foreground">{ch.desc}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Agents */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Invite your team</h3>
              </div>
              <p className="text-[12px] text-muted-foreground">Add agents who will handle customer conversations.</p>

              <div className="flex gap-2">
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colleague@email.com"
                  className="h-9 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAgent(); } }}
                />
                <Button size="sm" className="h-9 text-xs px-4" onClick={addAgent}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {agentEmails.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{agentEmails.length} agent(s) invited</p>
                  {agentEmails.map((email) => (
                    <div key={email} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">{email.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[12px] font-medium">{email}</p>
                          <p className="text-[10px] text-muted-foreground">Invitation pending</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAgent(email)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border bg-muted/20 p-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[12px] font-medium">You: {user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">Admin — automatically added</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: FAQs */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Train your AI</h3>
              </div>
              <p className="text-[12px] text-muted-foreground">Add FAQs so your AI can auto-reply to common customer questions.</p>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="rounded-xl border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">FAQ #{i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFaq(i)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                    <Input
                      value={faq.q}
                      onChange={(e) => updateFaq(i, "q", e.target.value)}
                      placeholder="Question (e.g., What are your operating hours?)"
                      className="h-8 text-sm"
                    />
                    <Textarea
                      value={faq.a}
                      onChange={(e) => updateFaq(i, "a", e.target.value)}
                      placeholder="Answer..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full h-9 text-xs" onClick={addFaq}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add FAQ
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleFinish}>
              Skip all
            </Button>
            {step < 3 ? (
              <Button size="sm" className="h-8 text-xs" onClick={() => setStep(step + 1)}>
                Next <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="h-8 text-xs" onClick={handleFinish}>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Finish Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
