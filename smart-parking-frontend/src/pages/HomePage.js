import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AuthRequiredModal from "../components/AuthRequiredModal";
import FeaturesSection from "../components/FeaturesSection";
import HeroSection from "../components/HeroSection";
import LoadingSpinner from "../components/LoadingSpinner";
import MapView from "../components/MapView";
import ParkingCard from "../components/ParkingCard";
import PaymentModal from "../components/PaymentModal";
import SearchForm from "../components/SearchForm";
import { useToast } from "../components/Toast";
import { createBooking, getNearbySlots } from "../services/api";
import { getSession } from "../services/session";
import { composeDateTime, isObjectEmpty, validateSearchForm } from "../utils/validation";

const INDIA_CENTER = [22.9734, 78.6569];

function HomePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Hourly");
  const [searchForm, setSearchForm] = useState({
    location: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [errors, setErrors] = useState({});
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState("");
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredSlots = useMemo(
    () =>
      slots.filter((slot) => {
        const slotVehicle = (slot.vehicleType || "").toLowerCase();
        const matchesVehicle = slotVehicle === "4w" || slotVehicle.includes("4");
        const matchesAvailability = slot.listingStatus === "approved" && slot.isAvailable === true;
        return matchesVehicle && matchesAvailability;
      }),
    [slots]
  );

  const onFilterChange = (key, value) => {
    setSearchForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const geocodeLocation = useCallback(async (locationText) => {
    const query = encodeURIComponent(locationText);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`
    );
    const data = await response.json();
    if (!data?.length) {
      throw new Error("Location not found. Try a city or area name.");
    }
    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);
    return [lat, lon];
  }, []);

  const onSearch = useCallback(async () => {
    const nextErrors = validateSearchForm(searchForm);
    setErrors(nextErrors);
    if (!isObjectEmpty(nextErrors)) {
      showToast("Please fix search form validation errors", "error");
      return;
    }

    setLoading(true);
    setSlots([]);
    setSelectedSlotId("");
    try {
      const center = await geocodeLocation(searchForm.location);
      setMapCenter(center);
      const data = await getNearbySlots({
        lat: center[0],
        lng: center[1],
      });
      setSlots((data || []).filter((slot) => (slot.vehicleType || "").toLowerCase() === "4w"));
      setSearchedOnce(true);
      showToast("Parking spaces loaded", "success");
    } catch (error) {
      setSlots([]);
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [geocodeLocation, searchForm, showToast]);

  const onReserve = useCallback((slot) => {
    const session = getSession();
    if (!session?.user?.name) {
      setShowAuthModal(true);
      return;
    }

    const validationErrors = validateSearchForm(searchForm);
    setErrors(validationErrors);
    if (!isObjectEmpty(validationErrors)) {
      showToast("Please enter valid location and booking time", "error");
      return;
    }
    if (slot.isAvailable === false) {
      showToast("Slot is not available for selected time", "error");
      return;
    }

    setBookingDraft({
      slot,
      startTime: composeDateTime(searchForm.date, searchForm.startTime),
      endTime: composeDateTime(searchForm.date, searchForm.endTime),
      status: activeTab === "Airport" ? "pending" : "confirmed",
    });
    setShowPaymentModal(true);
  }, [activeTab, searchForm, showToast]);

  const finalizeBooking = useCallback(async () => {
    const session = getSession();
    if (!bookingDraft || !session?.user?.name) return;

    setBookingSlotId(bookingDraft.slot._id);
    try {
      await createBooking({
        slotId: bookingDraft.slot._id,
        userName: session.user.name,
        vehicleType: "4W",
        startTime: bookingDraft.startTime,
        endTime: bookingDraft.endTime,
        status: bookingDraft.status,
      });
      showToast("Booking Confirmed!", "success");
      setShowPaymentModal(false);
      setBookingDraft(null);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBookingSlotId("");
    }
  }, [bookingDraft, showToast]);

  return (
    <div className="bg-slate-50">
      <HeroSection />
      <FeaturesSection />

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="mb-2 flex flex-wrap gap-2">
          {["Hourly", "Monthly", "Airport"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-green-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <SearchForm
          form={searchForm}
          errors={errors}
          onChange={onFilterChange}
          onSubmit={onSearch}
          isLoading={loading}
        />

        <motion.div layout className="rounded-2xl overflow-hidden border border-green-100 shadow-sm">
          <MapView
            center={mapCenter}
            slots={filteredSlots}
            showSearchCenter={searchedOnce}
            selectedSlotId={selectedSlotId}
            onSlotHover={setSelectedSlotId}
            onBookNow={onReserve}
          />
        </motion.div>

        {loading ? (
          <section className="results-grid">
            <LoadingSpinner label="Loading nearby parking slots..." />
            <div className="parking-card-skeleton" />
            <div className="parking-card-skeleton" />
            <div className="parking-card-skeleton" />
          </section>
        ) : (
          <section className="space-y-4">
            {filteredSlots.map((slot) => (
              <ParkingCard
                key={slot._id}
                slot={slot}
                onReserve={() => onReserve(slot)}
                disabled={bookingSlotId === slot._id}
                isActive={selectedSlotId === slot._id}
                onHover={setSelectedSlotId}
              />
            ))}
            {!filteredSlots.length && searchedOnce && (
              <p className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
                No parking available nearby
              </p>
            )}
          </section>
        )}
      </div>

      <AuthRequiredModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PaymentModal
        open={showPaymentModal}
        bookingDraft={bookingDraft}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={finalizeBooking}
      />
    </div>
  );
}

export default HomePage;
