import { motion } from "framer-motion";

function DashboardCard({ label, value, hint, index = 0 }) {
  return (
    <motion.div
      className="dashboard-stat-card rounded-2xl bg-white p-6 shadow-sm border border-slate-100/90"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2, boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </motion.div>
  );
}

export default DashboardCard;
