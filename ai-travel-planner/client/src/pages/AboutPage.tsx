import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { useUnsplashImages } from "@/hooks/useUnsplashImages";

const SectionImage = ({ keyword, fallback }: { keyword: string; fallback: string }) => {
  const { images } = useUnsplashImages(keyword, 1);
  return (
    <img 
      src={images[0] || fallback} 
      alt="Thematic illustration" 
      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 opacity-70 group-hover:opacity-100"
    />
  );
};

const AboutPage = () => {
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      console.log("ORIGIN:", window.location.origin);
      console.log("SENDING FEEDBACK:", formData);
      
      const api_url = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      console.log("FETCH URL:", `${api_url}/feedback`);

      const response = await fetch(`${api_url}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("RESPONSE:", response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send feedback");
      }

      const data = await response.json();
      console.log("DATA:", data);

      if (data.ok === true) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        throw new Error(data.error || "Failed to send feedback");
      }
    } catch (err: any) {
      console.error("FEEDBACK ERROR:", err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const sections = [
    {
      title: "The Project",
      content: "TravellerHero is an AI-powered adventure travel planner designed to bridge the gap between human curiosity and machine intelligence. We move away from generic travel lists and focus on psychological intent—how you want to feel, not just where you want to go.",
      keyword: "travel planning technology AI future",
      fallback: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
    },
    {
      title: "Multi-Agent System",
      content: "Our architecture utilizes a specialized team of 6 AI agents, each with a distinct role: Scout (research), Concierge (logistics), Architect (itinerary structuring), Instigator (wildcards), and Curator (validation). This collaborative intelligence ensures every trip is balanced and unique.",
      keyword: "collaboration futuristic robots teamwork nature",
      fallback: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
    },
    {
      title: "LangGraph Workflow",
      content: "The system is orchestrated by LangGraph, allowing for cyclic state management. Agents don't just run once; they converse and refine the plan iteratively until the Supervisor marks the execution as complete.",
      keyword: "network connection nodes landscape abstract",
      fallback: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"
    },
    {
      title: "Intent-Based Planning",
      content: "We categorize travel into psychological pillars: Restoration, Stimulation, Connection, and Pragmatism. By selecting an intent like 'Adrenaline' or 'Digital Detox', the agents prioritize experiences that fulfill your current mental state.",
      keyword: "psychology meditation adventure nature peace",
      fallback: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
    },
    {
      title: "Free-Tier Architecture",
      content: "Engineered for accessibility, TravellerHero runs on a high-performance free-tier stack: React + Vite on Vercel for the frontend, and a Python Flask backend on Render/Railway. We leverage Nvidia NIM for lightning-fast LLM inference without infrastructure costs.",
      keyword: "modern minimalist clean software tech",
      fallback: "https://images.unsplash.com/photo-1498050109023-c514c33d865c?w=800&q=80"
    }
  ];

  return (
    <main className="bg-[#0A1F1C] min-h-screen text-stone-200 font-sans selection:bg-[#e6c419] selection:text-[#0A1F1C] pt-24">
      {/* Title Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <span className="text-[#e6c419] uppercase tracking-widest text-sm mb-4 block">Architecting Memories</span>
          <h1 className="text-5xl md:text-8xl font-serif text-[#e6c419] mb-8 tracking-tighter">
            TravellerHero
          </h1>
          <motion.div style={{ y: yParallax }} className="h-px bg-[#e6c419]/30 w-full max-w-2xl mx-auto" />
        </motion.div>
      </section>

      {/* Narrative Sections */}
      <div className="container mx-auto px-6 space-y-32">
        {sections.map((section, idx) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
          >
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-5xl font-serif text-[#e6c419]">{section.title}</h2>
              <p className="text-lg md:text-xl text-stone-400 font-light leading-relaxed">
                {section.content}
              </p>
            </div>
            <div className="flex-1 w-full aspect-video md:aspect-[16/10] bg-[#0D2623] border border-[#e6c419]/10 rounded-sm overflow-hidden relative group shadow-2xl">
                <SectionImage keyword={section.keyword} fallback={section.fallback} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F1C] via-transparent to-transparent pointer-events-none opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#e6c419]/5 to-transparent transition-opacity group-hover:opacity-20" />
                <div className="absolute bottom-8 left-8 text-[#e6c419] font-serif italic text-2xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                    {section.title} Perspective
                </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* Feedback Form */}
      <section id="feedback" className="container mx-auto px-6 py-32 border-t border-[#e6c419]/10 mt-32">
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           className="max-w-2xl mx-auto bg-[#0D2623] p-10 md:p-16 border border-[#e6c419]/10 shadow-2xl skew-x-[-1deg]"
        >
          <div className="text-center mb-12 skew-x-[1deg]">
            <h2 className="text-3xl font-serif text-[#e6c419] mb-2 uppercase tracking-wide">Leave Your Mark</h2>
            <p className="text-stone-500 italic">Your insights fuel our artificial evolution.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 skew-x-[1deg]">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#e6c419]/60 font-medium">Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={status === "loading"}
                className="w-full bg-transparent border-b border-[#e6c419]/20 font-light py-2 px-0 focus:outline-none focus:border-[#e6c419] transition-all disabled:opacity-50"
                placeholder="The Voyager's Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#e6c419]/60 font-medium">Identity</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={status === "loading"}
                className="w-full bg-transparent border-b border-[#e6c419]/20 font-light py-2 px-0 focus:outline-none focus:border-[#e6c419] transition-all disabled:opacity-50"
                placeholder="email@horizon.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#e6c419]/60 font-medium">Manifesto</label>
              <textarea 
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                disabled={status === "loading"}
                className="w-full bg-transparent border-b border-[#e6c419]/20 font-light py-2 px-0 focus:outline-none focus:border-[#e6c419] transition-all disabled:opacity-50 resize-none"
                placeholder="Share your perspective..."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={status === "loading"}
              className="w-full bg-[#e6c419] text-[#0A1F1C] py-4 font-serif uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#ffe34d] transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  Transmit Feedback
                  <Send className="w-4 h-4 group-hover:translate-x-1 -rotate-45 transition-transform" />
                </>
              )}
            </motion.button>

            {/* Status Messages */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {status === "success" && (
                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-4 border border-emerald-500/20 rounded-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs uppercase tracking-widest font-medium">Your transmission has been received. Thank you.</span>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center gap-3 text-rose-500 bg-rose-500/10 p-4 border border-rose-500/20 rounded-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs uppercase tracking-widest font-medium">{errorMessage}</span>
                    </div>
                )}
            </motion.div>
          </form>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default AboutPage;
