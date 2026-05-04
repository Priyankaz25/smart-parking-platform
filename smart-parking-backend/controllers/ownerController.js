const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const User = require("../models/User");

exports.getOwnerListings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const listings = await ParkingSlot.find({ ownerId });
    return res.json(listings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createOwnerListing = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    if (owner.role !== "owner") {
      return res.status(403).json({ error: "User is not an owner" });
    }

    const slot = new ParkingSlot({
      ...req.body,
      ownerId,
      ownerName: owner.name,
      listingStatus: owner.ownerVerificationStatus === "verified" ? "approved" : "pending",
    });
    await slot.save();
    return res.status(201).json(slot);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateOwnerListing = async (req, res) => {
  try {
    const { ownerId, slotId } = req.params;
    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: slotId, ownerId },
      req.body,
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ error: "Owner listing not found" });
    }
    return res.json(slot);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteOwnerListing = async (req, res) => {
  try {
    const { ownerId, slotId } = req.params;
    const slot = await ParkingSlot.findOneAndDelete({ _id: slotId, ownerId });
    if (!slot) {
      return res.status(404).json({ error: "Owner listing not found" });
    }
    return res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const ownerSlots = await ParkingSlot.find({ ownerId }).select("_id");
    const slotIds = ownerSlots.map((slot) => slot._id);
    const bookings = await Booking.find({ slotId: { $in: slotIds } }).populate("slotId");
    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.ownerBookingDecision = async (req, res) => {
  try {
    const { ownerId, bookingId } = req.params;
    const { decision } = req.body;

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be approve or reject" });
    }

    const booking = await Booking.findById(bookingId).populate("slotId");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!booking.slotId || String(booking.slotId.ownerId) !== String(ownerId)) {
      return res.status(403).json({ error: "Not authorized for this booking" });
    }

    booking.status = decision === "approve" ? "confirmed" : "rejected";
    booking.ownerDecisionBy = ownerId;
    await booking.save();
    return res.json(booking);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.blockOwnerListingWindow = async (req, res) => {
  try {
    const { ownerId, slotId } = req.params;
    const { blockWindow } = req.body;
    if (!blockWindow) {
      return res.status(400).json({ error: "blockWindow is required" });
    }

    const slot = await ParkingSlot.findOneAndUpdate(
      { _id: slotId, ownerId },
      { $addToSet: { blockedWindows: blockWindow } },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ error: "Owner listing not found" });
    }

    return res.json(slot);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
