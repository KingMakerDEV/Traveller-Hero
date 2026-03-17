import { motion } from "framer-motion";

const agents = [
  { label: "Route Optimizer", emoji: "🗺️" },
  { label: "Local Expert", emoji: "🏔️" },
  { label: "Budget Analyst", emoji: "💰" },
  { label: "Experience Curator", emoji: "✨" },
];

const LoadingAgents = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-2xl font-bold text-foreground"
      >
        Crafting your journey…
      </motion.h2>

      <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.4 }}
            className="glass rounded-lg p-4 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
              className="text-2xl mb-2"
            >
              {agent.emoji}
            </motion.div>
            <p className="text-xs font-mono text-muted-foreground">{agent.label}</p>
            <motion.div
              className="mt-2 h-1 rounded-full bg-primary/30 overflow-hidden"
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAgents;
