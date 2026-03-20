import { motion } from "framer-motion";
import { IndianRupee } from "lucide-react";

interface BudgetCategory {
  category: string;
  amount: string;
  percentage: number;
  description: string;
}

interface BudgetBreakdownProps {
  breakdown: BudgetCategory[];
  total: string;
}

// Color map for each budget category
const CATEGORY_COLORS: Record<string, string> = {
  flights: "#e6c419",
  accommodation: "#60a5fa",
  food: "#34d399",
  activities: "#f97316",
  transport: "#a78bfa",
  shopping: "#fb7185",
  miscellaneous: "#94a3b8",
  default: "#e6c419"
};

const getCategoryColor = (category: string): string => {
  const key = category.toLowerCase().split(" ")[0];
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
};

const BudgetBreakdown = ({ breakdown, total }: BudgetBreakdownProps) => {
  if (!breakdown || breakdown.length === 0) return null;

  return (
    <section className="bg-[#0D2623] py-24 border-y border-white/5">
      <div className="container mx-auto px-6 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.4em] text-[#e6c419] mb-3">
            Financial Intel
          </p>
          <h2 className="text-4xl font-serif text-white italic tracking-tighter">
            Budget Breakdown
          </h2>
          <p className="text-stone-500 mt-3 font-mono text-xs uppercase tracking-widest">
            Estimated per person · {total}
          </p>
        </div>

        {/* Bar Chart */}
        <div className="space-y-6 mb-16">
          {breakdown.map((item, i) => {
            const color = getCategoryColor(item.category);
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-stone-300 font-mono text-xs uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500 text-xs">
                      {item.percentage}%
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color }}
                    >
                      {item.amount}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.percentage}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {item.description && (
                  <p className="text-stone-600 text-xs pl-5">
                    {item.description}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Total Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#142A27] border border-[#e6c419]/20 rounded-2xl p-8 flex items-center justify-between"
        >
          <div>
            <p className="text-stone-500 font-mono text-xs uppercase tracking-widest mb-1">
              Total Estimated
            </p>
            <p className="text-stone-400 text-sm">Per person · Excluding international flights</p>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee size={20} className="text-[#e6c419]" />
            <p className="text-3xl font-bold text-[#e6c419]">{total}</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default BudgetBreakdown;