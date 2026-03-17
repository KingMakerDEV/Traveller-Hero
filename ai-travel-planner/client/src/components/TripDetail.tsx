import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, Users, Plane, Bus, Hotel } from "lucide-react";
import type { TripState } from "@/types/trip";
import Timeline from "@/components/Timeline";
import BookingForm from "@/components/BookingForm";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TripDetailProps {
  trip: TripState;
}

const includedIcons: Record<string, React.ReactNode> = {
  "Professional Guide": <Users className="h-5 w-5" />,
  "Expert Guide": <Users className="h-5 w-5" />,
  "Local Guide": <Users className="h-5 w-5" />,
  "Domestic Flights": <Plane className="h-5 w-5" />,
  "All Transfers": <Bus className="h-5 w-5" />,
  "4-Star Hotels": <Hotel className="h-5 w-5" />,
  "Boutique Hotels": <Hotel className="h-5 w-5" />,
  "3-Star Hotels": <Hotel className="h-5 w-5" />,
  "Boutique Lodges": <Hotel className="h-5 w-5" />,
};

const TripDetail = ({ trip }: TripDetailProps) => {
  const prefersReduced = useReducedMotion();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src={trip.heroImage}
          alt={trip.title}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-mono uppercase tracking-widest text-primary mb-2"
          >
            {trip.country}
          </motion.p>
          <motion.h1
            initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-4"
          >
            {trip.title}
          </motion.h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {trip.cities.length} Cities
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {trip.duration}
            </span>
            <span className="flex items-center gap-1 text-accent font-semibold">
              <DollarSign className="h-4 w-4" /> From ${trip.priceEstimate.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-16 lg:grid-cols-3">
          {/* Main content (2/3) */}
          <div className="lg:col-span-2 space-y-16">
            {/* About */}
            <motion.section
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">About the Tour</h2>
              <p className="text-muted-foreground leading-relaxed">{trip.description}</p>

              {/* City route */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                {trip.cities.map((city, i) => (
                  <div key={city.name} className="flex items-center gap-3">
                    <div className="glass rounded-full px-4 py-2 text-sm font-medium text-foreground">
                      {city.name}
                      <span className="ml-2 text-xs text-muted-foreground">{city.days}d</span>
                    </div>
                    {i < trip.cities.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Itinerary Timeline */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Day-by-Day Itinerary</h2>
              <Timeline itinerary={trip.itinerary} />
            </section>

            {/* Highlights Grid */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Highlights</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trip.cities.flatMap((city) =>
                  city.images.map((img, j) => (
                    <motion.div
                      key={`${city.name}-${j}`}
                      initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: j * 0.1 }}
                      className="relative overflow-hidden rounded-lg aspect-square"
                    >
                      <img
                        src={img}
                        alt={`${city.name} highlight`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                      <p className="absolute bottom-3 left-3 text-sm font-medium text-foreground">
                        {city.name}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* What's Included */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">What's Included</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trip.included.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="glass rounded-lg p-4 flex items-center gap-3"
                  >
                    <div className="text-primary">
                      {includedIcons[item] || <MapPin className="h-5 w-5" />}
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-8">
            <BookingForm />

            {/* Wildcards */}
            {trip.wildcards.length > 0 && (
              <div className="glass rounded-lg p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Add-on Experiences</h3>
                <div className="space-y-3">
                  {trip.wildcards.map((wc) => (
                    <div key={wc.id} className="p-3 rounded-md bg-secondary/50 border border-border">
                      <p className="text-sm font-medium text-foreground">{wc.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{wc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
