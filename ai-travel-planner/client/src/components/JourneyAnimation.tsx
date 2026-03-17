import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ─── SVG Silhouettes ─── */
const SittingFigure = ({ opacity }: { opacity: any }) => (
  <motion.svg
    style={{ opacity }}
    viewBox="0 0 200 260"
    className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-32 md:w-44"
    fill="black"
    aria-hidden="true"
  >
    {/* Chair */}
    <rect x="55" y="180" width="90" height="8" rx="2" />
    <rect x="60" y="120" width="8" height="68" />
    <rect x="132" y="160" width="8" height="28" />
    <rect x="60" y="120" width="80" height="8" rx="2" />
    {/* Desk */}
    <rect x="120" y="140" width="70" height="6" rx="2" />
    <rect x="130" y="146" width="50" height="4" />
    {/* Laptop on desk */}
    <rect x="140" y="118" width="40" height="22" rx="2" />
    <rect x="135" y="138" width="50" height="4" rx="1" />
    {/* Body sitting */}
    <circle cx="100" cy="108" r="16" />
    <rect x="88" y="124" width="24" height="30" rx="6" />
    {/* Arms reaching to laptop */}
    <rect x="112" y="132" width="30" height="6" rx="3" />
    <rect x="76" y="136" width="12" height="6" rx="3" />
    {/* Legs */}
    <rect x="88" y="154" width="10" height="28" rx="4" />
    <rect x="104" y="154" width="10" height="28" rx="4" />
    {/* Feet */}
    <rect x="84" y="180" width="16" height="6" rx="3" />
    <rect x="102" y="180" width="16" height="6" rx="3" />
    {/* Chair legs */}
    <rect x="56" y="186" width="6" height="24" />
    <rect x="138" y="186" width="6" height="24" />
  </motion.svg>
);

const StandingFigure = ({ opacity, y }: { opacity: any; y?: any }) => (
  <motion.svg
    style={{ opacity, y }}
    viewBox="0 0 100 280"
    className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-20 md:w-28"
    fill="black"
    aria-hidden="true"
  >
    <circle cx="50" cy="30" r="18" />
    <rect x="36" y="48" width="28" height="50" rx="8" />
    {/* Arms down */}
    <rect x="20" y="52" width="16" height="8" rx="4" />
    <rect x="64" y="52" width="16" height="8" rx="4" />
    <rect x="16" y="56" width="8" height="30" rx="4" />
    <rect x="76" y="56" width="8" height="30" rx="4" />
    {/* Legs */}
    <rect x="38" y="98" width="12" height="55" rx="5" />
    <rect x="54" y="98" width="12" height="55" rx="5" />
    {/* Feet */}
    <rect x="34" y="150" width="18" height="8" rx="4" />
    <rect x="52" y="150" width="18" height="8" rx="4" />
  </motion.svg>
);

const SummitFigure = ({ y }: { y: any }) => (
  <motion.svg
    style={{ y }}
    viewBox="0 0 120 200"
    className="absolute bottom-[38%] md:bottom-[42%] left-1/2 -translate-x-1/2 w-20 md:w-28"
    fill="black"
    aria-hidden="true"
  >
    <circle cx="60" cy="30" r="18" />
    <rect x="46" y="48" width="28" height="50" rx="8" />
    {/* Arms wide */}
    <rect x="0" y="52" width="46" height="8" rx="4" />
    <rect x="74" y="52" width="46" height="8" rx="4" />
    {/* Legs */}
    <rect x="48" y="98" width="12" height="50" rx="5" />
    <rect x="60" y="98" width="12" height="50" rx="5" />
  </motion.svg>
);

const SurferFigure = ({ y }: { y: any }) => (
  <motion.svg
    style={{ y }}
    viewBox="0 0 200 80"
    className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-40 md:w-56"
    fill="black"
    aria-hidden="true"
  >
    {/* Surfboard */}
    <ellipse cx="100" cy="60" rx="90" ry="10" fill="#2a1a00" />
    {/* Lying figure */}
    <circle cx="120" cy="40" r="12" />
    <rect x="50" y="36" width="70" height="14" rx="7" />
    {/* Arms behind head */}
    <rect x="130" y="34" width="20" height="6" rx="3" />
  </motion.svg>
);

const LyingFigure = () => (
  <svg
    viewBox="0 0 200 60"
    className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-36 md:w-48"
    fill="black"
    aria-hidden="true"
  >
    <circle cx="160" cy="20" r="12" />
    <rect x="60" y="16" width="100" height="14" rx="7" />
    {/* Arms behind head */}
    <rect x="168" y="14" width="20" height="6" rx="3" />
    {/* Bent knees */}
    <rect x="60" y="26" width="12" height="20" rx="4" />
    <rect x="40" y="38" width="24" height="8" rx="4" />
    <rect x="80" y="26" width="12" height="16" rx="4" />
    <rect x="72" y="36" width="20" height="8" rx="4" />
  </svg>
);

