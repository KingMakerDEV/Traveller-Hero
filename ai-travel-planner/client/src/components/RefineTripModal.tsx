import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RefineTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: string) => void;
  isSubmitting: boolean;
}

export const RefineTripModal = ({ isOpen, onClose, onSubmit, isSubmitting }: RefineTripModalProps) => {
  const [request, setRequest] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;
    onSubmit(request);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0A1F1C] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-primary/20"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">Refine Your Plan</h3>
                  <p className="text-xs text-stone-500 font-mono tracking-widest">STITCH ENGINE v3.0</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-stone-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-primary">Your Requirements</label>
                <textarea
                  autoFocus
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="e.g. 'I want more hiking in Day 3', 'Suggest a luxury hotel in Paris', 'Add more free time'..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:border-primary min-h-[150px] transition-all"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose}
                  className="flex-grow text-stone-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !request.trim()}
                  className="flex-grow bg-primary text-secondary font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                      Applying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send size={16} />
                      Refine Itinerary
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
