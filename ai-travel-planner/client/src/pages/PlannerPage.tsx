import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import IntentCard from "@/components/IntentCard";
import Footer from "@/components/Footer";
import { INTENT_GROUPS, Intent } from "@/data/intents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PlannerPage = () => {
  const navigate = useNavigate();
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [preferencesStr, setPreferencesStr] = useState("");

  const handleSelectIntent = (intent: Intent) => {
    setSelectedIntent(intent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartPlanning = () => {
    if (!selectedIntent) return;
    
    // Convert comma/space separated preferences to array
    const prefsList = preferencesStr
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    sessionStorage.setItem("travel_intent", JSON.stringify({
      intent: selectedIntent.title,
      intent_group: selectedIntent.group,
      preferences: prefsList
    }));
    
    navigate("/loading");
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-24 min-h-screen"
    >
      <section className="container mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">Trip Planner</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {selectedIntent ? `You chose: ${selectedIntent.title}` : "Select Your Travel Intent"}
          </h1>
          
          {selectedIntent ? (
             <div className="max-w-md mx-auto mt-6 space-y-4">
                <p className="text-muted-foreground">Add specific preferences or restrictions (optional):</p>
                <Input 
                   value={preferencesStr}
                   onChange={(e) => setPreferencesStr(e.target.value)}
                   placeholder="e.g. Mountains, Cold weather, No seafood" 
                   className="bg-secondary/50 border-border"
                />
                <div className="flex gap-4 pt-2">
                   <Button variant="outline" className="flex-1" onClick={() => setSelectedIntent(null)}>Back</Button>
                   <Button className="flex-1" onClick={handleStartPlanning}>Start Planning</Button>
                </div>
             </div>
          ) : (
            <p className="text-muted-foreground max-w-lg mx-auto">
              We build your perfect trip based on your psychological travel intent. How do you want to feel?
            </p>
          )}
        </motion.div>
      </section>

      {!selectedIntent && (
        <section className="container mx-auto px-6 pb-20 space-y-16">
          {INTENT_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className="space-y-6">
              <div className="border-b border-border/50 pb-4">
                <h2 className="text-2xl font-bold text-foreground">{group.title}</h2>
                <p className="text-sm font-mono text-primary uppercase tracking-wider">{group.id}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {group.intents.map((intent, i) => (
                  <IntentCard 
                    key={intent.id}
                    title={intent.title}
                    description={intent.description}
                    image={intent.image}
                    group={group.title}
                    index={groupIndex * 3 + i}
                    onSelect={() => handleSelectIntent(intent)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <Footer />
    </motion.main>
  );
};

export default PlannerPage;
