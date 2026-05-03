import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BookingCard from "../components/BookingCard";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import {
  blockOwnerListingWindow,
  createOwnerListing,
  deleteOwnerListing,
  decideOwnerBooking,
  getOwnerBookings,
  getOwnerListings,
  updateOwnerListing,
} from "../services/api";
import { getSession } from "../services/session";

function OwnerDashboard() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState("");
  const [form, setForm] = useState({
    address: "",
    longitude: "",
    latitude: "",
    vehicleType: "4W",
    pricePerHour: "",
    totalSlots: "",
    availabilityWindow: "",
    rules: "",
    photos: "",
    approvalMode: "auto-approve",
    blockWindow: "",
  });

  const session = getSession();

  const loadData = useCallback(async () => {
    if (!session?.user?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [slotData, bookingData] = await Promise.all([
        getOwnerListings(session.user._id),
        getOwnerBookings(session.user._id),
      ]);
      setSlots(slotData || []);
      setBookings(bookingData || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [session?.user?._id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createOwnerListing(session.user._id, {
        address: form.address,
        location: {
          type: "Point",
          coordinates: [Number(form.longitude || 0), Number(form.latitude || 0)],
        },
        vehicleType: form.vehicleType,
        pricePerHour: Number(form.pricePerHour || 0),
        totalSlots: Number(form.totalSlots || 1),
        availabilityWindow: form.availabilityWindow,
        rules: form.rules,
        photos: form.photos.split(",").map((item) => item.trim()).filter(Boolean),
        approvalMode: form.approvalMode,
        blockedWindows: form.blockWindow ? [form.blockWindow] : [],
      });
      showToast("Parking listing added", "success");
      setForm({
        address: "",
        longitude: "",
        latitude: "",
        vehicleType: "4W",
        pricePerHour: "",
        totalSlots: "",
        availabilityWindow: "",
        rules: "",
        photos: "",
        approvalMode: "auto-approve",
        blockWindow: "",
      });
      await loadData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const earnings = bookings.reduce((sum, booking) => {
      const price = booking.slotId?.pricePerHour || 0;
      return sum + price;
    }, 0);
    return [
      { label: "Total Listings", value: slots.length },
      { label: "Active Bookings", value: bookings.filter((b) => b.status === "confirmed").length },
      { label: "Earnings Summary", value: `₹${earnings}` },
      { label: "Recent Bookings", value: bookings.length },
    ];
  }, [slots, bookings]);

  const onDecision = async (bookingId, decision) => {
    try {
      await decideOwnerBooking(session.user._id, bookingId, decision);
      showToast(`Booking ${decision}d`, "success");
      await loadData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onBlockWindow = async (slotId) => {
    if (!form.blockWindow) {
      showToast("Enter a block dates/times value first", "error");
      return;
    }
    try {
      await blockOwnerListingWindow(session.user._id, slotId, form.blockWindow);
      showToast("Blocked window added to listing", "success");
      await loadData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onDeleteListing = async (slotId) => {
    try {
      await deleteOwnerListing(session.user._id, slotId);
      showToast("Listing deleted", "success");
      await loadData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onEditListing = async (slot) => {
    setEditingSlotId(slot._id);
    try {
      await updateOwnerListing(session.user._id, slot._id, {
        pricePerHour: Number(form.pricePerHour || slot.pricePerHour || 0),
        totalSlots: Number(form.totalSlots || slot.totalSlots || 1),
      });
      showToast("Listing updated", "success");
      await loadData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setEditingSlotId("");
    }
  };

  if (!session?.user?.name) {
    return <div className="empty-state page-wrap">Please login as owner to view owner dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Owner Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage listings, bookings, and earnings in one place.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <DashboardCard key={item.label} label={item.label} value={item.value} index={index} />
        ))}
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800">Add Parking Listing</h3>
        <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmit}>
          <input
            placeholder="Location / Address"
            value={form.address}
            onChange={(event) => onChange("address", event.target.value)}
            required
          />
          <input
            placeholder="Latitude"
            value={form.latitude}
            onChange={(event) => onChange("latitude", event.target.value)}
            required
          />
          <input
            placeholder="Longitude"
            value={form.longitude}
            onChange={(event) => onChange("longitude", event.target.value)}
            required
          />
          <input
            placeholder="Number of slots"
            value={form.totalSlots}
            onChange={(event) => onChange("totalSlots", event.target.value)}
          />
          <input
            placeholder="Price per hour"
            value={form.pricePerHour}
            onChange={(event) => onChange("pricePerHour", event.target.value)}
            required
          />
          <input
            placeholder="Availability schedule"
            value={form.availabilityWindow}
            onChange={(event) => onChange("availabilityWindow", event.target.value)}
          />
          <input
            placeholder="Rules"
            value={form.rules}
            onChange={(event) => onChange("rules", event.target.value)}
          />
          <input
            placeholder="Photo URLs (comma separated)"
            value={form.photos}
            onChange={(event) => onChange("photos", event.target.value)}
          />
          <input
            placeholder="Block dates/times (optional)"
            value={form.blockWindow}
            onChange={(event) => onChange("blockWindow", event.target.value)}
          />
          <select value={form.vehicleType} onChange={(event) => onChange("vehicleType", event.target.value)}>
            <option value="4W">4W</option>
          </select>
          <select value={form.approvalMode} onChange={(event) => onChange("approvalMode", event.target.value)}>
            <option value="auto-approve">Auto-approve</option>
            <option value="manual-approve">Manual approval</option>
          </select>
          <button type="submit" className="rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 md:col-span-2" disabled={saving}>
            {saving ? "Saving..." : "Add Listing"}
          </button>
        </form>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading owner data..." />
      ) : (
        <>
          <section className="panel">
            <h3>My Listings</h3>
            {!slots.length && <p className="empty-state">No owner listings yet.</p>}
            {slots.map((slot) => (
              <div key={slot._id} className="booking-row bg-white">
                <div className="space-y-1">
                  <h4 className="font-semibold">{slot.name || slot.address}</h4>
                  <p className="text-sm text-gray-600">{slot.address}</p>
                  <p className="text-sm text-gray-600">{slot.vehicleType} | ₹{slot.pricePerHour}/hour</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => onEditListing(slot)} type="button" disabled={editingSlotId === slot._id}>
                    {editingSlotId === slot._id ? "Saving..." : "Edit"}
                  </button>
                  <button className="btn btn-outline" onClick={() => onDeleteListing(slot._id)} type="button">
                    Delete
                  </button>
                  <button className="btn btn-outline" onClick={() => onBlockWindow(slot._id)} type="button">
                    Block
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3>Recent Bookings</h3>
            {!bookings.length && <p className="empty-state">No bookings available yet.</p>}
            {bookings.slice(0, 8).map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                actions={
                  booking.status === "pending" ? (
                    <>
                      <button type="button" className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-700" onClick={() => onDecision(booking._id, "approve")}>
                        Approve
                      </button>
                      <button type="button" className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700" onClick={() => onDecision(booking._id, "reject")}>
                        Reject
                      </button>
                    </>
                  ) : null
                }
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default OwnerDashboard;
