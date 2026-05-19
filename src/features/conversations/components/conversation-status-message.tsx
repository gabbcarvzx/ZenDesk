export function ConversationStatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error" | "info";
}) {
  const className =
    tone === "success"
      ? "border-[#abefc6] bg-[#ecfdf3] text-[#067647]"
      : tone === "error"
        ? "border-[#ffd8d3] bg-[#fff1f0] text-danger"
        : "border-border bg-surface-muted text-muted";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>
      {message}
    </div>
  );
}
