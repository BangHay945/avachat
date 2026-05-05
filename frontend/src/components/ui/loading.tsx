import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className, count = 1 }: { className?: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded-lg bg-muted", className)} />
      ))}
    </>
  );
}

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <div className="flex items-center justify-center p-8">
      <div className={cn(s, "animate-spin rounded-full border-2 border-primary border-t-transparent")} />
    </div>
  );
}
