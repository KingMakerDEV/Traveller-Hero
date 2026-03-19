import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useUnsplashImages } from "@/hooks/useUnsplashImages";

interface IntentCardProps {
  title: string;
  description: string;
  image: string;
  group: string;
  index: number;
  onSelect: () => void;
  imageKeyword?: string;
}

const IntentCard = ({ title, description, image, group, index, onSelect, imageKeyword }: IntentCardProps) => {
  const prefersReduced = useReducedMotion();
  const { images } = useUnsplashImages(imageKeyword || "", 1);
  const finalImage = (imageKeyword && images[0]) ? images[0] : image;

  return (
    <motion.article
      initial={prefersReduced ? {} : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={prefersReduced ? {} : { y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group cursor-pointer overflow-hidden rounded-lg glass bg-stone-800"
      role="button"
      tabIndex={0}
      aria-label={`Select intent: ${title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={finalImage}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
             (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
            {group}
          </p>
          <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </motion.article>
  );
};

export default IntentCard;
