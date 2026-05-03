import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import {
  getAdminBookings,
  getAdminDisputes,
  getAdminListingsForVerification,
  getAdminUsers,
  resolveAdminDispute,
  updateAdminUserStatus,
  verifyAdminListing,
  verifyAdminOwner,
} from "../services/api";
import { getSession } from "../services/session";

function AdminDashboard() {
  const { showToast } = useToast();
  const session = getSession();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [slotData, bookingData, userData, disputeData] = await Promise.all([
          getAdminListingsForVerification("pending"),
          getAdminBookings(),
          getAdminUsers(),
          getAdminDisputes(),
        ]);
        setSlots(slotData || []);
        setBookings(bookingData || []);
        setUsers(userData || []);
        setDisputes(disputeData || []);
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const reportData = useMemo(() => {
    const confirmed = bookings.filter((item) => item.status === "confirmed").length;
    const cancelled = bookings.filter((item) => item.status === "cancelled").length;
    const pending = bookings.filter((item) => item.status === "pending").length;
    const total = confirmed + cancelled + pending || 1;
    return [
      { label: "Confirmed", value: confirmed, width: `${(confirmed / total) * 100}%` },
      { label: "Pending", value: pending, width: `${(pending / total) * 100}%` },
      { label: "Cancelled", value: cancelled, width: `${(cancelled / total) * 100}%` },
    ];
  }, [bookings]);
  const owners = useMemo(() => users.filter((user) => user.role === "owner"), [users]);
  const platformUsers = useMemo(() => users.filter((user) => user.role !== "owner"), [users]);

  const onViewDetails = (user) => {
    const details = [
      `Name: ${user.name || "N/A"}`,
      `Email: ${user.email || "N/A"}`,
      `Role: ${user.role || "N/A"}`,
      `Status: ${user.status || "active"}`,
      user.role === "owner"
        ? `Owner Verification: ${user.ownerVerificationStatus || "pending"}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    window.alert(details);
  };

  const onBlockUser = async (userId, nextStatus) => {
    try {
      await updateAdminUserStatus(userId, nextStatus);
      showToast(`User ${nextStatus}`, "success");
      setUsers((current) =>
        current.map((user) => (user._id === userId ? { ...user, status: nextStatus } : user))
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onVerifyOwner = async (ownerId, verificationStatus) => {
    try {
      await verifyAdminOwner(ownerId, verificationStatus);
      showToast(`Owner marked ${verificationStatus}`, "success");
      setUsers((current) =>
        current.map((user) =>
          user._id === ownerId ? { ...user, ownerVerificationStatus: verificationStatus } : user
        )
      );
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onVerifyListing = async (listingId, status) => {
    try {
      await verifyAdminListing(listingId, status, session?.user?._id);
      showToast(`Listing ${status}`, "success");
      setSlots((current) => current.filter((slot) => slot._id !== listingId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const onResolveDispute = async (bookingId, disputeStatus) => {
    try {
      await resolveAdminDispute(bookingId, disputeStatus, `Updated by admin ${session?.user?.name || ""}`);
      showToast(`Dispute ${disputeStatus}`, "success");
      setDisputes((current) => current.filter((dispute) => dispute._id !== bookingId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage platform users, listings, and reports.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard label="Total Users" value={users.length} index={0} />
        <DashboardCard label="Total Parking Slots" value={slots.length} index={1} />
        <DashboardCard label="Active Bookings" value={bookings.filter((b) => b.status === "confirmed").length} index={2} />
        <DashboardCard label="Reports" value={reportData.length} index={3} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading admin reports..." />
      ) : (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3>Booking Reports</h3>
            {reportData.map((item) => (
              <div key={item.label} className="report-row">
                <span>{item.label}</span>
                <div className="report-track">
                  <div className="report-fill" style={{ width: item.width }} />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3>Listings Pending Verification</h3>
            {!slots.length && <p className="empty-state">No pending listings.</p>}
            {slots.map((slot) => (
              <div key={slot._id} className="booking-row">
                <div>
                  <h4>{slot.address || "Listing"}</h4>
                  <p>Owner: {slot.ownerName || slot.ownerId?.name || "Unknown"}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => onVerifyListing(slot._id, "verified")}>
                    Verify
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => onVerifyListing(slot._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h3>User Management</h3>
              <strong>{platformUsers.length} Users</strong>
            </div>
            {!platformUsers.length && <p className="empty-state">No users available.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformUsers.map((user) => (
                <article key={user._id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                  <h4>{user.name}</h4>
                  <p>{user.email || "No email"}</p>
                  <p>Role: {user.role}</p>
                  <p>Status: {user.status || "active"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline" onClick={() => onViewDetails(user)}>
                      View Details
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onBlockUser(user._id, user.status === "blocked" ? "active" : "blocked")}
                    >
                      {user.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h3>Owner Management</h3>
              <strong>{owners.length} Owners</strong>
            </div>
            {!owners.length && <p className="empty-state">No owners available.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {owners.map((owner) => (
                <article key={owner._id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                  <h4>{owner.name}</h4>
                  <p>{owner.email || "No email"}</p>
                  <p>Role: {owner.role}</p>
                  <p>Status: {owner.status || "active"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline" onClick={() => onViewDetails(owner)}>
                      View Details
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => onVerifyOwner(owner._id, "verified")}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => onVerifyOwner(owner._id, "rejected")}>
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onBlockUser(owner._id, owner.status === "blocked" ? "active" : "blocked")}
                    >
                      {owner.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h3>Recent Bookings and Disputes</h3>
            {!bookings.length && <p className="empty-state">No booking data available.</p>}
            {bookings.slice(0, 10).map((booking) => (
              <div key={booking._id} className="booking-row">
                <div>
                  <h4>{booking.slotId?.address || "Parking Slot"}</h4>
                  <p>User: {booking.userName}</p>
                </div>
                <span className={`status status-${booking.status || "confirmed"}`}>
                  {booking.status || "confirmed"}
                </span>
              </div>
            ))}
            {disputes.map((dispute) => (
              <div key={dispute._id} className="booking-row">
                <div>
                  <h4>Dispute: {dispute.slotId?.address || "Slot"}</h4>
                  <p>{dispute.disputeReason || "No reason provided"}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => onResolveDispute(dispute._id, "resolved")}>
                    Resolve
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => onResolveDispute(dispute._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
