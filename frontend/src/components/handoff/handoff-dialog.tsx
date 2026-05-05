import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: { id: string; name: string }[];
  currentAgentId?: string;
  onSubmit: (agentId: string, reason: string) => void;
}

export function HandoffDialog({ open, onOpenChange, agents, currentAgentId, onSubmit }: HandoffDialogProps) {
  const [targetAgent, setTargetAgent] = useState("");
  const [reason, setReason] = useState("");

  const availableAgents = agents.filter((a) => a.id !== currentAgentId);

  const handleSubmit = () => {
    if (!targetAgent) return;
    onSubmit(targetAgent, reason);
    setTargetAgent("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="h-4 w-4" />
            Request Handoff
          </DialogTitle>
          <DialogDescription className="text-xs">
            Transfer this conversation to another agent. They can accept or reject the request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Transfer to</label>
            <Select value={targetAgent} onValueChange={(v) => v && setTargetAgent(v)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 block">Reason (optional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Need senior agent assistance..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleSubmit} disabled={!targetAgent}>Request Handoff</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
