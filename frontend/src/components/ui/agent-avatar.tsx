import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AgentStatus } from "@/types";

const statusColor: Record<AgentStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

const statusPulse: Record<AgentStatus, string> = {
  online: "animate-pulse",
  away: "",
  busy: "",
};

interface AgentAvatarProps {
  name: string;
  avatar?: string;
  status?: AgentStatus;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const dotSize = {
  sm: "size-2",
  default: "size-2.5",
  lg: "size-3",
};

export function AgentAvatar({ name, avatar, status, size = "default", className }: AgentAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar size={size}>
        <AvatarImage src={avatar} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background",
            dotSize[size],
            statusColor[status],
            statusPulse[status]
          )}
        />
      )}
    </div>
  );
}
