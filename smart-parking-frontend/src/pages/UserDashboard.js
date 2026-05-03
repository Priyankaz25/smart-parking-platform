import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import BookingCard from "../components/BookingCard";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { cancelBooking, getBookings, raiseBookingDispute } from "../services/api";
import { getSession } from "../services/session";

function UserDashboard() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

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

  const stats = useMemo(() => {
    const active = bookings.filter((item) => item.status === "confirmed").length;
    const upcoming = bookings.filter((item) => new Date(item.startTime) > new Date()).length;
    const cancelled = bookings.filter((item) => item.status === "cancelled").length;
    return [
      { label: "Upcoming Bookings", value: upcoming },
      { label: "Active", value: active },
      { label: "Booking History", value: bookings.length },
      { label: "Cancelled", value: cancelled },
    ];
  }, [bookings]);

  const upcomingBookings = bookings.filter((item) => new Date(item.startTime) > new Date());
  const historyBookings = bookings.filter((item) => new Date(item.startTime) <= new Date());
  const activeBooking = upcomingBookings.find((item) => item.status === "confirmed") || upcomingBookings[0];

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

  if (!session?.user?.name) {
    return <div className="empty-state page-wrap">Please login to view your booking dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">User Dashboard</h2>
        <p className="text-gray-500 mt-1">Track bookings, status updates, and upcoming reservations.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <DashboardCard key={item.label} label={item.label} value={item.value} index={index} />
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching your bookings..." />
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800">Active Booking</h3>
            {!activeBooking ? (
              <p className="mt-3 text-gray-500">No active booking right now.</p>
            ) : (
              <div className="mt-4">
                <BookingCard booking={activeBooking} highlighted />
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800">Upcoming Bookings</h3>
            {!upcomingBookings.length ? (
              <p className="mt-3 text-gray-500">No upcoming bookings.</p>
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
                          className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                          onClick={() => onCancel(booking._id)}
                          disabled={busyId === booking._id}
                        >
                          {busyId === booking._id ? "Cancelling..." : "Cancel"}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-orange-100 px-3 py-2 text-sm text-orange-700 hover:bg-orange-200"
                          onClick={() => onRaiseDispute(booking._id)}
                          disabled={busyId === booking._id || booking.disputeStatus === "open"}
                        >
                          {booking.disputeStatus === "open" ? "Dispute Open" : "Raise Dispute"}
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800">Booking History</h3>
            {!historyBookings.length ? (
              <p className="mt-3 text-gray-500">No booking history yet.</p>
            ) : (
              <div className="mt-4 grid gap-4">
                {historyBookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
