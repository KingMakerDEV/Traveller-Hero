import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, HeadphonesIcon, Globe, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { useTripStore } from "@/store/useTripStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Shield, title: "Trusted Agency", desc: "15+ years of crafting unforgettable journeys worldwide." },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "Our travel experts are always a message away." },
  { icon: Globe, title: "One-Stop Partner", desc: "Flights, hotels, experiences — all handled for you." },
];

const reviews = [
  { id: 1, name: "Elena R.", time: "2 days ago", rating: 5, text: "The Amalfi Coast itinerary was pure magic. Every restaurant recommendation was spot on!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", highlightImage: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80" },
  { id: 2, name: "Marco S.", time: "1 week ago", rating: 5, text: "Kyoto was a dream come true. The pace of the tour was perfect for getting those sunrise shots.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", highlightImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80" },
  { id: 3, name: "Sarah L.", time: "2 weeks ago", rating: 5, text: "Santorini was breathtaking. The views from our villa were like a postcard!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", highlightImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80" },
];

const TripCardSkeleton = () => (
  <div className="rounded-xl bg-[#142A27] border border-white/5 overflow-hidden animate-pulse">
    <div className="h-56 bg-white/5" />
    <div className="p-5 space-y-4">
      <div className="h-4 w-1/3 bg-white/5 rounded" />
      <div className="h-6 w-3/4 bg-white/5 rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-5/6 bg-white/5 rounded" />
      </div>
      <div className="flex gap-4 pt-2">
        <div className="h-3 w-16 bg-white/5 rounded" />
        <div className="h-3 w-16 bg-white/5 rounded" />
        <div className="h-3 w-16 bg-white/5 rounded" />
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const { trips, fetchPopularTrips, isLoading } = useTripStore();
  const prefersReduced = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPopularTrips();
  }, [fetchPopularTrips]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0A1F1C] text-stone-200"
    >
      <Hero />

      {/* Popular Trips Grid */}
      <section className="container mx-auto px-6 py-20" id="popular">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-[#e6c419] mb-3">Trending</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Most Popular Trip Plans on Our Platform</h2>
          <p className="text-stone-400 max-w-2xl mx-auto">These are the most booked trips by users on our site</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))
          ) : Array.isArray(trips) && trips.length > 0 ? (
            trips.map((trip, i) => (
              <TripCard key={trip.id || trip.slug || i} trip={trip} index={i} showBudget={false} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#142A27] rounded-xl border border-dashed border-white/10">
              <p className="text-stone-400">No popular trips available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* User Reviews Section */}
      <section className="bg-[#0D2421] py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-widest text-[#e6c419] mb-3">Testimonials</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What Our Travelers Say</h2>
              <p className="text-stone-400 text-lg">Real stories from real travelers who planned their perfect getaway with us.</p>
            </div>
            <div className="flex gap-4">
              <button className="p-4 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-white">
                <ChevronLeft size={24} />
              </button>
              <button className="p-4 border border-white/10 rounded-full hover:bg-white/5 transition-colors text-white">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#142A27] p-8 rounded-2xl border border-white/5 shadow-xl flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <img src={review.avatar} alt={review.name} className="w-14 h-14 rounded-full border-2 border-[#e6c419] object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-lg">{review.name}</h4>
                      <p className="text-xs text-stone-500 font-mono tracking-wider">{review.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="text-[#e6c419] fill-[#e6c419]" />
                    ))}
                  </div>
                </div>
                <p className="italic text-stone-300 mb-8 font-light leading-relaxed text-lg flex-grow">
                  "{review.text}"
                </p>
                <div className="h-48 rounded-xl overflow-hidden relative group">
                  <img 
                    src={review.highlightImage} 
                    alt="Trip highlight" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-6 py-24">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-[#e6c419] mb-3">Superiority</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Why Choose TravellerHero</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-[#142A27] border border-white/5 rounded-2xl p-10 text-center hover:border-[#e6c419]/30 transition-colors shadow-lg"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#e6c419]/10 text-[#e6c419] mb-6">
                <f.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-stone-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </motion.main>
  );
};

export default HomePage;


