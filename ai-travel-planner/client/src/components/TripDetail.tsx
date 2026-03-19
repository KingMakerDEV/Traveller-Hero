import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Clock, Star, Edit3, Send, 
  CheckCircle2, Info, Sparkles, 
  Calendar, IndianRupee,
  Bed, Utensils, ArrowRight
} from "lucide-react";
import type { TripState } from "@/types/trip";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useUnsplashImages, useMultipleUnsplashImages } from "@/hooks/useUnsplashImages";
import { RefineTripModal } from "@/components/RefineTripModal";
import Footer from "@/components/Footer";
import { formatBudget } from "@/lib/utils";

/**
 * Sub-component for individual day images to handle hook usage and uniqueness
 */
const DayImage = ({ keyword, dayIndex, country }: { keyword?: string; dayIndex: number; country: string }) => {
  const seed = useMemo(() => Math.floor(Math.random() * 1000), []);
  const searchKeyword = keyword || `Day ${dayIndex + 1} travel ${country}`;
  const { images } = useUnsplashImages(searchKeyword, 1);
  
  const displayImageUrl = images[0] || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&sig=${seed}`;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <img 
        src={displayImageUrl} 
        alt={`Day ${dayIndex + 1} highlight`} 
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
 */
const ReviewMoodImage = ({ keyword, index }: { keyword?: string; index: number }) => {
  const { images } = useUnsplashImages(keyword || "travel highlight", 5);
  const imageUrl = images[index % images.length] || "https://images.unsplash.com/photo-1520113289666-6799dd215103?w=400&q=80";

  return (
    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl">
      <img src={imageUrl} alt="Review mood" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
    </div>
  );
};

const TripDetail = ({ trip }: { trip: TripState }) => {
  const prefersReduced = useReducedMotion();
  const navigate = useNavigate();
  const { isLoggedIn, token, user, signInWithGoogle } = useAuthStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  // The content of the trip often lives in 'trip_data' or 'context' if from session/generation
  // For saved trips from DB, it's at the top level
  const tripData = useMemo(() => {
    // Priority: trip_data -> context -> trip top level
    return (trip as any).trip_data || trip.context || trip;
  }, [trip]);

  // Hero Image Fetching
  const heroKeywords = useMemo(() => {
     const kw = trip?.image_keywords?.hero || [];
     return Array.from(new Set(kw)).slice(0, 3);
  }, [trip]);
  
  const { images: heroImages } = useMultipleUnsplashImages(heroKeywords, 3);
  const finalHeroImages = useMemo(() => {
     const combined = [...heroImages];
     if (combined.length === 0 && trip.heroImage) combined.push(trip.heroImage);
     return Array.from(new Set(combined));
  }, [heroImages, trip.heroImage]);

  useEffect(() => {
    if (finalHeroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % finalHeroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [finalHeroImages.length]);

  const allReviews = useMemo(() => {
    return [...localReviews, ...(trip.reviews || [])];
  }, [localReviews, trip.reviews]);

  const handleEdit = () => {
    setIsRefineModalOpen(true);
  };

  const handleRefineSubmit = async (editRequest: string) => {
    setIsRefining(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trip/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          existing_trip: tripData,
          edit_request: editRequest.trim(),
          slug: trip.slug
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Trip successfully refined!");
        sessionStorage.setItem("trip_result", JSON.stringify(data.trip || data));
        setIsRefineModalOpen(false);
        navigate("/trip-result", { replace: true });
      } else {
        toast.error(data.error || "Refinement failed");
      }
    } catch (error) {
      toast.error("Network error during refinement");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.info("Please sign in to leave a review");
      signInWithGoogle();
      return;
    }
    if (!reviewComment.trim()) {
       toast.error("Please enter a comment");
       return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: trip.id,
          reviewer_name: user?.name || "Anonymous",
          rating: reviewRating,
          comment: reviewComment,
          trip_image_keyword: trip.image_keywords?.intent_mood
        }),
      });

      if (response.ok) {
        const newReview = {
          id: Date.now().toString(),
          reviewer_name: user?.name || "Anonymous",
          rating: reviewRating,
          comment: reviewComment,
          created_at: new Date().toISOString()
        };
        setLocalReviews([newReview, ...localReviews]);
        setReviewComment("");
        setReviewRating(5);
        setIsReviewFormOpen(false);
        toast.success("Review submitted!");
      } else {
        toast.error("Failed to submit review");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [isBooking, setIsBooking] = useState(false);

  const handleBook = async () => {
    if (!isLoggedIn || !token) {
      toast.info("Please sign in to book this trip");
      signInWithGoogle();
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trip/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_data: tripData,
          intent: trip.intent,
          intent_group: trip.intent_group,
          image_keywords: trip.image_keywords
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Trip successfully added to your missions!");
        navigate("/profile");
      } else {
        toast.error(data.error || "Failed to book trip");
      }
    } catch (error) {
      toast.error("Network error during booking");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="bg-[#0A1F1C] text-stone-200 min-h-screen">
      {/* SECTION 1 — HERO CAROUSEL (70vh) */}
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
              alt={tripData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Intent Badge Overlay */}
        <div className="absolute top-10 left-10 z-20">
          <motion.span 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#e6c419] text-[#0A1F1C] px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-[0.2em] shadow-2xl"
          >
            {trip.intent_group || "Adventure Curated"}
          </motion.span>
        </div>

        {/* Hero Title & Location Center-Bottom Alignment */}
        <div className="absolute inset-x-0 bottom-16 z-20 container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl"
          >
            <h1 className="text-white font-serif italic text-4xl md:text-[4.5rem] leading-[0.9] mb-4 tracking-tighter drop-shadow-2xl">
              {tripData.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-stone-300 text-xl font-light">
              <div className="flex items-center gap-2">
                <MapPin size={22} className="text-[#e6c419]" />
                <span>{trip.destination}, {trip.country}</span>
              </div>
              <div className="hidden md:block w-px h-6 bg-white/20" />
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-white/40" />
                <span>{tripData.duration_days || (tripData.days?.length) || 7} Days Expedition</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Stat Pill (Right) */}
        <div className="absolute bottom-12 right-10 z-20 hidden lg:block">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-6 shadow-2xl"
           >
              <div className="text-center">
                 <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Duration</p>
                 <p className="text-lg font-bold text-white">{tripData.duration_days || (tripData.days?.length) || 7} Days</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                 <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Best Season</p>
                 <p className="text-lg font-bold text-[#e6c419]">{tripData.best_season || "All Year"}</p>
              </div>
           </motion.div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {finalHeroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentImageIndex ? "bg-[#e6c419] w-12" : "bg-white/20 w-4 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* SECTION 2 — SUMMARY STRIP */}
      <section className="bg-[#0D2623] py-20 relative border-b border-white/5">
         <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
            <Sparkles size={300} />
         </div>
        <div className="container mx-auto px-6 max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-[#e6c419] pl-12 mb-16"
          >
            <p className="text-stone-200 italic text-2xl md:text-[2.5rem] leading-[1.2] font-extralight tracking-tight">
              "{tripData.summary}"
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center gap-3 bg-[#142A27] border border-white/5 px-8 py-4 rounded-2xl shadow-xl">
                <Clock size={20} className="text-[#e6c419]" />
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-stone-500">Timeline</p>
                   <p className="text-white font-bold">{tripData.duration_days || (tripData.days?.length) || 7} Days</p>
                </div>
             </div>
             <div className="flex items-center gap-3 bg-[#142A27] border border-white/5 px-8 py-4 rounded-2xl shadow-xl">
                <Calendar size={20} className="text-[#e6c419]" />
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-stone-500">Season</p>
                   <p className="text-white font-bold">{tripData.best_season || "All Year"}</p>
                </div>
             </div>
             <div className="flex items-center gap-3 bg-[#142A27] border border-[#e6c419]/30 px-8 py-4 rounded-2xl shadow-xl">
                <IndianRupee size={20} className="text-[#e6c419]" />
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-stone-500">Est. Budget</p>
                   <p className="text-[#e6c419] font-bold">{formatBudget(tripData.estimated_budget)}</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DAY BY DAY ITINERARY */}
      <section className="py-24 bg-[#0A1F1C]">
        <div className="container mx-auto px-6 mb-24 text-center">
          <p className="text-[#e6c419] font-mono uppercase tracking-[0.4em] text-xs mb-4">Step by Step</p>
          <h2 className="text-5xl md:text-7xl font-serif text-white tracking-tighter italic">The Itinerary</h2>
        </div>

        <div className="space-y-0">
          {(tripData.days || []).map((day: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} min-h-[550px] group`}
            >
              {/* Content Side */}
              <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center bg-[#0A1F1C] relative overflow-hidden">
                <div className={`absolute top-0 ${i % 2 === 0 ? "right-0" : "left-0"} h-full w-[1px] bg-white/5`} />
                
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <span className="text-[#e6c419] font-mono text-[0.7rem] font-bold uppercase tracking-[0.4em]">
                         Day {i + 1}
                       </span>
                       <div className="h-px w-12 bg-[#e6c419]/30" />
                       <span className="text-stone-500 font-mono text-[0.7rem] uppercase tracking-widest">{day.theme}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif text-white leading-tight">{day.location}</h3>
                  </div>

                  <div className="space-y-6">
                    {(day.activities || []).map((act: string, j: number) => (
                      <div key={j} className="flex gap-4 items-start group/item">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#e6c419] group-hover/item:scale-150 transition-transform shadow-[0_0_8px_#e6c419]" />
                        <p className="text-stone-400 text-xl leading-relaxed font-light">{act}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#e6c419]/60 mb-2">
                        <Bed size={16} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Base</span>
                      </div>
                      <p className="text-white font-medium">{day.accommodation}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#e6c419]/60 mb-2">
                        <Utensils size={16} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Fuel</span>
                      </div>
                      <p className="text-white font-medium">{day.food}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Side */}
              <div className="md:w-1/2 min-h-[400px] relative">
                <DayImage 
                    keyword={trip.image_keywords?.days?.[i]} 
                    dayIndex={i} 
                    country={trip.country} 
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — PACKING TIPS */}
      <section className="bg-[#0D2623] py-32 border-y border-white/10">
        <div className="container mx-auto px-6 max-w-6xl">
           <div className="text-center mb-20">
              <h2 className="text-3xl font-serif text-[#e6c419] tracking-[0.3em] uppercase mb-4">Precision Packing</h2>
              <p className="text-stone-500 font-mono text-xs tracking-widest">Essential equipment for the terrain</p>
           </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(tripData.packing_tips || []).map((tip: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#142A27]/50 backdrop-blur-sm border border-white/5 p-8 rounded-2xl flex flex-col gap-6 hover:border-[#e6c419]/40 transition-all group"
              >
                <div className="bg-[#e6c419] text-[#0A1F1C] w-10 h-10 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-stone-300 text-lg leading-relaxed font-light">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — REVIEWS */}
      <section className="py-32 bg-[#0A1F1C]">
        <div className="container mx-auto px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="text-center md:text-left">
                <p className="text-[#e6c419] font-mono text-xs uppercase tracking-[0.3em] mb-4">Verification</p>
                <h2 className="text-5xl md:text-6xl font-serif text-white italic tracking-tighter">Field Reports</h2>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-4">
                 <div className="flex items-center gap-3">
                    <div className="flex text-[#e6c419]">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} size={24} fill={i < Math.floor(trip.avg_rating || 4.8) ? "currentColor" : "none"} />
                       ))}
                    </div>
                    <span className="text-2xl font-serif text-white">{trip.avg_rating || 4.8}</span>
                 </div>
                 <p className="text-stone-500 text-xs font-mono uppercase tracking-widest">Based on latest transmissions</p>
              </div>
            </div>

            <div className="space-y-24 mb-32">
              {allReviews.map((rev, i) => (
                <motion.div
                  key={rev.id || i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-start`}
                >
                  <ReviewMoodImage 
                    keyword={trip.image_keywords?.intent_mood} 
                    index={i} 
                  />
                  <div className="flex-grow space-y-6">
                    <div className="flex justify-between items-baseline">
                        <h4 className="text-2xl font-serif text-white italic">{rev.reviewer_name}</h4>
                        <span className="text-stone-600 font-mono text-[10px] uppercase tracking-widest">
                           {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent Deployment"}
                        </span>
                    </div>
                    <p className="text-stone-400 text-2xl font-light italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <div className="flex gap-1 text-[#e6c419]/40">
                       {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={j < rev.rating ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Simple Floating Trigger for Form */}
            {!isReviewFormOpen ? (
               <div className="text-center">
                  <Button 
                    onClick={() => setIsReviewFormOpen(true)}
                    className="bg-[#e6c419] text-[#0A1F1C] px-12 py-8 rounded-full font-bold uppercase tracking-widest text-sm shadow-2xl shadow-[#e6c419]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Transmit Your Experience
                  </Button>
               </div>
            ) : (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#142A27] p-12 rounded-[3rem] border border-[#e6c419]/20 relative overflow-hidden"
                >
                  <form onSubmit={handleSubmitReview} className="space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                       <h3 className="text-3xl font-serif text-white italic">Mission Debrief</h3>
                       <div className="flex gap-2">
                          {[1,2,3,4,5].map(s => (
                            <button 
                              key={s} 
                              type="button" 
                              onClick={() => setReviewRating(s)}
                              className="transition-transform active:scale-90"
                            >
                              <Star size={32} fill={s <= reviewRating ? "#e6c419" : "none"} className={s <= reviewRating ? "text-[#e6c419]" : "text-stone-700"} />
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="The emotional height of the expedition was..."
                      className="w-full bg-[#0A1F1C] border border-white/5 rounded-2xl px-8 py-6 text-xl font-light italic text-white focus:outline-none focus:border-[#e6c419] min-h-[180px] transition-all"
                    />

                    <div className="flex flex-col md:flex-row gap-4">
                       <Button
                         type="submit"
                         disabled={isSubmittingReview}
                         className="flex-grow bg-[#e6c419] text-[#0A1F1C] py-8 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-[#ffe34d]"
                       >
                         {isSubmittingReview ? "Processing Data..." : "Finalize Report"}
                       </Button>
                       <Button 
                         variant="ghost" 
                         onClick={() => setIsReviewFormOpen(false)}
                         className="px-10 h-auto rounded-2xl text-stone-500 hover:text-white"
                       >
                         Abort
                       </Button>
                    </div>
                  </form>
                </motion.div>
            )}
        </div>
      </section>

      {/* SECTION 6 — ACTION BAR (Sticky) */}
      <section className="sticky bottom-0 z-50 bg-[#0A1F1C]/80 backdrop-blur-2xl border-t border-white/5 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="hidden md:block">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">Status</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#e6c419] animate-pulse" />
                 <span className="text-white font-mono text-xs uppercase tracking-widest">Active Plan Ready</span>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {user?.id === trip.user_id && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-[#e6c419] text-[#e6c419] hover:bg-[#e6c419] hover:text-[#0A1F1C] font-bold uppercase tracking-widest px-12 h-16 rounded-full transition-all"
              >
                <Edit3 className="mr-3" size={18} />
                Refine Strategy
              </Button>
            )}
            <Button
              onClick={handleBook}
              disabled={isBooking}
              className="bg-stone-100 text-[#0A1F1C] hover:bg-white font-bold uppercase tracking-widest px-12 h-16 rounded-full transition-all w-full sm:w-auto"
            >
              {isBooking ? "Securing..." : "Book This Trip"}
            </Button>
            <Button
              onClick={() => {
                sessionStorage.setItem("suggested_intent", JSON.stringify({
                  intent: trip.intent,
                  intent_group: trip.intent_group
                }));
                navigate("/planner");
              }}
              className="bg-[#e6c419] text-[#0A1F1C] hover:bg-[#ffe34d] font-black uppercase tracking-[0.2em] px-12 h-16 rounded-full shadow-[0_20px_40px_rgba(230,196,25,0.2)] transition-all hover:scale-105 w-full sm:w-auto"
            >
              Initiate New Venture
              <ArrowRight className="ml-3" size={20} />
            </Button>
          </div>
        </div>
      </section>

      <RefineTripModal 
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onSubmit={handleRefineSubmit}
        isSubmitting={isRefining}
      />
      <Footer />
    </div>
  );
};

export default TripDetail;
