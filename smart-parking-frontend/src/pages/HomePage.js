import { useCallback, useEffect, useMemo, useState } from "react";
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
import { geocodeLocationText } from "../utils/geocode";
import { slotMatchesListing } from "../utils/slotFilters";
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
  const [browseSlots, setBrowseSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState("");
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [mapRecenterVersion, setMapRecenterVersion] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

 useEffect(() => {
  setBrowseSlots([]);
}, []);

  const filteredBrowseSlots = useMemo(() => browseSlots.filter(slotMatchesListing), [browseSlots]);
  const filteredSlots = useMemo(() => slots.filter(slotMatchesListing), [slots]);
  const mapSlots = searchedOnce ? filteredSlots : filteredBrowseSlots;

  const onFilterChange = (key, value) => {
    setSearchForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSearch = useCallback(async () => {
    const nextErrors = validateSearchForm(searchForm);
    setErrors(nextErrors);
    if (!isObjectEmpty(nextErrors)) {
      showToast("Please fix the highlighted fields", "error");
      return;
    }

    setLoading(true);
    setSelectedSlotId("");
    try {
      const geo = await geocodeLocationText(searchForm.location);
      const center = [geo.lat, geo.lng];
      setMapCenter(center);
      setMapRecenterVersion((v) => v + 1);
      const data = await getNearbySlots({
        lat: geo.lat,
        lng: geo.lng,
        radiusMeters: 2000,
      });
      setSlots(data || []);
      setSearchedOnce(true);
      showToast(geo.displayName ? `Showing parking near ${geo.displayName.split(",")[0]}` : "Parking spaces loaded", "success");
    } catch (error) {
      const message = error.message || "Search failed";
      setErrors((current) => ({ ...current, location: message }));
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [searchForm, showToast]);

  const onReserve = useCallback(
    (slot) => {
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
    },
    [activeTab, searchForm, showToast]
  );

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
      showToast("Booking confirmed", "success");
      setShowPaymentModal(false);
      setBookingDraft(null);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBookingSlotId("");
    }
  }, [bookingDraft, showToast]);

  const mapZoom = searchedOnce ? 14 : 5;

  return (
    <div className="bg-slate-50 min-h-screen">
      <HeroSection />
      <FeaturesSection />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <div className="mb-2 flex flex-wrap gap-2">
          {["Hourly", "Monthly", "Airport"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-800"
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

        <motion.div
          layout
          className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg bg-white"
        >
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            slots={mapSlots}
            showSearchCenter={searchedOnce}
            mapRecenterVersion={mapRecenterVersion}
            selectedSlotId={selectedSlotId}
            onSlotHover={setSelectedSlotId}
            onBookNow={onReserve}
          />
        </motion.div>
        <p className="text-center text-sm text-slate-500 -mt-2">
          {searchedOnce
           ? "Map shows available parking within 500 meters of your search."
            : "Search a location to view available parking nearby."}
        </p>

        {loading ? (
          <section className="results-grid">
            <LoadingSpinner label="Finding parking near you..." />
            <div className="parking-card-skeleton" />
            <div className="parking-card-skeleton" />
            <div className="parking-card-skeleton" />
          </section>
        ) : (
          <section className="space-y-4">
            {!searchedOnce ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-sm border border-slate-100"
              >
                Choose date and times, then search a location to see ranked nearby parking and distances.
              </motion.p>
            ) : (
              <>
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
                {!filteredSlots.length && (
                  <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm border border-slate-100">
                    No parking in this area. Try another neighborhood or widen your search later.
                  </p>
                )}
              </>
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
