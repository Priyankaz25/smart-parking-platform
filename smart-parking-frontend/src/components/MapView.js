import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MapMarker from "./MapMarker";

const markerIcon = L.divIcon({
  className: "custom-marker",
  html: "<span>P</span>",
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

const activeMarkerIcon = L.divIcon({
  className: "custom-marker active",
  html: "<span>P</span>",
  iconSize: [52, 52],
  iconAnchor: [26, 52],
});

function RecenterMap({ center }) {
  const map = useMap();
  map.setView(center, 13, { animate: true });
  return null;
}

function MapView({ center, slots, selectedSlotId, onSlotHover, onBookNow }) {
  const usedCoordinates = new Map();

  const withOffset = (lat, lng) => {
    const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const count = usedCoordinates.get(key) || 0;
    usedCoordinates.set(key, count + 1);
    if (count === 0) return [lat, lng];
    const shift = 0.00018 * count;
    return [lat + shift, lng - shift];
  };

  return (
    <section className="panel map-panel">
      <MapContainer center={center} zoom={5} className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        {slots.map((slot) => {
          const coordinates = slot.location?.coordinates || [];
          const lng = coordinates[0];
          const lat = coordinates[1];
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          const shiftedPosition = withOffset(lat, lng);

          return (
            <MapMarker
              key={slot._id}
              slot={slot}
              position={shiftedPosition}
              icon={selectedSlotId === slot._id ? activeMarkerIcon : markerIcon}
              onHover={onSlotHover}
              onBookNow={onBookNow}
            />
          );
        })}
      </MapContainer>
    </section>
  );
}

export default MapView;
