import { motion } from "framer-motion";

function FeatureCard({ icon: Icon, title, description, index }) {
  return (
    <motion.article
      className="bg-white rounded-2xl shadow-md p-6 transition-all border border-green-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35 }}
      whileHover={{ scale: 1.05, boxShadow: "0 16px 35px rgba(21, 128, 61, 0.16)" }}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <Icon size={30} />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 text-center">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 text-center leading-relaxed">{description}</p>
    </motion.article>
  );
}

export default FeatureCard;
