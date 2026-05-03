import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function AuthRequiredModal({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <h3 className="text-xl font-semibold text-gray-900">Login Required</h3>
        <p className="mt-2 text-gray-600">
          Please register or login to reserve a parking slot.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white"
            onClick={() => navigate("/auth")}
          >
            Login
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border border-green-600 px-4 py-2 text-green-700"
            onClick={() => navigate("/auth")}
          >
            Register
          </button>
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-700"
          onClick={onClose}
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

export default AuthRequiredModal;