/* ─── Stars ─── */
const Stars = ({ count, twinkle = true }: { count: number; twinkle?: boolean }) => {
  const stars = Array.from({ length: count }, (_, i) => ({
    x: 5 + ((i * 37 + 13) % 90),
    y: 5 + ((i * 23 + 7) % 50),
    r: 1 + (i % 3),
    dur: 2 + (i % 4),
    delay: (i * 0.3) % 2,
  }));
  return (
    <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
      {stars.map((s, i) => (
        <motion.circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="white"
          initial={{ opacity: 0.3 }}
          animate={twinkle ? { opacity: [0.2, 0.9, 0.2] } : {}}
          transition={twinkle ? { duration: s.dur, repeat: Infinity, delay: s.delay } : {}}
        />
      ))}
    </svg>
  );
};

/* ─── Mountains ─── */
const Mountains = () => (
  <svg
    viewBox="0 0 1200 300"
    preserveAspectRatio="none"
    className="absolute bottom-0 left-0 w-full h-[35%]"
    aria-hidden="true"
  >
    <polygon points="0,300 150,80 300,300" fill="#0a0f0d" />
    <polygon points="200,300 400,40 600,300" fill="#0d1a14" />
    <polygon points="500,300 650,100 800,300" fill="#0a0f0d" />
    <polygon points="700,300 900,20 1100,300" fill="#0d1a14" />
    <polygon points="950,300 1100,90 1200,300" fill="#0a0f0d" />
  </svg>
);

/* ─── Waves ─── */
const Waves = () => (
  <motion.svg
    viewBox="0 0 1200 200"
    preserveAspectRatio="none"
    className="absolute bottom-0 left-0 w-full h-[20%]"
    aria-hidden="true"
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path
      d="M0,120 Q150,60 300,120 Q450,180 600,120 Q750,60 900,120 Q1050,180 1200,120 L1200,200 L0,200Z"
      fill="#0A1F1C"
    />
    <path
      d="M0,140 Q150,90 300,140 Q450,190 600,140 Q750,90 900,140 Q1050,190 1200,140 L1200,200 L0,200Z"
      fill="#0d2a24"
      opacity={0.7}
    />
  </motion.svg>
);

/* ─── Grass ─── */
const Grass = () => {
  const blades = Array.from({ length: 30 }, (_, i) => ({
    x: i * 3.5,
    h: 30 + (i * 17) % 50,
    w: 3 + (i % 3),
  }));
  return (
    <svg
      viewBox="0 0 105 80"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full h-[12%]"
      aria-hidden="true"
    >
      {blades.map((b, i) => (
        <polygon
          key={i}
          points={`${b.x},80 ${b.x + b.w / 2},${80 - b.h} ${b.x + b.w},80`}
          fill="#1a3a1a"
        />
      ))}
    </svg>
  );
};

