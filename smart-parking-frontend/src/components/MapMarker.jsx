import { Marker, Popup } from "react-leaflet";

function MapMarker({ slot, position, icon, onHover, onBookNow }) {
  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        mouseover: () => onHover(slot._id),
        mouseout: () => onHover(""),
      }}
    >
      <Popup>
        <div className="space-y-1">
          <h4 className="font-semibold text-gray-800">{slot.name || slot.address || "Parking Slot"}</h4>
          <p className="text-sm text-gray-600">📍 {slot.address || "Address unavailable"}</p>
          <p className="text-sm text-gray-600">📏 {typeof slot.distanceKm === "number" ? `${slot.distanceKm} km away` : "Nearby"}</p>
          <p className="text-sm text-gray-600">💰 ₹{slot.pricePerHour || 0}/hour</p>
          <button
            className="mt-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
            type="button"
            onClick={() => onBookNow(slot)}
          >
            Reserve
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

export default MapMarker;
