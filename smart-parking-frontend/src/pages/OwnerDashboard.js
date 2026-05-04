import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BookingCard from "../components/BookingCard";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
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
import { parseAvailabilityWindow } from "../utils/availability";
import { geocodeLocationText } from "../utils/geocode";

function parseBlockedWindowsJson(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function OwnerDashboard() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState("");
  const [form, setForm] = useState({
    name: "",
    address: "",
    longitude: "",
    latitude: "",
    vehicleType: "4W",
    pricePerHour: "",
    totalSlots: "",
    availableSlots: "",
    availabilityWindow: "06:00 - 23:00",
    rules: "",
    photos: "",
    approvalMode: "auto-approve",
    blockWindow: "",
  });
  const [listingEdits, setListingEdits] = useState({});

  const session = getSession();

  useEffect(() => {
    const next = {};
    slots.forEach((s) => {
      next[s._id] = {
        pricePerHour: String(s.pricePerHour ?? ""),
        totalSlots: String(s.totalSlots ?? ""),
        availableSlots: String(s.availableSlots ?? s.totalSlots ?? ""),
      };
    });
    setListingEdits(next);
  }, [slots]);

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

  const onGeocodeAddress = async () => {
    console.log("Geocode button clicked");
    const q = form.address.trim() || form.name.trim();
    if (!q) {
      showToast("Enter an address or listing name first", "error");
      return;
    }
    setGeocoding(true);
    try {
      const geo = await geocodeLocationText(q);
      setForm((current) => ({
        ...current,
        latitude: String(geo.lat),
        longitude: String(geo.lng),
      }));
      showToast("Location coordinates updated from map data", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setGeocoding(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.name.trim()) {
      showToast("Listing name is required", "error");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      showToast("Set valid coordinates (use Look up coordinates from address)", "error");
      return;
    }

    setSaving(true);
    try {
      const total = Math.max(1, Number(form.totalSlots || 1));
      const available = Math.min(
        total,
        Math.max(0, Number(form.availableSlots !== "" ? form.availableSlots : total))
      );
      const blocked = parseBlockedWindowsJson(form.blockWindow);

      await createOwnerListing(session.user._id, {
        name: form.name.trim(),
        address: form.address.trim(),
        location: {
          type: "Point",
          coordinates: [lng, lat],
        },
        vehicleType: form.vehicleType,
        pricePerHour: Number(form.pricePerHour || 0),
        totalSlots: total,
        availableSlots: available,
        availability: parseAvailabilityWindow(form.availabilityWindow),
        rules: form.rules,
        photos: form.photos.split(",").map((item) => item.trim()).filter(Boolean),
        approvalMode: form.approvalMode,
        ...(blocked.length ? { blockedWindows: blocked } : {}),
      });
      showToast("Parking listing added", "success");
      setForm({
        name: "",
        address: "",
        longitude: "",
        latitude: "",
        vehicleType: "4W",
        pricePerHour: "",
        totalSlots: "",
        availableSlots: "",
        availabilityWindow: "06:00 - 23:00",
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

  const totalSlotCapacity = useMemo(
    () => slots.reduce((sum, s) => sum + (Number(s.totalSlots) || 0), 0),
    [slots]
  );

  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "resolved"),
    [bookings]
  );

  const estimatedEarnings = useMemo(() => {
    return confirmedBookings.reduce((sum, booking) => {
      const start = new Date(booking.startTime).getTime();
      const end = new Date(booking.endTime).getTime();
      const hours = Math.max(0.25, (end - start) / (1000 * 60 * 60));
      const rate = booking.slotId?.pricePerHour || 0;
      return sum + hours * rate;
    }, 0);
  }, [confirmedBookings]);

  const revenueByMonth = useMemo(() => {
    const map = new Map();
    confirmedBookings.forEach((b) => {
      const d = new Date(b.startTime);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const start = new Date(b.startTime).getTime();
      const end = new Date(b.endTime).getTime();
      const hours = Math.max(0.25, (end - start) / (1000 * 60 * 60));
      const rate = b.slotId?.pricePerHour || 0;
      map.set(key, (map.get(key) || 0) + hours * rate);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [confirmedBookings]);

  const bookingsByMonth = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const d = new Date(b.startTime);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [bookings]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...revenueByMonth.map(([, v]) => v)),
    [revenueByMonth]
  );
  const maxBookings = useMemo(
    () => Math.max(1, ...bookingsByMonth.map(([, v]) => v)),
    [bookingsByMonth]
  );

  const stats = useMemo(
    () => [
      { label: "Total listings", value: slots.length, hint: `${totalSlotCapacity} total spaces` },
      {
        label: "Active bookings",
        value: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length,
        hint: "Confirmed + awaiting action",
      },
      {
        label: "Estimated revenue",
        value: `₹${Math.round(estimatedEarnings).toLocaleString("en-IN")}`,
        hint: "From confirmed bookings × duration",
      },
      { label: "All bookings", value: bookings.length, hint: "Lifetime on your listings" },
    ],
    [slots.length, totalSlotCapacity, bookings, estimatedEarnings]
  );

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
    const blocked = parseBlockedWindowsJson(form.blockWindow);
    if (!blocked.length) {
      showToast('Add block windows as JSON, e.g. [{"from":"2026-01-01T10:00:00.000Z","to":"2026-01-01T12:00:00.000Z"}]', "error");
      return;
    }
    try {
      await blockOwnerListingWindow(session.user._id, slotId, blocked[0]);
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
    const edit = listingEdits[slot._id] || {};
    setEditingSlotId(slot._id);
    try {
      const total = Math.max(1, Number(edit.totalSlots || slot.totalSlots || 1));
      const avail = Math.min(
        total,
        Math.max(0, Number(edit.availableSlots !== "" ? edit.availableSlots : slot.availableSlots ?? total))
      );
      await updateOwnerListing(session.user._id, slot._id, {
        pricePerHour: Number(edit.pricePerHour || slot.pricePerHour || 0),
        totalSlots: total,
        availableSlots: avail,
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
    return (
      <div className="empty-state page-wrap rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Please login as an owner to open this dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Owner workspace</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Operations overview</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
        Monitor your parking listings, bookings, and earnings in one centralized dashboard.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <DashboardCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
            index={index}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">Revenue (monthly)</h3>
          <p className="text-sm text-slate-500">Approximate, from hourly rate × booking length</p>
          <div className="mt-6 space-y-4">
            {revenueByMonth.length ? (
              revenueByMonth.map(([month, amount]) => (
                <div key={month}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{month}</span>
                    <span className="text-slate-600">₹{Math.round(amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="chart-bar-track mt-1.5">
                    <div className="chart-bar-fill" style={{ width: `${(amount / maxRevenue) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Revenue charts populate as guests complete stays.</p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">Booking volume</h3>
          <p className="text-sm text-slate-500">Starts per calendar month</p>
          <div className="mt-6 space-y-4">
            {bookingsByMonth.length ? (
              bookingsByMonth.map(([month, count]) => (
                <div key={month}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{month}</span>
                    <span className="text-slate-600">{count} bookings</span>
                  </div>
                  <div className="chart-bar-track mt-1.5">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${(count / maxBookings) * 100}%`,
                        background: "linear-gradient(90deg, #6366f1, #4f46e5)",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No booking history yet.</p>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">New listing</h3>
            <p className="text-sm text-slate-500">
              Coordinates are saved as GeoJSON for map search. Use the lookup button after entering an address.
            </p>
          </div>
        </div>
        <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Listing name
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="e.g. Metro parking — Block A"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Street address
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Full address as drivers would see it"
              value={form.address}
              onChange={(e) => onChange("address", e.target.value)}
              required
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={onGeocodeAddress}
              disabled={geocoding}
            >
              {geocoding ? "Looking up…" : "Look up coordinates from address"}
            </button>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Latitude
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              inputMode="decimal"
              value={form.latitude}
              onChange={(e) => onChange("latitude", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Longitude
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              inputMode="decimal"
              value={form.longitude}
              onChange={(e) => onChange("longitude", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Spaces (total)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              type="number"
              min={1}
              value={form.totalSlots}
              onChange={(e) => onChange("totalSlots", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Available now
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              type="number"
              min={0}
              placeholder="Defaults to total"
              value={form.availableSlots}
              onChange={(e) => onChange("availableSlots", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Price / hour (₹)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              type="number"
              min={0}
              value={form.pricePerHour}
              onChange={(e) => onChange("pricePerHour", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Daily hours (text)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="06:00 - 23:00"
              value={form.availabilityWindow}
              onChange={(e) => onChange("availabilityWindow", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Rules
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={form.rules}
              onChange={(e) => onChange("rules", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Photo URLs (comma-separated)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={form.photos}
              onChange={(e) => onChange("photos", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 md:col-span-2">
            Block window (optional)
            <input
              className="rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder='[{"from":"ISO date","to":"ISO date"}]'
              value={form.blockWindow}
              onChange={(e) => onChange("blockWindow", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Vehicle class
            <select
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={form.vehicleType}
              onChange={(e) => onChange("vehicleType", e.target.value)}
            >
              <option value="4W">4W</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Booking approval
            <select
              className="rounded-xl border border-slate-200 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={form.approvalMode}
              onChange={(e) => onChange("approvalMode", e.target.value)}
            >
              <option value="auto-approve">Auto-approve</option>
              <option value="manual-approve">Manual approval</option>
            </select>
          </label>
          <button
            type="submit"
            className="md:col-span-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Publishing…" : "Publish listing"}
          </button>
        </form>
      </motion.section>

      {loading ? (
        <LoadingSpinner label="Syncing listings and bookings…" />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Your listings</h3>
            {!slots.length ? (
              <p className="mt-4 text-sm text-slate-500">No listings yet—publish your first bay above.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {slots.map((slot) => {
                  const row = listingEdits[slot._id] || {
                    pricePerHour: String(slot.pricePerHour ?? ""),
                    totalSlots: String(slot.totalSlots ?? ""),
                    availableSlots: String(slot.availableSlots ?? slot.totalSlots ?? ""),
                  };
                  return (
                  <div
                    key={slot._id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 lg:flex-row lg:items-end lg:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{slot.name || slot.address}</h4>
                          <StatusBadge status={slot.listingStatus} />
                        </div>
                        <p className="text-sm text-slate-600">{slot.address}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <label className="text-xs font-medium text-slate-600">
                          ₹ / hour
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            value={row.pricePerHour}
                            onChange={(e) =>
                              setListingEdits((cur) => ({
                                ...cur,
                                [slot._id]: { ...row, pricePerHour: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Total spaces
                          <input
                            type="number"
                            min={1}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            value={row.totalSlots}
                            onChange={(e) =>
                              setListingEdits((cur) => ({
                                ...cur,
                                [slot._id]: { ...row, totalSlots: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                          Available
                          <input
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                            value={row.availableSlots}
                            onChange={(e) =>
                              setListingEdits((cur) => ({
                                ...cur,
                                [slot._id]: { ...row, availableSlots: e.target.value },
                              }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => onEditListing(slot)}
                        type="button"
                        disabled={editingSlotId === slot._id}
                      >
                        {editingSlotId === slot._id ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => onBlockWindow(slot._id)}
                        type="button"
                      >
                        Add block
                      </button>
                      <button
                        className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
                        onClick={() => onDeleteListing(slot._id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Bookings inbox</h3>
            {!bookings.length ? (
              <p className="mt-4 text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {bookings.slice(0, 12).map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    actions={
                      booking.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                            onClick={() => onDecision(booking._id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
                            onClick={() => onDecision(booking._id, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default OwnerDashboard;
