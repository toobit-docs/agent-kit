export function formatJson(data: unknown, json: boolean): string {
  if (json) return JSON.stringify(data, null, 2);
  if (data === null || data === undefined) return "No data.";
  if (typeof data !== "object") return String(data);

  const record = data as Record<string, unknown>;
  const inner = record.data ?? record;

  if (Array.isArray(inner)) {
    if (inner.length === 0) return "No data.";
    if (typeof inner[0] === "object" && inner[0] !== null) {
      return formatTable(inner as Record<string, unknown>[]);
    }
    return inner.map(String).join("\n");
  }

  if (typeof inner === "object" && inner !== null) {
    return formatKv(inner as Record<string, unknown>);
  }

  return String(inner);
}

export function formatKv(data: Record<string, unknown>): string {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "No data.";
  const maxKey = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([k, v]) => `${k.padEnd(maxKey)}  ${String(v)}`).join("\n");
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
