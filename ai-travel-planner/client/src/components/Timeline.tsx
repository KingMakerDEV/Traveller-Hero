import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ItineraryItem } from "@/types/trip";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TimelineProps {
  itinerary: ItineraryItem[];
}

const Timeline = ({ itinerary }: TimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative py-12">
      {/* Vertical track */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-border md:left-1/2" />

      {/* Animated progress line */}
      {!prefersReduced && (
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-6 top-0 w-px bg-primary md:left-1/2"
        />
      )}

      {/* Day cards */}
      <div className="space-y-12">
        {itinerary.map((item, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div
              key={item.day}
              initial={prefersReduced ? {} : { opacity: 0, x: isLeft ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`relative flex items-start gap-6 md:gap-0 ${
                isLeft ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Dot */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 mt-2 z-10">
                <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              </div>

              {/* Content */}
              <div
                className={`ml-14 md:ml-0 md:w-1/2 ${
                  isLeft ? "md:pr-12 md:text-right" : "md:pl-12"
                }`}
              >
                <span className="inline-block text-xs font-mono uppercase tracking-widest text-primary mb-2">
                  Day {item.day}
                </span>
                <div className="glass rounded-lg p-5">
                  <ul className="space-y-2">
                    {item.activities.map((activity, j) => (
                      <li key={j} className="text-sm text-muted-foreground">
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
