const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://smart-parking-platform.onrender.com";
const SESSION_KEY = "parknest_session";

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function request(path, options = {}) {
  const sessionRaw = localStorage.getItem(SESSION_KEY);
  let token = "";
  try {
    token = sessionRaw ? JSON.parse(sessionRaw)?.token || "" : "";
  } catch (error) {
    token = "";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || "Something went wrong";
    throw new Error(message);
  }

  return payload;
}

export function signup(payload) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAvailableSlots({ startTime, endTime }) {
  const query = new URLSearchParams({
    startTime,
    endTime,
  });
  return request(`/slots/available?${query.toString()}`);
}

export function getNearbySlots({ lat, lng, radiusMeters = 500 }) {
  const query = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusMeters),
  });
  return request(`/slots/nearby?${query.toString()}`);
}

export function getAllSlots() {
  return request("/slots");
}

export function createSlot(payload) {
  return request("/slots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOwnerListings(ownerId) {
  return request(`/owners/${ownerId}/listings`);
}

export function createOwnerListing(ownerId, payload) {
  return request(`/owners/${ownerId}/listings`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOwnerListing(ownerId, slotId, payload) {
  return request(`/owners/${ownerId}/listings/${slotId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteOwnerListing(ownerId, slotId) {
  return request(`/owners/${ownerId}/listings/${slotId}`, {
    method: "DELETE",
  });
}

export function blockOwnerListingWindow(ownerId, slotId, blockWindow) {
  return request(`/owners/${ownerId}/listings/${slotId}/block-window`, {
    method: "PUT",
    body: JSON.stringify({ blockWindow }),
  });
}

export function getOwnerBookings(ownerId) {
  return request(`/owners/${ownerId}/bookings`);
}

export function decideOwnerBooking(ownerId, bookingId, decision) {
  return request(`/owners/${ownerId}/bookings/${bookingId}/decision`, {
    method: "PUT",
    body: JSON.stringify({ decision }),
  });
}

export function createBooking(payload) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBookings(params = {}) {
  const query = new URLSearchParams(params);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/bookings${suffix}`);
}

export function cancelBooking(bookingId) {
  return request(`/bookings/${bookingId}`, {
    method: "DELETE",
  });
}

export function raiseBookingDispute(bookingId, reason) {
  return request(`/bookings/${bookingId}/dispute`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
}

export function getAdminUsers() {
  return request("/admin/users");
}

export function updateAdminUserStatus(userId, status) {
  return request(`/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function verifyAdminOwner(ownerId, verificationStatus) {
  return request(`/admin/owners/${ownerId}/verify`, {
    method: "PUT",
    body: JSON.stringify({ verificationStatus }),
  });
}

export function getAdminListingsForVerification(status = "pending") {
  return request(`/admin/listings/verification?status=${encodeURIComponent(status)}`);
}

export function verifyAdminListing(listingId, status, verifiedBy) {
  return request(`/admin/listings/${listingId}/verify`, {
    method: "PUT",
    body: JSON.stringify({ status, verifiedBy }),
  });
}

export function getAdminBookings() {
  return request("/admin/bookings");
}

export function getAdminDisputes() {
  return request("/admin/disputes");
}

export function resolveAdminDispute(bookingId, disputeStatus, note) {
  return request(`/admin/disputes/${bookingId}/resolve`, {
    method: "PUT",
    body: JSON.stringify({ disputeStatus, note }),
  });
}

export { API_BASE_URL };
