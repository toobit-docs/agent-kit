function extractRows(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value !== null) {
    const entries = Object.values(value as Record<string, unknown>);
    for (const v of entries) {
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

export function formatJson(data: unknown, json: boolean): string {
  if (json) return JSON.stringify(data, null, 2);
  if (data === null || data === undefined) return "No data.";
  if (typeof data !== "object") return String(data);

  const record = data as Record<string, unknown>;
  const inner = record.data ?? record;

  const rows = extractRows(inner);
  if (rows) {
    if (rows.length === 0) return "No data.";
    if (typeof rows[0] === "object" && rows[0] !== null) {
      return formatTable(rows as Record<string, unknown>[]);
    }
    return rows.map(String).join("\n");
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
  return entries.map(([k, v]) => {
    if (typeof v === "object") return `${k.padEnd(maxKey)}  ${JSON.stringify(v)}`;
    return `${k.padEnd(maxKey)}  ${String(v)}`;
  }).join("\n");
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
