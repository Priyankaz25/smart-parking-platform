import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

const searchPinIcon = L.divIcon({
  className: "search-pin-marker",
  html: "<span aria-hidden=\"true\">📍</span>",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapController({ center, zoom, recenterVersion }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(center) || center.length < 2) return;
    const [lat, lng] = center;
    if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }
    map.setView([lat, lng], zoom, { animate: true });
  }, [map, center, zoom, recenterVersion]);

  return null;
}

function SearchLocationMarker({ position, visible }) {
  if (!visible || !Array.isArray(position) || position.length < 2) return null;
  const [lat, lng] = position;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return <Marker position={[lat, lng]} icon={searchPinIcon} />;
}

function MapView({
  center,
  zoom = 5,
  slots = [],
  selectedSlotId,
  onSlotHover,
  onBookNow,
  showSearchCenter = false,
  mapRecenterVersion = 0,
  mapClassName = "",
}) {
  const usedCoordinates = new Map();

  const withOffset = (lat, lng) => {
    const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const count = usedCoordinates.get(key) || 0;
    usedCoordinates.set(key, count + 1);
    if (count === 0) return [lat, lng];
    const shift = 0.00018 * count;
    return [lat + shift, lng - shift];
  };

  const mapHeightClass = mapClassName.trim() || "leaflet-map";

  return (
    <section className="panel map-panel">
      <MapContainer center={center} zoom={zoom} className={mapHeightClass} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} recenterVersion={mapRecenterVersion} />
        <SearchLocationMarker position={center} visible={showSearchCenter} />
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
