import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, X, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingHandoff {
  id: string;
  conversation_id: string;
  from_agent_name: string;
  customer_name: string;
  channel: string;
  reason: string;
  created_at: string;
}

interface PendingHandoffsProps {
  handoffs: PendingHandoff[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function PendingHandoffs({ handoffs, onAccept, onReject }: PendingHandoffsProps) {
  const [open, setOpen] = useState(false);

  if (handoffs.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {handoffs.length}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Handoff Requests ({handoffs.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-auto">
          {handoffs.map((h) => (
            <div key={h.id} className="px-2 py-2 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium truncate">{h.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    From: {h.from_agent_name} · {h.channel}
                  </p>
                  {h.reason && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
                      "{h.reason}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-6 text-[10px] flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { onAccept(h.id); }}
                >
                  <Check className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => { onReject(h.id); }}
                >
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
              <DropdownMenuSeparator />
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
