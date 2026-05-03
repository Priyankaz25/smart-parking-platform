import { useMemo, useState } from "react";
import { motion } from "framer-motion";

function PaymentModal({ open, bookingDraft, onClose, onSuccess }) {
  const [step, setStep] = useState("summary");
  const [method, setMethod] = useState("UPI");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [processing, setProcessing] = useState(false);

  const totalPrice = useMemo(() => {
    if (!bookingDraft?.slot || !bookingDraft?.startTime || !bookingDraft?.endTime) return 0;
    const start = new Date(bookingDraft.startTime).getTime();
    const end = new Date(bookingDraft.endTime).getTime();
    const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    return hours * (bookingDraft.slot.pricePerHour || 0);
  }, [bookingDraft]);

  if (!open || !bookingDraft?.slot) return null;

  const pay = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1300));
    setProcessing(false);
    setStep("success");
  };

  const done = async () => {
    await onSuccess(totalPrice);
    setStep("summary");
    setMethod("UPI");
    setCard({ number: "", expiry: "", cvv: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {step === "summary" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800">Booking Summary</h3>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><strong>Parking:</strong> {bookingDraft.slot.name || bookingDraft.slot.address}</p>
              <p><strong>Address:</strong> {bookingDraft.slot.address}</p>
              <p><strong>Date & Time:</strong> {new Date(bookingDraft.startTime).toLocaleString()} - {new Date(bookingDraft.endTime).toLocaleString()}</p>
              <p><strong>Total Price:</strong> ₹{totalPrice}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="flex-1 rounded-lg bg-gray-100 py-2" onClick={onClose}>Cancel</button>
              <button type="button" className="flex-1 rounded-lg bg-green-600 py-2 text-white" onClick={() => setStep("payment")}>Continue to Payment</button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <h3 className="text-xl font-semibold text-gray-800">Payment</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["UPI", "Card", "Net Banking"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-lg border py-2 text-sm ${method === type ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200"}`}
                  onClick={() => setMethod(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            {method === "Card" && (
              <div className="mt-4 grid gap-3">
                <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Card Number" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="Expiry Date" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))} />
                  <input className="rounded-lg border border-gray-200 px-3 py-2" placeholder="CVV" value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))} />
                </div>
              </div>
            )}

            <button type="button" className="mt-5 w-full rounded-lg bg-green-600 py-2 text-white disabled:opacity-60" onClick={pay} disabled={processing}>
              {processing ? "Processing..." : "Pay Now"}
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <h3 className="text-2xl font-semibold text-green-700">Payment Successful 🎉</h3>
            <p className="mt-2 text-gray-600">Your booking has been confirmed.</p>
            <button type="button" className="mt-5 w-full rounded-lg bg-green-600 py-2 text-white" onClick={done}>
              Done
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default PaymentModal;
