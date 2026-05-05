/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/auth-context";
import { crm as crmApi } from "@/lib/api";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, TrendingUp, DollarSign, Target, X, Edit3, Trash2 } from "lucide-react";
import { LoadingSpinner, LoadingSkeleton } from "@/components/ui/loading";

const stages = [
  { id: "lead", label: "Lead", color: "bg-blue-500" },
  { id: "qualified", label: "Qualified", color: "bg-cyan-500" },
  { id: "proposal", label: "Proposal", color: "bg-violet-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { id: "closed_won", label: "Won", color: "bg-green-500" },
  { id: "closed_lost", label: "Lost", color: "bg-red-400" },
];

export default function DealsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", contactName: "", value: 0, stage: "lead", probability: 10, notes: "" });

  useEffect(() => { if (isLoading) return; if (!isAuthenticated) router.replace("/login"); }, [isLoading, isAuthenticated, router]);
  useEffect(() => { crmApi.deals.list().then((d) => { setDeals(d as any[]); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const resetForm = () => setForm({ title: "", contactName: "", value: 0, stage: "lead", probability: 10, notes: "" });
  const totalValue = deals.filter((d) => d.stage !== "closed_lost").reduce((a, d) => a + d.value, 0);

  const save = async () => {
    if (!form.title) return;
    if (editId) {
      const updated = await crmApi.deals.update(editId, form);
      setDeals((prev) => prev.map((d) => d.id === editId ? updated : d));
    } else {
      const created = await crmApi.deals.create(form);
      setDeals((prev) => [...prev, created]);
    }
    resetForm(); setShowForm(false); setEditId(null);
  };

  const remove = async (id: string) => { try { await crmApi.deals.delete(id); setDeals((prev) => prev.filter((d) => d.id !== id)); } catch (err) { console.error("Failed to delete deal:", err); } };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-card px-4 md:px-8 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">Deals Pipeline</h2>
              </div>
              <p className="text-[12px] text-muted-foreground ml-6">{deals.length} deals · Rp {totalValue.toLocaleString()} total</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {showForm ? "Cancel" : "Add Deal"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {showForm && (
            <Card className="mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Deal title" className="h-9 text-sm" />
                  <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact name" className="h-9 text-sm" />
                  <Input type="number" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="Value (Rp)" className="h-9 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Select value={form.stage} onValueChange={(v) => v && setForm({ ...form, stage: v })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Probability:</span>
                    <input type="range" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} className="flex-1" />
                    <span className="text-xs font-medium w-8">{form.probability}%</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                    <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!form.title}>{editId ? "Update" : "Create"}</Button>
                  </div>
                </div>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notes..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
              </CardContent>
            </Card>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.id);
              const stageTotal = stageDeals.reduce((a, d) => a + d.value, 0);
              return (
                <div key={stage.id} className="rounded-xl border bg-card">
                  <div className={cn("h-1 rounded-t-xl", stage.color)} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{stage.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{stageDeals.length}</Badge>
                    </div>
                    {stageTotal > 0 && <p className="text-[10px] text-muted-foreground mb-2">Rp {stageTotal.toLocaleString()}</p>}
                    <div className="space-y-2">
                      {stageDeals.map((deal) => (
                        <div key={deal.id} className="rounded-lg border bg-muted/20 p-2.5 group">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{deal.title}</p>
                              {deal.contactName && <p className="text-[10px] text-muted-foreground truncate">{deal.contactName}</p>}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => { setEditId(deal.id); setForm({ title: deal.title, contactName: deal.contactName || "", value: deal.value, stage: deal.stage, probability: deal.probability, notes: deal.notes || "" }); setShowForm(true); }}>
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button onClick={() => remove(deal.id)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold">Rp {deal.value.toLocaleString()}</span>
                            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full", stage.color)} style={{ width: `${deal.probability}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
                          </div>
                        </div>
                      ))}
                      {stageDeals.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No deals</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
