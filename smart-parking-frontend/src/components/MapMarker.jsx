import { Marker, Popup } from "react-leaflet";

function availabilityLabel(slot) {
  if (slot.isAvailable === false) return "Unavailable";
  const avail = slot.availableSlots;
  const total = slot.totalSlots;
  if (typeof avail === "number" && typeof total === "number") {
    return avail > 0 ? `${avail} / ${total} open` : "Full";
  }
  if (typeof avail === "number") return avail > 0 ? `${avail} spaces` : "Full";
  return "Open";
}

function MapMarker({ slot, position, icon, onHover, onBookNow }) {
  const status = availabilityLabel(slot);
  const listing = slot.listingStatus || "approved";

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        mouseover: () => onHover?.(slot._id),
        mouseout: () => onHover?.(""),
        click: () => onHover?.(slot._id),
      }}
    >
      <Popup>
        <div className="map-popup space-y-1 min-w-[200px]">
          <h4 className="font-semibold text-gray-900 m-0">{slot.name || slot.address || "Parking"}</h4>
          <p className="text-xs text-gray-500 m-0">{slot.address || "Address unavailable"}</p>
          <p className="text-sm text-gray-700 m-0">
            <strong>₹{slot.pricePerHour ?? 0}</strong>
            <span className="text-gray-500"> / hour</span>
          </p>
          <p className="text-sm text-gray-700 m-0">
            <strong>Spaces:</strong> {slot.availableSlots ?? "—"}
            {typeof slot.totalSlots === "number" ? ` / ${slot.totalSlots}` : ""}
          </p>
          <p className="text-sm m-0">
            <span className="font-medium text-gray-800">{status}</span>
            <span className="text-gray-400"> · </span>
            <span className="text-xs uppercase tracking-wide text-gray-500">{listing}</span>
          </p>
          {typeof slot.distanceKm === "number" ? (
            <p className="text-xs text-gray-500 m-0">{slot.distanceKm} km from search</p>
          ) : null}
          <button
            className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            type="button"
            onClick={() => onBookNow?.(slot)}
          >
            Reserve
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
