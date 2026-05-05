import { toast } from "sonner";

export function notifyNewChat(customerName: string, channel: string) {
  toast(`${customerName}`, {
    description: `New message via ${channel}`,
    action: {
      label: "View",
      onClick: () => {},
    },
  });
}

export function notifyAssignment(agentName: string) {
  toast("Chat assigned", {
    description: `Assigned to ${agentName}`,
  });
}

export function notifySLAWarning(conversation: string, remaining: string) {
  toast.warning(`SLA Warning: ${conversation}`, {
    description: `Only ${remaining} remaining to respond`,
  });
}

export function notifyCollision(agentName: string) {
  toast.error(`${agentName} is viewing`, {
    description: "Another agent is viewing this conversation",
  });
}

export function notifyResolved(customerName: string) {
  toast.success(`Chat resolved`, {
    description: `${customerName} conversation has been resolved`,
  });
}
