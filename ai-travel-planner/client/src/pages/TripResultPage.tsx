import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, BedDouble, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
interface TripDay {
  day: number;
  location: string;
  theme: string;
  activities: string[];
  accommodation: string;
  food: string;
}
interface TripResult {
  title: string;
  destination: string;
  country: string;
  duration_days: number;
  best_season: string;
  summary: string;
  days: TripDay[];
  packing_tips: string[];
  estimated_budget: string;
}
const TripResultPage = () => {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripResult | null>(null);
  useEffect(() => {
    const raw = sessionStorage.getItem("trip_result");
    if (!raw) {
      navigate("/planner");
      return;
    }
    try {
      setTrip(JSON.parse(raw));
    } catch {
      navigate("/planner");
    }
  }, [navigate]);
  const handlePlanAnother = () => {
    sessionStorage.removeItem("trip_result");
    sessionStorage.removeItem("trip_session_id");
    sessionStorage.removeItem("travel_intent");
    navigate("/planner");
  };
  const handleStartOver = () => {
    sessionStorage.clear();
    navigate("/");
  };
  if (!trip) return null;
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background pt-20 pb-8"
    >
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-6 py-16 text-center"
      >
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
          {trip.title}
        </h1>
        <p className="text-lg text-foreground/80 mb-2">
          {trip.destination}, {trip.country} &middot; {trip.duration_days} days
        </p>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="h-4 w-4 text-primary" />
          {trip.best_season}
        </p>
        <p className="max-w-2xl mx-auto text-muted-foreground italic text-lg leading-relaxed">
          {trip.summary}
        </p>
      </motion.section>
      {/* Itinerary */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-10 text-center">
          Your Itinerary
        </h2>
        <div className="relative max-w-2xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-primary/30" />
          <div className="space-y-8">
            {trip.days.map((day, i) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative pl-12 md:pl-16"
              >
                {/* Dot */}
                <div className="absolute left-4 md:left-6 -translate-x-1/2 top-3 z-10">
                  <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                </div>
                <div className="glass rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-primary">
                      Day {day.day}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {day.location}
                    </span>
                    <Badge variant="outline" className="text-primary border-primary/40 text-[0.65rem]">
                      {day.theme}
                    </Badge>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {day.activities.map((a, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-3.5 w-3.5 text-primary" />
                      {day.accommodation}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                      {day.food}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Packing Tips */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-8 text-center">
          What to Pack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {trip.packing_tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="glass rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{tip}</span>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Budget */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-8 text-center">
          Estimated Budget
        </h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto border border-primary/40 rounded-lg p-6 text-center"
        >
          <p className="text-lg font-semibold text-foreground">{trip.estimated_budget}</p>
        </motion.div>
      </section>
      {/* Actions */}
      <section className="container mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={handlePlanAnother}
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Plan Another Trip
        </Button>
        <Button
          onClick={handleStartOver}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Start Over
        </Button>
      </section>
      <Footer />
    </motion.main>
  );
};
export default TripResultPage;