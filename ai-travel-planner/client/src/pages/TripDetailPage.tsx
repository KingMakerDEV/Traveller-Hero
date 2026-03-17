import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import TripDetail from "@/components/TripDetail";
import LoadingAgents from "@/components/LoadingAgents";
import Footer from "@/components/Footer";
import { useTripStore } from "@/store/useTripStore";

const TripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { selectedTrip, isLoading, fetchMockTrip } = useTripStore();

  useEffect(() => {
    if (tripId) fetchMockTrip(tripId);
  }, [tripId, fetchMockTrip]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading || !selectedTrip ? (
        <LoadingAgents />
      ) : (
        <TripDetail trip={selectedTrip} />
      )}
      <Footer />
    </motion.main>
  );
};

export default TripDetailPage;
