export function Thinking() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
      className="flex items-center gap-2 text-muted-foreground"
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-current opacity-75" />
        <span className="relative inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
      </span>
      <span className="animate-pulse">Thinking…</span>
    </div>
  );
}
