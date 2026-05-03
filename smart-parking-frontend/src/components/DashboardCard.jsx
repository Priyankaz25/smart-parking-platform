import { motion } from "framer-motion";

function DashboardCard({ label, value, index = 0 }) {
  return (
    <motion.div
      className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ scale: 1.03, boxShadow: "0 14px 30px rgba(0,0,0,0.08)" }}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-800">{value}</h3>
    </motion.div>
  );
}

export default DashboardCard;
