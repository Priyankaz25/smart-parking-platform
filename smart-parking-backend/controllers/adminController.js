const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const User = require("../models/User");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const filteredUsers = users.filter(
      (user) => String(user._id) !== String(req.auth.id)
    );

    return res.json(filteredUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ error: "Status must be active or blocked" });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.verifyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;
    if (!["pending", "verified", "rejected"].includes(verificationStatus)) {
      return res
        .status(400)
        .json({ error: "verificationStatus must be pending, verified, or rejected" });
    }

    const owner = await User.findByIdAndUpdate(
      id,
      { ownerVerificationStatus: verificationStatus },
      { new: true }
    ).select("-password");
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }
    return res.json(owner);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getListingsForVerification = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const listings = await ParkingSlot.find({ listingStatus: status }).populate(
      "ownerId",
      "name email ownerVerificationStatus"
    );
    return res.json(listings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verifiedBy } = req.body;
    if (!["verified", "approved", "rejected", "pending"].includes(status)) {
      return res
        .status(400)
        .json({ error: "status must be approved, verified, rejected, or pending" });
    }

    const listingStatus = status === "verified" ? "approved" : status;

    const listing = await ParkingSlot.findByIdAndUpdate(
      id,
      { listingStatus, verifiedBy: verifiedBy || null },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    return res.json(listing);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find().populate("slotId");
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDisputes = async (_req, res) => {
  try {
    const disputes = await Booking.find({
      $or: [{ status: "disputed" }, { disputeStatus: { $in: ["open", "resolved"] } }],
    }).populate("slotId");
    return res.json(disputes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { disputeStatus, note } = req.body;
    if (!["resolved", "rejected"].includes(disputeStatus)) {
      return res.status(400).json({ error: "disputeStatus must be resolved or rejected" });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        disputeStatus,
        disputeResolutionNote: note || "",
        status: disputeStatus === "resolved" ? "resolved" : "confirmed",
      },
      { new: true }
    ).populate("slotId");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
