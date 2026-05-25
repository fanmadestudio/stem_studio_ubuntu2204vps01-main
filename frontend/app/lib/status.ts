export function getStatusClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (["paid", "confirmed", "available", "ready"].includes(normalized)) return "status ok";
  if (["partial", "partially paid", "pending", "maintenance", "busy"].includes(normalized)) return "status warn";
  return "status danger";
}
