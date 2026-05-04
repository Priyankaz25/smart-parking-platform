/**
 * Parse a simple schedule string like "06:00 - 23:00" or "6-22" into { from, to }.
 */
export function parseAvailabilityWindow(raw) {
  const s = String(raw || "").trim();
  if (!s) return { from: "06:00", to: "23:00" };
  const parts = s
    .split(/\s*[-–]\s*|\s+to\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return { from: "06:00", to: "23:00" };

  const norm = (t) => {
    const x = t.replace(/\s/g, "");
    if (/^\d{1,2}:\d{2}$/.test(x)) {
      const [h, m] = x.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    }
    if (/^\d{1,2}$/.test(x)) return `${x.padStart(2, "0")}:00`;
    return x;
  };

  return { from: norm(parts[0]), to: norm(parts[1]) };
}
