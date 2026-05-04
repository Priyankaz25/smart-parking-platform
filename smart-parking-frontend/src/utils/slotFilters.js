/** Approved (or legacy verified) listings that are bookable and 4W. */
export function slotMatchesListing(slot) {
  const slotVehicle = (slot.vehicleType || "").toLowerCase();
  const matchesVehicle = slotVehicle === "4w" || slotVehicle.includes("4");
  const listing = (slot.listingStatus || "").toLowerCase();
  const matchesListing = listing === "approved" || listing === "verified";
  const matchesAvailability = matchesListing && slot.isAvailable === true;
  return matchesVehicle && matchesAvailability;
}
