export interface City {
  name: string;
  days: number;
  highlights: string[];
  images: string[];
}

export interface ItineraryItem {
  day: number;
  location: string;
  theme: string;
  activities: string[];
  accommodation: string;
  food: string;
}

export interface Wildcard {
  id: string;
  title: string;
  description: string;
}

export interface ImageKeywords {
  hero: string[];
  days: string[];
  card: string;
  intent_mood: string;
}

export interface TripState {
  id: string;
  title: string;
  country: string;
  description: string;
  heroImage: string;
  cities: City[];
  days: ItineraryItem[];
  estimated_budget: string;
  duration: string;
  duration_days?: number;
  included: string[];
  wildcards: Wildcard[];
  rating?: number;
  avg_rating?: number;
  destination: string;
  slug: string;
  packing_tips?: string[];
  image_keywords?: ImageKeywords;
  reviews?: any[];
  user_id?: string;
  
  // New strict contract fields
  intent: string;
  intent_group: string;
  preferences: string[];
  status?: string;
  agent_logs?: string[];
  context?: Record<string, any>;
}

export interface TripStore {
  trips: TripState[];
  selectedTrip: TripState | null;
  isLoading: boolean;
  fetchPopularTrips: () => Promise<void>;
  fetchTripBySlug: (slug: string) => Promise<void>;
  selectTrip: (trip: TripState) => void;
  setSelectedTrip: (trip: any) => void;
  toggleWildcard: (tripId: string, wildcardId: string) => void;
  appendItinerary: (tripId: string, item: ItineraryItem) => void;
  planTrip: (intent: string, intent_group: string, preferences: string[]) => Promise<void>;
}
