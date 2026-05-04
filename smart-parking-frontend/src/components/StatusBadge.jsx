const VARIANTS = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  active: "bg-slate-50 text-slate-800 ring-slate-200",
  blocked: "bg-red-50 text-red-800 ring-red-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  disputed: "bg-orange-50 text-orange-800 ring-orange-200",
  resolved: "bg-blue-50 text-blue-800 ring-blue-200",
  default: "bg-gray-50 text-gray-700 ring-gray-200",
};

function normalizeKey(value) {
  return String(value || "default")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function StatusBadge({ status, label }) {
  const key = normalizeKey(status);
  const cls = VARIANTS[key] || VARIANTS.default;
  const text = label || status || "—";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {text}
    </span>
  );
}
