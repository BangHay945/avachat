import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Users,
  BarChart3,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import {
  SiWhatsapp,
  SiInstagram,
  SiTelegram,
  SiFacebook,
} from "react-icons/si";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 dark:bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="AvaChat" className="h-8 w-8" />
            <span className="text-base font-bold">AvaChat</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <Button size="sm" className="h-8 text-xs" onClick={() => router.push("/login")}>Sign In</Button>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t bg-background dark:bg-background px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#pricing" className="block text-sm text-muted-foreground" onClick={() => setMobileMenu(false)}>Pricing</a>
            <Button size="sm" className="w-full h-8 text-xs" onClick={() => router.push("/login")}>Sign In</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-16 md:pb-28 md:pt-24 text-center">
          <Badge variant="secondary" className="mb-6 text-[11px] px-3 py-1 rounded-full">
            🚀 Now in Public Beta
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            All Your Customer Chats in{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
              One Place
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            AvaChat unifies WhatsApp, Instagram, Telegram, Email, and Live Chat into a single dashboard. Powered by AI agents that work alongside your human team.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="h-11 px-8 text-sm" onClick={() => router.push("/login")}>
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-8 text-sm">
              Watch Demo
            </Button>
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground">14-day free trial · No credit card required</p>
        </div>

        {/* Channel icons floating */}
        <div className="mx-auto max-w-3xl flex items-center justify-center gap-3 pb-16 md:pb-24 opacity-50">
          {[
            { icon: SiWhatsapp, color: "text-green-500/80" },
            { icon: SiInstagram, color: "text-pink-500/80" },
            { icon: SiTelegram, color: "text-sky-500/80" },
            { icon: SiFacebook, color: "text-blue-600/80" },
            { icon: Globe, color: "text-[#8B5CF6]/80" },
          ].map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.color} className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card">
                <Icon className={ch.color} size={20} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Everything You Need to Scale Support</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">AvaChat combines omnichannel messaging with AI-powered automation.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, title: "Unified Inbox", desc: "WhatsApp, Instagram, Telegram, Email, Live Chat — all in one dashboard. No more switching tabs.", color: "text-blue-500/80", bg: "bg-blue-500/10" },
              { icon: Zap, title: "AI Auto-Reply", desc: "AI instantly answers FAQs using your knowledge base. Escalates to human agents when needed.", color: "text-[#8B5CF6]/80", bg: "bg-[#8B5CF6]/10" },
              { icon: Users, title: "Agent Collaboration", desc: "Round-robin assignment, chat transfer, internal notes, and collision detection for seamless teamwork.", color: "text-green-500/80", bg: "bg-green-500/10" },
              { icon: BarChart3, title: "Analytics & Insights", desc: "Track response times, CSAT scores, sentiment trends, and agent performance in real-time.", color: "text-amber-500/80", bg: "bg-amber-500/10" },
              { icon: Shield, title: "Multi-Tenant SaaS", desc: "Isolated data per tenant, role-based access control, and enterprise-grade security.", color: "text-red-500/80", bg: "bg-red-500/10" },
              { icon: TrendingUp, title: "CRM Integration", desc: "Two-way sync with your CRM. Customer data, chat history, and segmentations flow automatically.", color: "text-teal-500/80", bg: "bg-teal-500/10" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl mb-4", f.bg)}>
                    <Icon className={cn("h-5 w-5", f.color)} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10K+", label: "Businesses" },
            { value: "2M+", label: "Messages / day" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 1s", label: "Message Delivery" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[13px] text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-muted/20 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-muted-foreground">Start with a 14-day free trial. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                name: "Basic",
                price: "Rp 500K",
                period: "/month",
                desc: "For small teams getting started",
                features: ["2 Agents", "3 Channels", "1.000 chats/mo", "Basic AI FAQ", "Email support"],
                popular: false,
              },
              {
                name: "Pro",
                price: "Rp 2,5M",
                period: "/month",
                desc: "For growing businesses",
                features: ["10 Agents", "All Channels", "10.000 chats/mo", "AI FAQ + Sentiment", "Priority support", "CRM Integration"],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For large organizations",
                features: ["Unlimited agents", "All channels", "Unlimited chats", "Full AI Suite", "Dedicated support", "White-label"],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border bg-card p-6",
                  plan.popular && "ring-2 ring-primary shadow-lg scale-[1.02]"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-[10px] px-3 py-0.5">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="text-[12px] text-muted-foreground mt-1">{plan.desc}</p>
                <div className="mt-4 flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-[13px] text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500/80 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="mt-6 h-10 w-full text-sm"
                  onClick={() => router.push("/login")}
                >
                  {plan.popular ? "Start Free Trial" : "Get Started"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Loved by Customer Teams</h2>
            <p className="mt-3 text-muted-foreground">Join thousands of businesses that trust AvaChat.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "PT Indo Wisata", role: "Head of CS, Travel", text: "AvaChat memotong response time kami dari 10 menit ke 2 menit. AI FAQ-nya benar-benar membantu agent fokus ke case kompleks.", rating: 5 },
              { name: "CV Maju Jaya", role: "E-commerce Owner", text: "Integrasi dengan CRM custom kami berjalan mulus. Sekarang semua data customer tersentralisasi dalam satu dashboard.", rating: 5 },
              { name: "Bali Tours Co.", role: "Operations Manager", text: "Collision detection dan internal notes adalah game changer. Agent kami sekarang kolaborasi tanpa tumpang tindih.", rating: 5 },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < t.rating ? "text-amber-500/80 fill-amber-500/80" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">{t.name.split(" ").slice(-1)[0][0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-medium">{t.name.split(" ").slice(-1)[0]}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ready to Transform Your Customer Experience?</h2>
          <p className="mt-4 text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
          <div className="mt-8">
            <Button size="lg" className="h-11 px-8 text-sm" onClick={() => router.push("/login")}>
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="" className="h-4 w-4 opacity-50" />
            <span className="text-[13px] text-muted-foreground">© 2026 AvaChat. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">Terms</a>
            <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
