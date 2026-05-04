import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BookingCard from "../components/BookingCard";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import MapView from "../components/MapView";
import { useToast } from "../components/Toast";
import { cancelBooking, getBookings, getNearbySlots, raiseBookingDispute } from "../services/api";
import { getSession } from "../services/session";
import { slotMatchesListing } from "../utils/slotFilters";

const INDIA_CENTER = [22.9734, 78.6569];

function UserDashboard() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER);
  const [nearbySlots, setNearbySlots] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapVersion, setMapVersion] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const session = getSession();

  const loadBookings = useCallback(async () => {
    if (!session?.user?.name) {
      setBookings([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getBookings({ userName: session.user.name });
      setBookings(data || []);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.name, showToast]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    let cancelled = false;
    async function loadMap() {
      setMapLoading(true);
      let lat = INDIA_CENTER[0];
      let lng = INDIA_CENTER[1];
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { maximumAge: 120_000, timeout: 9000 }
          );
        });
      }
      if (cancelled) return;
      setMapCenter([lat, lng]);
      setMapVersion((v) => v + 1);
      try {
        const data = await getNearbySlots({ lat, lng, radiusMeters: 12_000 });
        if (!cancelled) setNearbySlots((data || []).filter(slotMatchesListing));
      } catch {
        if (!cancelled) setNearbySlots([]);
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }
    loadMap();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const active = bookings.filter((item) => item.status === "confirmed").length;
    const upcoming = bookings.filter((item) => new Date(item.startTime) > new Date()).length;
    const cancelled = bookings.filter((item) => item.status === "cancelled").length;
    return [
      { label: "Upcoming", value: upcoming, hint: "Starts in the future" },
      { label: "Active holds", value: active, hint: "Confirmed reservations" },
      { label: "Lifetime trips", value: bookings.length, hint: "Including completed" },
      { label: "Cancelled", value: cancelled, hint: "Released slots" },
    ];
  }, [bookings]);

  const upcomingBookings = bookings.filter((item) => new Date(item.startTime) > new Date());
  const historyBookings = bookings.filter((item) => new Date(item.startTime) <= new Date());
  const activeBooking =
    upcomingBookings.find((item) => item.status === "confirmed") || upcomingBookings[0];
  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 4),
    [bookings]
  );

  const onCancel = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await cancelBooking(bookingId);
      showToast("Booking cancelled", "success");
      await loadBookings();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyId("");
    }
  };

  const onRaiseDispute = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await raiseBookingDispute(bookingId, "Issue reported by driver");
      showToast("Dispute raised", "success");
      await loadBookings();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusyId("");
    }
  };

  const onBookFromMap = useCallback(() => {
    showToast("Open Find parking on the home page to choose times and book.", "info");
  }, [showToast]);

  if (!session?.user?.name) {
    return (
      <div className="empty-state page-wrap rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Please login to view your booking dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Driver hub</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Your parking</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Live map context, upcoming activity, and history—organized like a consumer travel app.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Find parking
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <DashboardCard key={item.label} label={item.label} value={item.value} hint={item.hint} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Nearby suggestions</h3>
              <p className="text-sm text-slate-500">Based on your browser location when available</p>
            </div>
          </div>
          {mapLoading ? (
            <div className="space-y-2">
              <div className="h-[280px] rounded-xl bg-slate-100 animate-pulse" />
              <p className="text-center text-sm text-slate-500">Loading map…</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <MapView
                center={mapCenter}
                zoom={13}
                slots={nearbySlots}
                showSearchCenter={false}
                mapRecenterVersion={mapVersion}
                selectedSlotId={selectedSlotId}
                onSlotHover={setSelectedSlotId}
                onBookNow={onBookFromMap}
                mapClassName="leaflet-map leaflet-map--compact"
              />
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
          {!recentBookings.length ? (
            <p className="mt-4 text-sm text-slate-500">No trips yet—your latest bookings will appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {recentBookings.map((b) => (
                <li key={b._id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <p className="font-medium text-slate-900">{b.slotId?.name || b.slotId?.address || "Parking"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(b.startTime).toLocaleString()} · {b.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching your bookings…" />
      ) : (
        <motion.div layout className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Active booking</h3>
            {!activeBooking ? (
              <p className="mt-3 text-sm text-slate-500">No active booking right now.</p>
            ) : (
              <div className="mt-4">
                <BookingCard booking={activeBooking} highlighted />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming bookings</h3>
            {!upcomingBookings.length ? (
              <p className="mt-3 text-sm text-slate-500">No upcoming bookings.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    actions={
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => onCancel(booking._id)}
                          disabled={busyId === booking._id}
                        >
                          {busyId === booking._id ? "Cancelling…" : "Cancel"}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                          onClick={() => onRaiseDispute(booking._id)}
                          disabled={busyId === booking._id || booking.disputeStatus === "open"}
                        >
                          {booking.disputeStatus === "open" ? "Dispute open" : "Raise dispute"}
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">History</h3>
            {!historyBookings.length ? (
              <p className="mt-3 text-sm text-slate-500">No past bookings yet.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {historyBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </section>
        </motion.div>
      )}
    </div>
  );
}

export default UserDashboard;
