import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const BookingForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass rounded-lg p-8"
      id="contact"
    >
      <h3 className="text-2xl font-bold text-foreground mb-2">Book This Trip</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Fill in your details and we'll get back to you within 24 hours.
      </p>

      {submitted ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-primary font-semibold text-lg">Thank you!</p>
          <p className="text-sm text-muted-foreground mt-2">We'll be in touch soon.</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Your name"
            required
            className="bg-secondary/50 border-border"
          />
          <Input
            type="tel"
            placeholder="Phone number"
            required
            className="bg-secondary/50 border-border"
          />
          <Input
            type="email"
            placeholder="Email address"
            required
            className="bg-secondary/50 border-border"
          />
          <Textarea
            placeholder="Tell us about your dream trip…"
            rows={4}
            className="bg-secondary/50 border-border"
          />
          <Button type="submit" className="w-full gap-2">
            <Send className="h-4 w-4" />
            Send Inquiry
          </Button>
        </form>
      )}
    </motion.div>
  );
};

export default BookingForm;
