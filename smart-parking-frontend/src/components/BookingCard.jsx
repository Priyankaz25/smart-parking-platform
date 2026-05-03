import { motion } from "framer-motion";
import { Calendar, MapPin, Wallet } from "lucide-react";

const statusClass = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
  rejected: "bg-rose-100 text-rose-700",
  disputed: "bg-orange-100 text-orange-700",
};

function BookingCard({
  booking,
  highlighted = false,
  actions = null,
}) {
  const status = booking.status || "pending";
  const slotAddress = booking.slotId?.address || booking.address || "Parking Slot";
  const slotName = booking.slotId?.name || booking.name || slotAddress;
  const price = booking.slotId?.pricePerHour || booking.pricePerHour || 0;

  return (
    <motion.article
      className={`rounded-2xl border bg-white p-5 shadow-sm ${highlighted ? "border-green-300" : "border-gray-100"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, boxShadow: "0 14px 28px rgba(0,0,0,0.08)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-gray-800">{slotName}</h4>
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} /> {slotAddress}
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} />
            {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Wallet size={14} /> ₹{price}/hour
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass[status] || "bg-gray-100 text-gray-600"}`}>
          {status}
        </span>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </motion.article>
  );
}

export default BookingCard;
