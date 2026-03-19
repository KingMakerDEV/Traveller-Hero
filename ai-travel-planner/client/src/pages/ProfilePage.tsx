import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Calendar, ArrowRight, User as UserIcon, LogOut, Star } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { useUnsplashImages } from "@/hooks/useUnsplashImages";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

interface ImageKeywords {
  hero: string[];
  days: string[];
  card: string;
  intent_mood: string;
}

interface SavedTrip {
  id: string;
  slug: string;
  title: string;
  destination: string;
  date: string;
  image?: string;
  image_keywords?: ImageKeywords;
}

const TripThumbnail = ({ trip }: { trip: SavedTrip }) => {
  const keyword = trip.image_keywords?.card || `${trip.destination} travel`;
  const { images } = useUnsplashImages(keyword, 1);
  return (
    <img 
      src={images[0] || trip.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"} 
      alt={trip.title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token, isLoggedIn, isLoading, signOut } = useAuthStore();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [fetchingTrips, setFetchingTrips] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, isLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setFetchingTrips(false);
      }
    };

    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, token]);

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this trip plan?")) return;

    try {
      const response = await fetch(`${API_URL}/trip/${slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setTrips((prev) => prev.filter((t) => t.slug !== slug));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (isLoading || fetchingTrips) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#e6c419] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-32 pb-20 bg-[#0A1F1C]"
    >
      <div className="container mx-auto px-6">
        {/* Profile Header */}
        <div className="bg-[#142A27] rounded-3xl p-8 md:p-12 mb-12 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#e6c419]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-full bg-[#0A1F1C] border-2 border-[#e6c419] flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-[#e6c419]" />
              )}
            </div>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
              <p className="text-stone-400 font-mono tracking-wider">{user?.email}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="border-white/10 text-stone-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Saved Trips */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            Your Saved Journeys
            <span className="bg-[#e6c419] text-[#0A1F1C] text-xs font-mono px-2 py-0.5 rounded-full">
              {trips.length}
            </span>
          </h2>

          {trips.length === 0 ? (
            <div className="bg-[#142A27] rounded-2xl py-20 text-center border border-dashed border-white/10">
              <p className="text-stone-500 mb-6">You haven't saved any trip plans yet.</p>
              <Button asChild className="bg-[#e6c419] text-[#0A1F1C] hover:bg-[#d4b517] font-bold">
                <Link to="/planner">Start Planning</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <motion.div
                  key={trip.id}
                  whileHover={{ y: -5 }}
                  className="bg-[#142A27] rounded-2xl overflow-hidden border border-white/5 group shadow-lg"
                >
                  <div className="h-48 relative overflow-hidden bg-stone-800">
                    <TripThumbnail trip={trip} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F1C] via-transparent to-transparent opacity-60"></div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#e6c419] transition-colors line-clamp-1">
                      {trip.title}
                    </h3>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-stone-400 text-sm">
                        <MapPin size={14} className="text-[#e6c419]" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400 text-sm">
                        <Calendar size={14} className="text-[#e6c419]" />
                        <span>{trip.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                      <Button asChild className="flex-grow bg-[#142A27] border border-white/10 hover:border-[#e6c419] hover:bg-[#1a3531] text-white">
                        <Link to={`/trip/${trip.slug}`}>
                          View Details
                          <ArrowRight size={14} className="ml-2" />
                        </Link>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDelete(trip.slug)}
                        className="text-stone-500 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>

                    {/* Review Section */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-[#e6c419]">Leave a Review</h4>
                      <TripReviewForm tripId={trip.id} userName={user?.name || "Anonymous"} token={token!} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </motion.main>
  );
};

const TripReviewForm = ({ tripId, userName, token }: { tripId: string, userName: string, token: string }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trip_id: tripId,
          rating,
          comment,
          reviewer_name: userName,
        }),
      });

      if (response.ok) {
        setComment("");
        setRating(5);
        toast.success("Review submitted! Thank you.");
      }
    } catch (error) {
      console.error("Review failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform active:scale-90"
          >
            <Star
              size={18}
              className={star <= rating ? "text-[#e6c419] fill-[#e6c419]" : "text-stone-700"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience..."
        className="w-full bg-[#0A1F1C] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-[#e6c419] min-h-[80px] transition-colors"
      />
      <Button
        type="submit"
        disabled={submitting || !comment.trim()}
        className="w-full bg-[#142A27] border border-white/10 hover:border-[#e6c419] hover:bg-[#1a3531] text-xs h-9 font-bold"
      >
        {submitting ? "Sending..." : "Submit Review"}
      </Button>
    </form>
  );
};

export default ProfilePage;
