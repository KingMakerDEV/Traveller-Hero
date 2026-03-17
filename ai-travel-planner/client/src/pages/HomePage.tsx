import { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, HeadphonesIcon, Globe } from "lucide-react";
import Hero from "@/components/Hero";
import IntentCard from "@/components/IntentCard";
import Footer from "@/components/Footer";
import { useTripStore } from "@/store/useTripStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const features = [
  { icon: Shield, title: "Trusted Agency", desc: "15+ years of crafting unforgettable journeys worldwide." },
  { icon: HeadphonesIcon, title: "24/7 Support", desc: "Our travel experts are always a message away." },
  { icon: Globe, title: "One-Stop Partner", desc: "Flights, hotels, experiences — all handled for you." },
];

const wonderImages = [
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", label: "Norwegian Fjords" },
  { src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80", label: "Mount Fuji" },
  { src: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&q=80", label: "Northern Lights" },
  { src: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&q=80", label: "Machu Picchu" },
];

const HomePage = () => {
  const { trips, fetchMockTrips } = useTripStore();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (trips.length === 0) fetchMockTrips();
  }, [trips.length, fetchMockTrips]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Hero />

      {/* Intent Cards */}
      <section className="container mx-auto px-6 py-20" id="about">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Popular Destinations</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Where Will You Go?</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trips.map((trip, i) => (
              <IntentCard
              key={trip.id}
              title={trip.title}
              description={trip.description || "Explore this amazing destination"}
              group={trip.country}
              image={trip.heroImage}
              index={i}
              onSelect={() => window.location.href = `/trip/${trip.id}`}
            />
          ))}
        </div>
      </section>

      {/* Wonders of Nature */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Gallery</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Wonders of Nature</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {wonderImages.map((img, i) => (
            <motion.div
              key={img.label}
              initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-lg aspect-[3/4] group"
            >
              <img
                src={img.src}
                alt={img.label}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <p className="absolute bottom-4 left-4 text-sm font-medium text-foreground">{img.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Why Us</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Why Choose TravellerHero</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-lg p-8 text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </motion.main>
  );
};

export default HomePage;


