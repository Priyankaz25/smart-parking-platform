import { CheckCircle, Clock3, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const featureItems = [
  {
    icon: MapPin,
    title: "Tell us where you're going.",
    description:
      "Our smart system helps you quickly find the best parking space near your destination.",
  },
  {
    icon: Clock3,
    title: "Book parking in seconds.",
    description:
      "Browse spaces, compare prices, and reserve instantly with a smooth booking experience.",
  },
  {
    icon: CheckCircle,
    title: "You're all set",
    description:
      "Access directions, manage bookings, and park stress-free with full control.",
  },
];

function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
        }}
      >
        {featureItems.map((item, index) => (
          <FeatureCard key={item.title} index={index} {...item} />
        ))}
      </motion.div>
    </section>
  );
}

export default FeaturesSection;
