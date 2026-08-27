export function categoryVariant(category: string) {
  if (category === "HOT") return "hot" as const;
  if (category === "HIGH") return "high" as const;
  if (category === "MEDIUM") return "medium" as const;
  return "low" as const;
}

export function categoryLabel(category: string) {
  if (category === "HOT") return "🔥 HOT";
  if (category === "HIGH") return "🟢 HIGH";
  if (category === "MEDIUM") return "🟡 MEDIUM";
  return "⚪ LOW";
}