/* ─── Gold Underline (draws in) ─── */
const GoldUnderline = ({ progress }: { progress: any }) => {
  const dashOffset = useTransform(progress, [0.87, 0.95], [200, 0]);
  return (
    <motion.svg width="200" height="6" className="mx-auto mt-2" aria-hidden="true">
      <motion.line
        x1="0" y1="3" x2="200" y2="3"
        stroke="#e6c419"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="200"
        style={{ strokeDashoffset: dashOffset }}
      />
    </motion.svg>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
const JourneyAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* ─── Scroll-mapped values ─── */
  // Background
  const bg = useTransform(
    scrollYProgress,
    [0, 0.15, 0.30, 0.55, 0.75, 1],
    ["#1a1a2e", "#1a1a2e", "#0A1F1C", "#0A1F1C", "#1a0a00", "#050d0a"]
  );

  // Scene opacities
  const introOp = useTransform(scrollYProgress, [0, 0.08, 0.10], [1, 1, 0]);
  const scene1TextOp = useTransform(scrollYProgress, [0, 0.05, 0.10, 0.12], [0, 1, 1, 0]);
  const sittingOp = useTransform(scrollYProgress, [0, 0.05, 0.15, 0.22], [1, 1, 1, 0]);
  const standingOp = useTransform(scrollYProgress, [0.15, 0.22, 0.30, 0.32], [0, 1, 1, 0]);

  // Scene 3
  const scene3Op = useTransform(scrollYProgress, [0.28, 0.33, 0.52, 0.55], [0, 1, 1, 0]);
  const summitY = useTransform(scrollYProgress, [0.30, 0.38], [80, 0]);
  const scene3TextOp = useTransform(scrollYProgress, [0.35, 0.40, 0.48, 0.50], [0, 1, 1, 0]);

  // Scene 4
  const scene4Op = useTransform(scrollYProgress, [0.53, 0.58, 0.72, 0.75], [0, 1, 1, 0]);

  // Scene 5
  const scene5Op = useTransform(scrollYProgress, [0.73, 0.78, 1], [0, 1, 1]);
  const finalTextOp = useTransform(scrollYProgress, [0.85, 0.90], [0, 1]);
  const ctaOp = useTransform(scrollYProgress, [0.92, 0.96], [0, 1]);

  /* ─── Reduced motion fallback ─── */
  if (prefersReduced) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#050d0a" }}>
        <p className="text-stone-300 text-lg mb-2">The only question is</p>
        <h2 className="text-5xl font-bold font-sans" style={{ color: "#e6c419" }}>Where?</h2>
        <div className="w-32 h-0.5 mx-auto mt-3 mb-8" style={{ background: "#e6c419" }} />
        <button
          onClick={() => navigate("/planner")}
          className="px-8 py-3 rounded-full border-2 font-medium transition-colors hover:text-background"
          style={{ borderColor: "#e6c419", color: "#e6c419" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#e6c419"; e.currentTarget.style.color = "#0A1F1C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e6c419"; }}
        >
          Find My Adventure
        </button>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative h-[500vh] md:h-[500vh]" style={{ height: "clamp(400vh, 500vh, 500vh)" }}>
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {/* Intro label */}
        <motion.p
          style={{ opacity: introOp }}
          className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-[0.3em] z-10"
          // Using the gold accent color
          // Note: using inline style for specific hex as these are animation-specific colors
        >
          <span style={{ color: "#e6c419" }}>Your Story Starts Here</span>
        </motion.p>

        {/* ─── Scene 1: Corporate Worker ─── */}
        <motion.div style={{ opacity: sittingOp }} className="absolute inset-0">
          <motion.div
            style={{ opacity: scene1TextOp }}
            className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center z-10"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2" style={{ color: "#e6c419" }}>
              This could be you.
            </h2>
            <p className="text-stone-400 text-sm md:text-base italic">
              Stuck. Scheduled. Scrolling.
            </p>
          </motion.div>
          <SittingFigure opacity={sittingOp} />
        </motion.div>

        {/* ─── Scene 2: Standing ─── */}
        <StandingFigure opacity={standingOp} />

        {/* ─── Scene 3: Summit ─── */}
        <motion.div style={{ opacity: scene3Op }} className="absolute inset-0">
          <Stars count={12} />
          <Mountains />
          <SummitFigure y={summitY} />
          <motion.div
            style={{ opacity: scene3TextOp }}
            className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center z-10"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: "#e6c419" }}>
              Or this.
            </h2>
          </motion.div>
        </motion.div>

        {/* ─── Scene 4: Ocean ─── */}
        <motion.div style={{ opacity: scene4Op }} className="absolute inset-0">
          {/* Sunset sun */}
          <svg className="absolute top-[15%] left-1/2 -translate-x-1/2 w-32 h-32 md:w-48 md:h-48" aria-hidden="true">
            <circle cx="50%" cy="50%" r="40%" fill="#ff6b2b" opacity={0.3} />
          </svg>
          <Waves />
          <SurferFigure y={0} />
        </motion.div>

        {/* ─── Scene 5: Field ─── */}
        <motion.div style={{ opacity: scene5Op }} className="absolute inset-0">
          <Stars count={20} twinkle />
          <Grass />
          <LyingFigure />
          <motion.div
            style={{ opacity: finalTextOp }}
            className="absolute top-[25%] left-1/2 -translate-x-1/2 text-center z-10"
          >
            <p className="text-stone-300 text-base md:text-lg mb-2">The only question is</p>
            <h2 className="text-5xl md:text-6xl font-bold font-sans" style={{ color: "#e6c419" }}>
              Where?
            </h2>
            <GoldUnderline progress={scrollYProgress} />
          </motion.div>
          <motion.div
            style={{ opacity: ctaOp }}
            className="absolute top-[55%] left-1/2 -translate-x-1/2 z-10"
          >
            <button
              onClick={() => navigate("/planner")}
              className="px-8 py-3 rounded-full border-2 font-medium text-sm md:text-base transition-all duration-300 hover:scale-105"
              style={{ borderColor: "#e6c419", color: "#e6c419" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e6c419"; e.currentTarget.style.color = "#0A1F1C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e6c419"; }}
            >
              Find My Adventure
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default JourneyAnimation;
