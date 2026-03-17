// import { useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { useTripStore } from "@/store/useTripStore";
// import LoadingAgents from "@/components/LoadingAgents";

// const LoadingPage = () => {
//   const navigate = useNavigate();
//   const { planTrip, selectedTrip } = useTripStore();
//   const initRef = useRef(false);

//   useEffect(() => {
//     const data = sessionStorage.getItem("travel_intent");
//     if (!data) {
//       navigate("/planner");
//       return;
//     }

//     if (!initRef.current) {
//       initRef.current = true;
//       const { intent, intent_group, preferences } = JSON.parse(data);
//       planTrip(intent, intent_group, preferences).then(() => {
//         sessionStorage.removeItem("travel_intent");
//       });
//     } else if (selectedTrip) {
//       navigate(`/trip/${selectedTrip.id}`);
//     }
//   }, [planTrip, selectedTrip, navigate]);

//   return (
//     <motion.main
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.3 }}
//       className="min-h-screen flex items-center justify-center"
//     >
//       <LoadingAgents />
//     </motion.main>
//   );
// };

// export default LoadingPage;


import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LoadingAgents from "@/components/LoadingAgents";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const LoadingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const startPlanning = async () => {
      try {
        const raw = sessionStorage.getItem("travel_intent");
        if (!raw) {
          navigate("/planner");
          return;
        }
        const intent = JSON.parse(raw);

        const res = await fetch(`${API_URL}/plan/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(intent),
        });
        const data = await res.json();

        sessionStorage.setItem("trip_session_id", data.session_id);
        sessionStorage.setItem(
          "chat_initial_question",
          JSON.stringify({ text: data.question.text, options: data.question.options })
        );
        navigate("/chat");
      } catch (err) {
        console.error("Failed to start planning session:", err);
        // Fallback: go back to planner
        navigate("/planner");
      }
    };

    startPlanning();
  }, [navigate]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center"
    >
      <LoadingAgents />
    </motion.main>
  );
};

export default LoadingPage;
