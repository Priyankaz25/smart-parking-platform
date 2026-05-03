import { IndianRupee, MapPin, Ruler } from "lucide-react";

function ParkingCard({ slot, onReserve, disabled, isActive, onHover }) {

  // ✅ Format price in Indian Rupees
  const formatPrice = (price) => {
    return price
      ? price.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        })
      : "₹0";
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        isActive ? "border-green-300 shadow-lg scale-[1.01]" : "border-gray-100 hover:shadow-md"
      }`}
      onMouseEnter={onHover}
      onMouseLeave={() => onHover("")}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="parking-card-main">
          <h3 className="text-lg font-semibold text-gray-800">{slot.name || slot.address || "Parking Slot"}</h3>
          <p className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} /> {slot.address || "Address unavailable"}</p>
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Ruler size={14} /> {typeof slot.distanceKm === "number" ? `${slot.distanceKm} km away` : "N/A"}
          </p>

          <p>
            <strong>Vehicle:</strong> {slot.vehicleType || "4-wheeler"}
          </p>

          <p className="flex items-center gap-2 text-sm text-gray-700">
            <IndianRupee size={14} />
            <strong>Pricing:</strong>{" "}
            {formatPrice(slot.pricePerHour)}/hour,{" "}
            {formatPrice(slot.pricePerDay)}/day,{" "}
            {formatPrice(slot.pricePerMonth)}/month
          </p>

          <p>
            <strong>Available Slots:</strong>{" "}
            {slot.availableSlots ?? "N/A"}
          </p>

          <p>
            <strong>Availability:</strong>{" "}
            {slot.availability
              ? `${slot.availability.from} - ${slot.availability.to}`
              : "Available now"}
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-60"
          onClick={onReserve}
          disabled={disabled}
        >
          {disabled ? "Booking..." : "Reserve Slot"}
        </button>
      </div>
    </article>
  );
}

export default ParkingCard;