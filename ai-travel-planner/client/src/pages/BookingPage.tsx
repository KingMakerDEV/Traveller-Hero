import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Hotel, Calendar, Search, ArrowLeft, Star,
  CreditCard, ShieldCheck, MapPin, Sparkles,
  ExternalLink, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/useTripStore";
import { useAuthStore } from "@/store/useAuthStore";
import Footer from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const BookingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selectedTrip, isLoading, fetchTripBySlug } = useTripStore();
  const { token } = useAuthStore();

  const [isSearching, setIsSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const adults = 1;

  useEffect(() => {
    if (slug) {
      fetchTripBySlug(slug);
    }
  }, [slug, fetchTripBySlug]);

  // Auto-search once trip is loaded
  useEffect(() => {
    if (selectedTrip && token && !searchComplete && !isSearching) {
      searchBookings();
    }
  }, [selectedTrip, token, searchComplete, isSearching]);

  const tripData = useMemo(() => {
    if (!selectedTrip) return null;
    return (selectedTrip as any).trip_data || (selectedTrip as any).context || selectedTrip;
  }, [selectedTrip]);

  const searchBookings = async () => {
    if (!selectedTrip || !token) return;

    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/booking/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: selectedTrip.destination,
          country: selectedTrip.country,
          best_season: tripData?.best_season || "",
          passengers: adults
        })
      });

      const data = await response.json();
      console.log("Booking results:", data);

      if (response.ok) {
        setResults(data);
        setSearchComplete(true);
      } else {
        setError(data.error || "Search failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading || (!selectedTrip && slug)) {
    return (
      <div className="min-h-screen bg-[#0A1F1C] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#e6c419] animate-spin" />
      </div>
    );
  }

  if (!selectedTrip) {
    return (
      <div className="min-h-screen bg-[#0A1F1C] flex flex-col items-center justify-center text-white px-6">
        <h2 className="text-3xl font-serif italic mb-4">Expedition Data Lost</h2>
        <Button onClick={() => navigate("/")} className="bg-[#e6c419] text-[#0A1F1C]">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#0A1F1C] text-stone-200 min-h-screen pb-20">

      {/* HEADER */}
      <header className="pt-24 pb-12 px-6 container mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-400 hover:text-[#e6c419] transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-xs uppercase tracking-widest">Back to Mission Details</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/5 pb-12">
          <div className="max-w-2xl">
            <p className="text-[#e6c419] font-mono text-xs uppercase tracking-[0.4em] mb-4">
              Securing Logistics
            </p>
            <h1 className="text-5xl md:text-6xl font-serif text-white italic tracking-tighter leading-[0.9]">
              Booking Terminal: <br />
              <span className="text-[#e6c419]">{selectedTrip.destination}</span>
            </h1>
          </div>

          <div className="flex bg-[#142A27] p-2 rounded-2xl border border-white/5 shadow-2xl">
            <div className="px-6 py-3 border-r border-white/5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Passage</p>
              <p className="text-white font-bold">{adults} Adult</p>
            </div>
            <div className="px-6 py-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Season</p>
              <p className="text-[#e6c419] font-bold">{tripData?.best_season || "Optimal Window"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 max-w-6xl">
        <AnimatePresence mode="wait">

          {/* SEARCHING STATE */}
          {isSearching && (
            <motion.section
              key="searching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-20 flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 rounded-full border border-[#e6c419]/20 flex items-center justify-center"
                >
                  <div className="w-40 h-40 rounded-full border border-[#e6c419]/40 border-t-[#e6c419]" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search size={40} className="text-[#e6c419] animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-serif text-white italic">
                  Scanning Global Databases...
                </h2>
                <p className="text-stone-400 max-w-md mx-auto font-light italic">
                  Finding real flights from Delhi, Mumbai and Bangalore to{" "}
                  {selectedTrip.destination}.
                </p>
              </div>
            </motion.section>
          )}

          {/* ERROR STATE */}
          {!isSearching && error && (
            <motion.section
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center gap-6"
            >
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
                <p className="text-rose-300 mb-6">{error}</p>
                <Button
                  onClick={searchBookings}
                  className="bg-[#e6c419] text-[#0A1F1C] font-bold uppercase tracking-widest rounded-full px-8"
                >
                  Try Again
                </Button>
              </div>
            </motion.section>
          )}

          {/* RESULTS STATE */}
          {!isSearching && results && (
            <motion.section
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-16 py-12"
            >

              {/* FLIGHTS SECTION */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Plane className="text-[#e6c419]" size={28} />
                  <h3 className="text-3xl font-serif text-white italic">Aerial Transmissions</h3>
                  <div className="h-px flex-grow bg-white/5" />
                  {results.google_flights_fallback && (
                    <a
                      href={results.google_flights_fallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-stone-500 hover:text-[#e6c419] transition-colors text-xs font-mono uppercase tracking-widest"
                    >
                      All Flights <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Departure date info */}
                {results.departure_date && (
                  <p className="text-stone-500 font-mono text-xs">
                    Around{" "}
                    {new Date(results.departure_date).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric"
                    })}{" "}
                    · {adults} Adult · Economy Class
                  </p>
                )}

                {results.flights_available && results.flights?.length > 0 ? (
                  <div className="grid gap-6">
                    {results.flights.map((flight: any, i: number) => (
                      <motion.div
                        key={flight.offer_id || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#142A27] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-[#e6c419]/30 transition-all group shadow-2xl"
                      >
                        {/* Airline */}
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="w-16 h-16 bg-[#0A1F1C] rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                            {flight.airline_logo ? (
                              <img
                                src={flight.airline_logo}
                                alt={flight.airline}
                                className="w-12 h-12 object-contain"
                              />
                            ) : (
                              <Plane size={28} className="text-[#e6c419]" />
                            )}
                          </div>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500 mb-1">
                              {flight.fare_brand || "Economy"}
                            </p>
                            <h4 className="text-xl font-serif text-white italic">
                              {flight.airline}
                            </h4>
                            <p className="text-stone-600 text-xs font-mono">
                              {flight.flight_number}
                            </p>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-8 flex-grow justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">{flight.origin_iata}</p>
                            <p className="text-stone-500 text-xs">{flight.origin_city}</p>
                            <p className="text-stone-400 text-xs font-mono">
                              {flight.departing_at
                                ? new Date(flight.departing_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1 flex-1 max-w-[180px]">
                            <p className="text-[10px] text-[#e6c419] uppercase tracking-widest font-mono">
                              {flight.duration}
                            </p>
                            <div className="w-full h-px bg-white/10 relative">
                              <div className="absolute top-1/2 left-0 w-1.5 h-1.5 rounded-full bg-white/20 -translate-y-1/2" />
                              <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-[#e6c419] -translate-y-1/2 shadow-[0_0_10px_#e6c419]" />
                            </div>
                            <p className="text-stone-600 text-[10px] uppercase tracking-widest">
                              {flight.stops}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">
                              {flight.destination_iata}
                            </p>
                            <p className="text-stone-500 text-xs">{flight.destination_city}</p>
                            <p className="text-stone-400 text-xs font-mono">
                              {flight.arriving_at
                                ? new Date(flight.arriving_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                : ""}
                            </p>
                          </div>
                        </div>

                        {/* Price + Booking CTA */}
                        <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                          <p className="text-stone-500 text-[10px] uppercase tracking-widest mb-1">
                            Per Operative
                          </p>
                          <p className="text-3xl font-bold text-[#e6c419] mb-1">
                            {flight.price_inr}
                          </p>
                          {flight.baggage?.length > 0 && (
                            <p className="text-stone-600 text-[10px] font-mono mb-4">
                              {flight.baggage.join(" · ")}
                            </p>
                          )}

                          <a
                            href={flight.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full md:w-auto bg-[#e6c419] text-[#0A1F1C] px-8 py-6 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all hover:bg-[#ffe34d]">
                              Secure Seat
                              <ExternalLink size={12} className="ml-2" />
                            </Button>
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  /* No direct flights — show Google Flights fallback */
                  <div className="bg-[#142A27] border border-white/5 rounded-2xl p-8 text-center">
                    <Plane size={32} className="text-stone-600 mx-auto mb-4" />
                    <p className="text-stone-400 mb-2">
                      Direct flight search unavailable for {selectedTrip.destination}.
                    </p>
                    <p className="text-stone-500 text-sm mb-6">
                      Search manually on Google Flights for the best current options.
                    </p>
                    {results.google_flights_fallback && (
                      <a
                        href={results.google_flights_fallback}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-[#e6c419] text-[#0A1F1C] font-bold uppercase tracking-widest rounded-full px-8">
                          Search Google Flights
                          <ExternalLink size={12} className="ml-2" />
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* HOTELS SECTION */}
              {results.hotels && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <Hotel className="text-[#e6c419]" size={28} />
                    <h3 className="text-3xl font-serif text-white italic">
                      Sanctuary Provisions
                    </h3>
                    <div className="h-px flex-grow bg-white/5" />
                  </div>

                  <p className="text-stone-500 font-mono text-xs">
                    {results.hotels.checkin} &rarr; {results.hotels.checkout} · 7 nights · {selectedTrip.destination}, {selectedTrip.country}
                  </p>

                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      {
                        name: "Booking.com",
                        url: results.hotels.booking_com,
                        description:
                          "Best price guarantee with free cancellation on most rooms",
                        badge: "Most Popular",
                        icon: "🏨"
                      },
                      {
                        name: "Hotels.com",
                        url: results.hotels.hotels_com,
                        description:
                          "Earn rewards on every stay. 10 nights free with loyalty program",
                        badge: "Rewards",
                        icon: "⭐"
                      },
                      {
                        name: "Airbnb",
                        url: results.hotels.airbnb,
                        description:
                          "Unique local stays for immersive travel experiences",
                        badge: "Unique Stays",
                        icon: "🏡"
                      }
                    ].map((platform, i) => (
                      <motion.div
                        key={platform.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-[#142A27] border border-white/5 rounded-3xl p-8 flex flex-col gap-5 hover:border-[#e6c419]/30 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-2xl">{platform.icon}</span>
                            <h4 className="text-xl font-serif text-white italic mt-2">
                              {platform.name}
                            </h4>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6c419] border border-[#e6c419]/30 px-2 py-0.5 rounded-full">
                              {platform.badge}
                            </span>
                          </div>
                        </div>

                        <p className="text-stone-400 text-sm leading-relaxed flex-grow">
                          {platform.description}
                        </p>

                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full bg-white/5 border border-white/10 text-white hover:bg-[#e6c419] hover:text-[#0A1F1C] rounded-2xl font-bold uppercase tracking-widest text-xs h-12 transition-all">
                            Search {platform.name}
                            <ExternalLink size={12} className="ml-2" />
                          </Button>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRUST BADGES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-t border-white/5">
                <div className="flex items-center gap-4 text-stone-400">
                  <ShieldCheck size={32} className="text-[#e6c419]" />
                  <p className="text-xs uppercase tracking-[0.2em] font-light">
                    Real-time flight data
                  </p>
                </div>
                <div className="flex items-center gap-4 text-stone-400">
                  <CreditCard size={32} className="text-[#e6c419]" />
                  <p className="text-xs uppercase tracking-[0.2em] font-light">
                    Direct booking on provider site
                  </p>
                </div>
                <div className="flex items-center gap-4 text-stone-400">
                  <Sparkles size={32} className="text-[#e6c419]" />
                  <p className="text-xs uppercase tracking-[0.2em] font-light">
                    Best season matched dates
                  </p>
                </div>
              </div>

              {/* REFRESH */}
              <div className="text-center pt-4 border-t border-white/5">
                <p className="text-stone-500 text-sm mb-4">
                  Prices update in real time. Search again for latest availability.
                </p>
                <Button
                  onClick={() => {
                    setResults(null);
                    setSearchComplete(false);
                    searchBookings();
                  }}
                  variant="outline"
                  className="border-white/10 text-stone-400 hover:border-[#e6c419] hover:text-[#e6c419] rounded-full px-8"
                >
                  Refresh Results
                </Button>
              </div>

            </motion.section>
          )}

        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;