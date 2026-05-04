require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const slotRoutes = require("./routes/slotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// DB connection
connectDB();

// Middleware
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// Routes
app.use("/api/slots", slotRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);

// ✅ FIX: Render requires dynamic PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});