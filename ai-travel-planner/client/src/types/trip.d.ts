export interface City {
  name: string;
  days: number;
  highlights: string[];
  images: string[];
}

export interface ItineraryItem {
  day: number;
  activities: string[];
}

export interface Wildcard {
  id: string;
  title: string;
  description: string;
}

export interface TripState {
  id: string;
  title: string;
  country: string;
  description: string;
  heroImage: string;
  cities: City[];
  itinerary: ItineraryItem[];
  priceEstimate: number;
  duration: string;
  included: string[];
  wildcards: Wildcard[];
  
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
  fetchMockTrips: () => void;
  fetchMockTrip: (id: string) => void;
  selectTrip: (trip: TripState) => void;
  toggleWildcard: (tripId: string, wildcardId: string) => void;
  appendItinerary: (tripId: string, item: ItineraryItem) => void;
  planTrip: (intent: string, intent_group: string, preferences: string[]) => Promise<void>;
}
