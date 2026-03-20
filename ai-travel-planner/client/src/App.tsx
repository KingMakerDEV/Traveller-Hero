
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";
import PlannerPage from "@/pages/PlannerPage";
import TripDetailPage from "@/pages/TripDetailPage";
import LoadingPage from "@/pages/LoadingPage";
import ChatPlannerPage from "@/pages/ChatPlannerPage";
import TripResultPage from "@/pages/TripResultPage";
import BookingPage from "@/pages/BookingPage";
import AboutPage from "@/pages/AboutPage";

import NotFound from "@/pages/NotFound";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/trip/:slug" element={<TripDetailPage />} />
        <Route path="/booking/:slug" element={<BookingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/chat" element={<ChatPlannerPage />} />
        <Route path="/trip-result" element={<TripResultPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
