import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { TripState } from "@/types/trip";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TripCardProps {
  trip: TripState;
  index: number;
}

const TripCard = ({ trip, index }: TripCardProps) => {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  return (
    <motion.article
      initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={prefersReduced ? {} : { y: -4 }}
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="group cursor-pointer rounded-lg glass overflow-hidden"
      role="button"
      tabIndex={0}
      aria-label={`View ${trip.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/trip/${trip.id}`);
      }}
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={trip.heroImage}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="text-xs font-mono uppercase tracking-widest text-primary">
            {trip.country}
          </span>
          <h3 className="text-xl font-bold text-foreground">{trip.title}</h3>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{trip.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {trip.cities.length} cities
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {trip.duration}
          </span>
          <span className="flex items-center gap-1 text-accent font-medium">
            <DollarSign className="h-3.5 w-3.5" />
            From ${trip.priceEstimate.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default TripCard;
