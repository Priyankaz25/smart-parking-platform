const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "ParkNest/1.0 (https://github.com/smart-parking; local-dev)",
};

/**
 * @param {string} locationText
 * @returns {Promise<{ lat: number; lng: number; displayName?: string }>}
 */
export async function geocodeLocationText(locationText) {
  const trimmed = (locationText || "").trim();
  if (!trimmed) {
    throw new Error("Enter a place name to search.");
  }

  const query = encodeURIComponent(trimmed);
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
    { headers: NOMINATIM_HEADERS }
  );

  if (!response.ok) {
    throw new Error("Location lookup failed. Please try again in a moment.");
  }

  const data = await response.json();
  if (!data?.length) {
    throw new Error("Location not found. Try a city, neighborhood, or landmark.");
  }

  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("Could not read coordinates for that place.");
  }

  return {
    lat,
    lng,
    displayName: data[0].display_name,
  };
}
