import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import TripDetail from "@/components/TripDetail";
import LoadingAgents from "@/components/LoadingAgents";
import Footer from "@/components/Footer";
import { useTripStore } from "@/store/useTripStore";
import ShareButton from "@/components/ShareButton";
import BudgetBreakdown from "@/components/BudgetBreakdown";

const TripDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selectedTrip, isLoading, fetchTripBySlug } = useTripStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadTrip = async () => {
      if (!slug) return;
      
      setError(false);
      try {
        await fetchTripBySlug(slug);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(true);
      }
    };
    loadTrip();
  }, [slug, fetchTripBySlug]);

  // Show "Trip Not Found" only if we AREN'T loading and there's NO selectedTrip
  // or if an explicit error occurred.
  if (!isLoading && (error || !selectedTrip) && slug) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0A1F1C] text-center px-6">
        <div className="mb-8 w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <Info size={48} />
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 italic tracking-tighter uppercase">Expedition Not Found</h2>
        <p className="text-stone-400 mb-12 max-w-md text-lg leading-relaxed font-light">
          We couldn't retrieve the requested mission data. The coordinates may be incorrect or the expedition has been archived from our primary servers.
        </p>
        <button 
          onClick={() => navigate("/")} 
          className="bg-[#e6c419] text-[#0A1F1C] px-12 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#e6c419]/20"
        >
          Return to Command Center
        </button>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {isLoading ? (
        <LoadingAgents />
      ) : selectedTrip ? (
        <TripDetail trip={selectedTrip} />
      ) : null}
    </motion.main>
  );
};

export default TripDetailPage;
