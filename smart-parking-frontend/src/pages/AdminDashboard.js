import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardCard from "../components/DashboardCard";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";
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

const PAGE_SIZE = 6;

function useClientTable(rows, searchQuery) {
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      JSON.stringify(row)
        .toLowerCase()
        .includes(q)
    );
  }, [rows, searchQuery]);

  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [searchQuery, rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return { filtered, page, setPage, pageCount, pageRows };
}

function AdminDashboard() {
  const { showToast } = useToast();
  const session = getSession();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");

  const loadData = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const userTable = useClientTable(platformUsers, userSearch);
  const ownerTable = useClientTable(owners, ownerSearch);
  const bookingTable = useClientTable(bookings, bookingSearch);

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
    <div className="space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Admin console</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Platform control</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Users, owner verification, listing approval, and disputes share one visual language with the owner
          workspace.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Total users" value={users.length} hint="Drivers + owners" index={0} />
        <DashboardCard label="Pending listings" value={slots.length} hint="Awaiting review" index={1} />
        <DashboardCard
          label="Active bookings"
          value={bookings.filter((b) => b.status === "confirmed").length}
          hint="Confirmed pipeline"
          index={2}
        />
        <DashboardCard label="Open disputes" value={disputes.length} hint="Needs resolution" index={3} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading admin data…" />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Booking mix</h3>
            <p className="text-sm text-slate-500">Snapshot of statuses across all bookings</p>
            <div className="mt-6 space-y-3">
              {reportData.map((item) => (
                <div key={item.label} className="report-row flex items-center gap-3 text-sm">
                  <span className="w-24 font-medium text-slate-700">{item.label}</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: item.width }} />
                  </div>
                  <strong className="w-8 text-right text-slate-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Listings approval</h3>
                <p className="text-sm text-slate-500">Pending verification queue</p>
              </div>
            </div>
            {!slots.length ? (
              <p className="mt-6 text-sm text-slate-500">No listings waiting for approval.</p>
            ) : (
              <div className="mt-6 space-y-3">
                {slots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{slot.name || slot.address}</h4>
                        <StatusBadge status="pending" />
                      </div>
                      <p className="text-sm text-slate-600">{slot.address}</p>
                      <p className="text-xs text-slate-500">
                        Owner: {slot.ownerName || slot.ownerId?.name || "Unknown"} · ₹{slot.pricePerHour}/hr
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        onClick={() => onVerifyListing(slot._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                        onClick={() => onVerifyListing(slot._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Users management</h3>
                <p className="text-sm text-slate-500">Drivers and guests ({platformUsers.length})</p>
              </div>
              <input
                type="search"
                placeholder="Search users…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {!userTable.filtered.length ? (
              <p className="mt-6 text-sm text-slate-500">No users match this filter.</p>
            ) : (
              <>
                <div className="admin-table-wrap mt-4">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {userTable.pageRows.map((user) => (
                        <tr key={user._id}>
                          <td className="font-medium text-slate-900">{user.name}</td>
                          <td className="text-slate-600">{user.email || "—"}</td>
                          <td>{user.role}</td>
                          <td>
                            <StatusBadge status={user.status || "active"} />
                          </td>
                          <td className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
                                onClick={() => onViewDetails(user)}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
                                onClick={() => onBlockUser(user._id, user.status === "blocked" ? "active" : "blocked")}
                              >
                                {user.status === "blocked" ? "Unblock" : "Block"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Page {userTable.page + 1} / {userTable.pageCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={userTable.page === 0}
                      onClick={() => userTable.setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={userTable.page >= userTable.pageCount - 1}
                      onClick={() => userTable.setPage((p) => Math.min(userTable.pageCount - 1, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Owners verification</h3>
                <p className="text-sm text-slate-500">KYC-style status for hosts ({owners.length})</p>
              </div>
              <input
                type="search"
                placeholder="Search owners…"
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {!ownerTable.filtered.length ? (
              <p className="mt-6 text-sm text-slate-500">No owners match this filter.</p>
            ) : (
              <>
                <div className="admin-table-wrap mt-4">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Verification</th>
                        <th>Account</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {ownerTable.pageRows.map((owner) => (
                        <tr key={owner._id}>
                          <td className="font-medium text-slate-900">{owner.name}</td>
                          <td className="text-slate-600">{owner.email || "—"}</td>
                          <td>
                            <StatusBadge status={owner.ownerVerificationStatus || "pending"} />
                          </td>
                          <td>
                            <StatusBadge status={owner.status || "active"} />
                          </td>
                          <td className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
                                onClick={() => onViewDetails(owner)}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                onClick={() => onVerifyOwner(owner._id, "verified")}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                                onClick={() => onVerifyOwner(owner._id, "rejected")}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
                                onClick={() =>
                                  onBlockUser(owner._id, owner.status === "blocked" ? "active" : "blocked")
                                }
                              >
                                {owner.status === "blocked" ? "Unblock" : "Block"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Page {ownerTable.page + 1} / {ownerTable.pageCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={ownerTable.page === 0}
                      onClick={() => ownerTable.setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={ownerTable.page >= ownerTable.pageCount - 1}
                      onClick={() => ownerTable.setPage((p) => Math.min(ownerTable.pageCount - 1, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bookings & disputes</h3>
                <p className="text-sm text-slate-500">Operational queue</p>
              </div>
              <input
                type="search"
                placeholder="Search bookings…"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <h4 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Bookings</h4>
            {!bookingTable.filtered.length ? (
              <p className="mt-3 text-sm text-slate-500">No bookings match this filter.</p>
            ) : (
              <>
                <div className="admin-table-wrap mt-3">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Slot</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Dispute</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingTable.pageRows.map((booking) => (
                        <tr key={booking._id}>
                          <td className="font-medium text-slate-900">{booking.slotId?.name || booking.slotId?.address}</td>
                          <td className="text-slate-600">{booking.userName}</td>
                          <td>
                            <StatusBadge status={booking.status || "confirmed"} />
                          </td>
                          <td>
                            <StatusBadge status={booking.disputeStatus || "none"} label={booking.disputeStatus || "none"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Page {bookingTable.page + 1} / {bookingTable.pageCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={bookingTable.page === 0}
                      onClick={() => bookingTable.setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                      disabled={bookingTable.page >= bookingTable.pageCount - 1}
                      onClick={() => bookingTable.setPage((p) => Math.min(bookingTable.pageCount - 1, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}

            <h4 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">Disputes</h4>
            {!disputes.length ? (
              <p className="mt-3 text-sm text-slate-500">No open disputes.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {disputes.map((dispute) => (
                  <div
                    key={dispute._id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">{dispute.slotId?.address || "Slot"}</h4>
                      <p className="text-sm text-slate-600">{dispute.disputeReason || "No reason provided"}</p>
                      <div className="mt-2">
                        <StatusBadge status={dispute.disputeStatus || "open"} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        onClick={() => onResolveDispute(dispute._id, "resolved")}
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        onClick={() => onResolveDispute(dispute._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
