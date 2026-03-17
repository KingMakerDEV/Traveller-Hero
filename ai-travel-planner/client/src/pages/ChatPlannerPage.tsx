// import { useEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, RotateCcw } from "lucide-react";
// import Footer from "@/components/Footer";

// const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// interface ChatMessage {
//   role: "ai" | "user";
//   content: string;
//   options?: string[];
// }

// const TypingDots = () => (
//   <div className="flex gap-1.5 py-3 px-4">
//     {[0, 1, 2].map((i) => (
//       <motion.span
//         key={i}
//         className="block w-2 h-2 rounded-full bg-muted-foreground"
//         animate={{ opacity: [0.3, 1, 0.3] }}
//         transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
//       />
//     ))}
//   </div>
// );

// const ChatPlannerPage = () => {
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [loading, setLoading] = useState(false);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   const sessionId = sessionStorage.getItem("trip_session_id");

//   useEffect(() => {
//     if (!sessionId) {
//       navigate("/planner");
//       return;
//     }
//     // Load initial question from sessionStorage
//     const initialQ = sessionStorage.getItem("chat_initial_question");
//     if (initialQ) {
//       try {
//         const q = JSON.parse(initialQ);
//         setMessages([{ role: "ai", content: q.text, options: q.options }]);
//         sessionStorage.removeItem("chat_initial_question");
//       } catch {
//         navigate("/planner");
//       }
//     }
//   }, [sessionId, navigate]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   const handleSelect = async (option: string) => {
//     // Add user message
//     setMessages((prev) => {
//       // Remove options from the last AI message
//       const updated = prev.map((m, i) =>
//         i === prev.length - 1 && m.role === "ai" ? { ...m, options: undefined } : m
//       );
//       return [...updated, { role: "user", content: option }];
//     });

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_URL}/plan/answer`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ session_id: sessionId, answer: option }),
//       });
//       const data = await res.json();

//       if (data.type === "question") {
//         const q = data.question ?? data;
//         setMessages((prev) => [
//           ...prev,
//           { role: "ai", content: q.text, options: q.options },
//         ]);
//       } else if (data.type === "complete") {
//         sessionStorage.setItem("trip_result", JSON.stringify(data.trip));
//         // Brief pause so user sees completion
//         setTimeout(() => navigate("/trip/result"), 800);
//       }
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "ai", content: "Something went wrong. Please try again." },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartOver = () => {
//     sessionStorage.removeItem("trip_session_id");
//     sessionStorage.removeItem("travel_intent");
//     sessionStorage.removeItem("chat_initial_question");
//     sessionStorage.removeItem("trip_result");
//     navigate("/planner");
//   };

//   return (
//     <motion.main
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.3 }}
//       className="min-h-screen pt-20 pb-8 flex flex-col"
//     >
//       {/* Header */}
//       <div className="container mx-auto px-6 mb-6">
//         <div className="flex items-center justify-between">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back
//           </button>
//           <div className="text-center">
//             <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">AI Trip Planner</p>
//             <h1 className="text-xl md:text-2xl font-bold text-foreground">Plan Your Journey</h1>
//           </div>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleStartOver}
//             className="text-muted-foreground hover:text-foreground"
//           >
//             <RotateCcw className="h-4 w-4 mr-1" />
//             Start Over
//           </Button>
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 container mx-auto px-6 max-w-2xl">
//         <div className="space-y-4">
//           {messages.map((msg, i) => (
//             <motion.div
//               key={i}
//               initial={{ opacity: 0, y: 12 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//               className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//             >
//               <div
//                 className={`max-w-[85%] rounded-2xl px-5 py-3 ${
//                   msg.role === "user"
//                     ? "bg-primary text-primary-foreground rounded-br-sm"
//                     : "glass rounded-bl-sm"
//                 }`}
//               >
//                 <p className="text-sm leading-relaxed">{msg.content}</p>

//                 {/* Option buttons */}
//                 {msg.options && msg.options.length > 0 && (
//                   <div className="mt-4 flex flex-wrap gap-2">
//                     {msg.options.map((opt) => (
//                       <button
//                         key={opt}
//                         disabled={loading}
//                         onClick={() => handleSelect(opt)}
//                         className="px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
//                         style={{
//                           borderColor: "#e6c419",
//                           color: "#e6c419",
//                         }}
//                         onMouseEnter={(e) => {
//                           e.currentTarget.style.background = "#e6c419";
//                           e.currentTarget.style.color = "#0A1F1C";
//                         }}
//                         onMouseLeave={(e) => {
//                           e.currentTarget.style.background = "transparent";
//                           e.currentTarget.style.color = "#e6c419";
//                         }}
//                       >
//                         {opt}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           ))}

//           {loading && (
//             <motion.div
//               initial={{ opacity: 0, y: 12 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="flex justify-start"
//             >
//               <div className="glass rounded-2xl rounded-bl-sm">
//                 <TypingDots />
//               </div>
//             </motion.div>
//           )}

//           <div ref={bottomRef} />
//         </div>
//       </div>

//       <Footer />
//     </motion.main>
//   );
// };

// export default ChatPlannerPage;



import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Footer from "@/components/Footer";
import { useTripStore } from "@/store/useTripStore";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  options?: string[];
}

const TypingDots = () => (
  <div className="flex gap-1.5 py-3 px-4">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="block w-2 h-2 rounded-full bg-muted-foreground"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

const ChatPlannerPage = () => {
  const navigate = useNavigate();
  const setSelectedTrip = useTripStore((state) => (state as any).setSelectedTrip || state.selectTrip);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionId = sessionStorage.getItem("trip_session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/planner");
      return;
    }
    // Load initial question from sessionStorage
    const initialQ = sessionStorage.getItem("chat_initial_question");
    if (initialQ) {
      try {
        const q = JSON.parse(initialQ);
        setMessages([{ role: "ai", content: q.text, options: q.options }]);
        sessionStorage.removeItem("chat_initial_question");
      } catch {
        navigate("/planner");
      }
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSelect = async (option: string) => {
    // Add user message
    setMessages((prev) => {
      // Remove options from the last AI message
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === "ai" ? { ...m, options: undefined } : m
      );
      return [...updated, { role: "user", content: option }];
    });

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/plan/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer: option }),
      });
      const data = await res.json();

      if (data.type === "question") {
        const q = data.question ?? data;
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: q.text, options: q.options },
        ]);
      } else if (data.type === "complete") {
        const tripData = data.trip ?? data;
        sessionStorage.setItem("trip_result", JSON.stringify(tripData));
        
        // Also sync to store if the method exists
        if (setSelectedTrip) {
          setSelectedTrip(tripData);
        }

        // Brief pause so user sees completion
        setTimeout(() => navigate("/trip-result"), 800);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    sessionStorage.removeItem("trip_session_id");
    sessionStorage.removeItem("travel_intent");
    sessionStorage.removeItem("chat_initial_question");
    sessionStorage.removeItem("trip_result");
    navigate("/planner");
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-20 pb-8 flex flex-col"
    >
      {/* Header */}
      <div className="container mx-auto px-6 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">AI Trip Planner</p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Plan Your Journey</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartOver}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-6 max-w-2xl">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "glass rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Option buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        disabled={loading}
                        onClick={() => handleSelect(opt)}
                        className="px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                        style={{
                          borderColor: "#e6c419",
                          color: "#e6c419",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e6c419";
                          e.currentTarget.style.color = "#0A1F1C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#e6c419";
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="glass rounded-2xl rounded-bl-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <Footer />
    </motion.main>
  );
};

export default ChatPlannerPage;
