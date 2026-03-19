import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Star } from "lucide-react";
import type { TripState } from "@/types/trip";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUnsplashImages } from "@/hooks/useUnsplashImages";
import { formatBudget } from "@/lib/utils";

interface TripCardProps {
  trip: TripState;
  index: number;
  imageKeyword?: string;
  showBudget?: boolean;
}

const TripCard = ({ trip, index, imageKeyword, showBudget = true }: TripCardProps) => {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  
  // Use provided keyword, or trip's card keyword, or fallback to destination + country
  const keyword = imageKeyword || trip.image_keywords?.card || `${trip.title} travel destination`;
  const { images } = useUnsplashImages(keyword, 1);
  const imageUrl = images[0] || trip.heroImage;

  return (
    <motion.article
      initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={prefersReduced ? {} : { y: -4 }}
      onClick={() => navigate(`/trip/${trip.slug || trip.id}`)}
      className="group cursor-pointer rounded-lg glass overflow-hidden flex flex-col h-full"
      role="button"
      tabIndex={0}
      aria-label={`View ${trip.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/trip/${trip.slug || trip.id}`);
      }}
    >
      <div className="relative h-56 overflow-hidden bg-stone-800">
        <img
          src={imageUrl}
          alt={trip.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 text-[#e6c419]">
          <Star size={12} className="fill-[#e6c419]" />
          <span className="text-xs font-bold">{trip.avg_rating || trip.rating || "4.5"}</span>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[#e6c419]">
            {trip.country}
          </span>
          <h3 className="text-xl font-bold text-white line-clamp-1">{trip.title}</h3>
        </div>
      </div>

      <div className="p-5 space-y-4 flex flex-col flex-grow">
        <p className="text-sm text-stone-400 line-clamp-2 flex-grow">{trip.description}</p>
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {trip.duration || trip.duration_days + " days"}
            </span>
          </div>
          {showBudget && (
            <span className="text-[#e6c419] font-bold">
              {formatBudget(trip.estimated_budget)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default TripCard;
