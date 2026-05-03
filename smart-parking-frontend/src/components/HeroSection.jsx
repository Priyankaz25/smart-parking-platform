import { motion } from "framer-motion";

function HeroSection() {
  return (
    <motion.section
      className="mx-auto max-w-6xl px-6 pt-10 pb-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
        <span className="text-green-500">Find Parking</span>{" "}
        <span className="text-gray-800">with ParkNest</span>
      </h1>
      <p className="mt-4 text-lg text-gray-500">
        The simplest way to book a parking space.
      </p>
    </motion.section>
  );
}

export default HeroSection;
