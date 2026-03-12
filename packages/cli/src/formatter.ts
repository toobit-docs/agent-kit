export function formatJson(data: unknown, json: boolean): string {
  if (json) return JSON.stringify(data, null, 2);
  if (data === null || data === undefined) return "No data.";
  if (typeof data !== "object") return String(data);
  return JSON.stringify(data, null, 2);
}

export function formatTable(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "No data.";
  const keys = columns ?? Object.keys(rows[0]);
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)),
  );

  const header = keys.map((k, i) => k.padEnd(widths[i])).join("  ");
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  const body = rows.map((row) =>
    keys.map((k, i) => String(row[k] ?? "").padEnd(widths[i])).join("  "),
  ).join("\n");

  return `${header}\n${separator}\n${body}`;
}
