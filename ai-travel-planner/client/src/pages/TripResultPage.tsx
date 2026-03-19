import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, Clock, Star, Edit3, Send, 
    CheckCircle2, Info, Sparkles, 
    Calendar, IndianRupee,
    Bed, Utensils, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { useTripStore } from "@/store/useTripStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useUnsplashImages, useMultipleUnsplashImages, useUnsplashImage } from "@/hooks/useUnsplashImages";
import { formatBudget } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

/**
 * Sub-component for individual day images
 * Each day uses its own page number — guarantees a different photo
 * even when keywords are similar across days
 */
const DayImage = ({ keyword, dayIndex, country, destination }: { 
  keyword?: string; 
  dayIndex: number; 
  country: string; 
  destination: string 
}) => {
  const searchKeyword = keyword || `${destination} ${country} day ${dayIndex + 1}`;
  const { imageUrl } = useUnsplashImage(searchKeyword, dayIndex + 1);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <img 
        src={imageUrl || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`}
        alt={`Day ${dayIndex + 1}`} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      <div className="absolute bottom-10 right-10 text-white/10 font-serif text-[10rem] font-black italic select-none leading-none">
        0{dayIndex + 1}
      </div>
    </div>
  );
};

/**
 * Sub-component for review mood images
 * Each review uses its own page number to get a different mood photo
 */
const ReviewMoodImage = ({ keyword, index }: { keyword?: string; index: number }) => {
  const { imageUrl } = useUnsplashImage(
    keyword || "travel highlight landscape",
    index + 1
  );

  return (
    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl">
      <img 
        src={imageUrl || "https://images.unsplash.com/photo-1520113289666-6799dd215103?w=400&q=80"} 
        alt="Review mood" 
        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
      />
    </div>
  );
};

const TripResultPage = () => {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const selectedTrip = useTripStore((state) => state.selectedTrip);
  const { isLoggedIn, token, user, signInWithGoogle } = useAuthStore();
  const [editRequest, setEditRequest] = useState("");

  const heroKeywords = useMemo((): string[] => {
     let kw: string[] = (trip?.image_keywords?.hero as string[]) || [];
     if (kw.length === 0) {
        kw = [
          `${trip?.destination} ${trip?.country} landscape`,
          `${trip?.destination} travel aerial`,
          `${trip?.country} scenery highlights`
        ];
     }
     return Array.from(new Set(kw)).slice(0, 3);
  }, [trip]);
  
  const { images: heroImages } = useMultipleUnsplashImages(heroKeywords);
  const finalHeroImages = useMemo(() => {
     const combined = [...heroImages];
     if (combined.length === 0 && trip?.heroImage) combined.push(trip?.heroImage);
     return Array.from(new Set(combined));
  }, [heroImages, trip?.heroImage]);

  useEffect(() => {
    if (finalHeroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % finalHeroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [finalHeroImages.length]);

  useEffect(() => {
    if (selectedTrip && (selectedTrip as any).days) {
      setTrip(selectedTrip);
      return;
    }

    const raw = sessionStorage.getItem("trip_result");
    if (!raw) {
      navigate("/planner");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const tripData = parsed.trip ?? parsed;
      if (tripData && (tripData.days || tripData.itinerary)) {
        setTrip({
          ...tripData,
          days: tripData.days || tripData.itinerary,
          estimated_budget: tripData.estimated_budget || tripData.priceEstimate || tripData.budget
        });
      } else {
        navigate("/planner");
      }
    } catch {
      navigate("/planner");
    }
  }, [navigate, selectedTrip]);

  const handleConfirm = async () => {
    if (!trip) return;

    if (!isLoggedIn || !token) {
      toast.info("Please sign in to save your trip");
      sessionStorage.setItem("pending_confirm", "true");
      await signInWithGoogle();
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/trip/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_data: trip,
          intent: trip.intent,
          intent_group: trip.intent_group,
          image_keywords: trip.image_keywords
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Trip saved successfully!");
        navigate(`/trip/${data.slug || trip.slug}`);
      } else {
        toast.error(data.error || "Failed to save trip");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!isLoggedIn || !token) {
      toast.info("Please sign in to edit your trip");
      return;
    }

    if (!editRequest.trim()) {
      toast.error("Please enter what you'd like to change");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/trip/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          existing_trip: trip,
          edit_request: editRequest.trim(),
          slug: trip.slug
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedTrip = data.trip ?? data;
        sessionStorage.setItem("trip_result", JSON.stringify(updatedTrip));
        setTrip(updatedTrip);
        setEditRequest("");
        toast.success("Trip plan refined!");
        navigate("/trip-result", { replace: true });
      } else {
        toast.error(data.error || "Edit failed");
      }
    } catch (error) {
      toast.error("Edit failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!trip) return null;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-[#0A1F1C] text-stone-200"
    >
      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] overflow-hidden bg-stone-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={finalHeroImages[currentImageIndex] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80"}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-10 left-10 z-20">
          <span className="bg-[#e6c419] text-[#0A1F1C] px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-[0.2em] shadow-2xl">
            Generated Expedition Proposal
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-20 z-20 container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <h1 className="text-white font-serif italic text-4xl md:text-[4rem] leading-[0.95] mb-6 tracking-tighter">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-stone-300 text-xl font-light">
              <div className="flex items-center gap-2">
                <MapPin size={22} className="text-[#e6c419]" />
                <span>{trip.destination}, {trip.country}</span>
              </div>
              <div className="w-px h-6 bg-white/20 hidden md:block" />
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-white/40" />
                <span>{trip.duration_days} Days Mission</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {finalHeroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentImageIndex ? "bg-[#e6c419] w-12" : "bg-white/20 w-4"
              }`}
            />
          ))}
        </div>
      </section>

      {/* SUMMARY STRIP */}
      <section className="bg-[#0D2623] py-20 border-b border-white/5">
        <div className="container mx-auto px-6 max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-[#e6c419] pl-12 mb-16"
          >
            <p className="text-stone-200 italic text-2xl md:text-[2.5rem] leading-[1.2] font-extralight tracking-tight">
              "{trip.summary}"
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
             <div className="flex items-center gap-3 bg-[#142A27] px-8 py-4 rounded-2xl border border-white/5 shadow-xl">
                <Clock size={20} className="text-[#e6c419]" />
                <span className="text-white font-bold">{trip.duration_days} Days</span>
             </div>
             <div className="flex items-center gap-3 bg-[#142A27] px-8 py-4 rounded-2xl border border-white/5 shadow-xl">
                <Calendar size={20} className="text-[#e6c419]" />
                <span className="text-white font-bold">{trip.best_season}</span>
             </div>
             <div className="flex items-center gap-3 bg-[#142A27] px-8 py-4 rounded-2xl border border-[#e6c419]/30 shadow-xl">
                <IndianRupee size={20} className="text-[#e6c419]" />
                <span className="text-[#e6c419] font-bold">{formatBudget(trip.estimated_budget)}</span>
             </div>
          </div>
        </div>
      </section>

      {/* ITINERARY */}
      <section className="py-24 bg-[#0A1F1C]">
        <div className="container mx-auto px-6 mb-24 text-center">
          <p className="text-[#e6c419] font-mono uppercase tracking-[0.4em] text-xs mb-4">Tactical Plan</p>
          <h2 className="text-5xl md:text-7xl font-serif text-white tracking-tighter italic">Sequence of Events</h2>
        </div>

        <div className="space-y-0">
          {trip.days.map((day: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} min-h-[550px] group`}
            >
              <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center bg-[#0A1F1C] relative">
                <div className={`absolute top-0 ${i % 2 === 0 ? "right-0" : "left-0"} h-full w-[1px] bg-white/5`} />
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <span className="text-[#e6c419] font-mono text-[0.7rem] font-bold uppercase tracking-[0.4em]">Day {i + 1}</span>
                       <div className="h-px w-12 bg-[#e6c419]/30" />
                       <span className="text-stone-500 font-mono text-[0.7rem] uppercase tracking-widest">{day.theme}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif text-white leading-tight">{day.location}</h3>
                  </div>
                  <div className="space-y-6">
                    {day.activities.map((act: string, j: number) => (
                      <div key={j} className="flex gap-4 items-start">
                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#e6c419] shadow-[0_0_8px_#e6c419]" />
                        <p className="text-stone-400 text-xl leading-relaxed font-light">{act}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/5">
                    <div>
                      <div className="flex items-center gap-2 text-[#e6c419]/60 mb-2 font-mono text-[10px] uppercase tracking-widest font-bold">
                        <Bed size={16} /> Base
                      </div>
                      <p className="text-white font-medium">{day.accommodation}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[#e6c419]/60 mb-2 font-mono text-[10px] uppercase tracking-widest font-bold">
                        <Utensils size={16} /> Fuel
                      </div>
                      <p className="text-white font-medium">{day.food}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 min-h-[400px] relative">
                <DayImage 
                    keyword={trip.image_keywords?.days?.[i]} 
                    dayIndex={i} 
                    country={trip.country} 
                    destination={trip.destination}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PACKING TIPS */}
      <section className="bg-[#0D2623] py-32 border-y border-white/10 text-center">
        <div className="container mx-auto px-6 max-w-6xl">
           <h2 className="text-3xl font-serif text-[#e6c419] tracking-[0.3em] uppercase mb-16">Operational Logistics</h2>
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trip.packing_tips.map((tip: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#142A27]/50 backdrop-blur-sm border border-white/5 p-8 rounded-2xl flex flex-col gap-6 hover:border-[#e6c419]/40 transition-all text-left"
              >
                <div className="bg-[#e6c419] text-[#0A1F1C] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-stone-300 text-lg leading-relaxed font-light">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS MOCKUP */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-4xl font-serif text-white italic tracking-tighter text-center mb-24 underline decoration-[#e6c419]/30 underline-offset-8">Field Reference Data</h2>
            <div className="space-y-24">
              {[
                { name: "Sarah J.", comment: "Flawless execution. The generated route was logically optimized and emotionally resonant.", rating: 5 },
                { name: "Michael C.", comment: "Premium quality insights. The local fuel recommendations were spot on.", rating: 5 }
              ].map((rev, i) => (
                <div key={i} className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-start`}>
                  <ReviewMoodImage keyword={trip.image_keywords?.intent_mood} index={i} />
                  <div className="flex-grow space-y-6">
                    <div className="flex justify-between items-baseline underline decoration-white/5 underline-offset-4">
                        <h4 className="text-2xl font-serif text-white italic">{rev.name}</h4>
                        <div className="flex text-[#e6c419]/40">
                           {[...Array(rev.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                        </div>
                    </div>
                    <p className="text-stone-400 text-2xl font-light italic leading-relaxed">"{rev.comment}"</p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* ACTION BAR */}
      <section className="sticky bottom-0 z-50 bg-[#0A1F1C]/80 backdrop-blur-3xl border-t border-white/5 py-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto px-6 max-w-5xl space-y-10">
           <div className="flex flex-col items-center gap-6">
              <label className="text-[10px] uppercase font-mono tracking-[0.5em] text-[#e6c419] font-bold">Optimization Protocol</label>
              <textarea
                value={editRequest}
                onChange={(e) => setEditRequest(e.target.value)}
                placeholder="Request tactical adjustments (e.g. 'More intensity', 'Luxury focus')..."
                className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-xl font-light italic text-white focus:outline-none focus:border-[#e6c419] min-h-[120px] shadow-inner transition-all"
              />
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={saving}
                className="border-[#e6c419] text-[#e6c419] hover:bg-[#e6c419] hover:text-[#0A1F1C] font-bold uppercase tracking-widest px-12 h-16 rounded-full transition-all w-full sm:w-auto"
              >
                {saving ? "Processing..." : "Refine Strategy"}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="bg-[#e6c419] text-[#0A1F1C] hover:bg-[#ffe34d] font-black uppercase tracking-[0.2em] px-12 h-16 rounded-full shadow-2xl shadow-[#e6c419]/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                {saving ? "Confirming..." : "Confirm & Commit"}
                <ArrowRight className="ml-3" size={20} />
              </Button>
           </div>
        </div>
      </section>

      <Footer />
    </motion.main>
  );
};

export default TripResultPage;