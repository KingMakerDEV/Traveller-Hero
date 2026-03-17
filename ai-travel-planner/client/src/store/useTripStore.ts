import { create } from "zustand";
import type { TripState, TripStore, ItineraryItem } from "@/types/trip";
import { mockTrips } from "@/data/mockTrips";

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  selectedTrip: null,
  isLoading: false,

  fetchMockTrips: () => {
    set({ isLoading: true });
    // Simulate network delay
    setTimeout(() => {
      set({ trips: mockTrips, isLoading: false });
    }, 600);
  },

  fetchMockTrip: (id: string) => {
    set({ isLoading: true });
    setTimeout(() => {
      const trip = mockTrips.find((t) => t.id === id) || null;
      set({ selectedTrip: trip, isLoading: false });
    }, 400);
  },

  selectTrip: (trip: TripState) => {
    set({ selectedTrip: trip });
  },

  toggleWildcard: (tripId: string, wildcardId: string) => {
    const { trips } = get();
    const updated = trips.map((trip) => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        wildcards: trip.wildcards.map((w) =>
          w.id === wildcardId ? { ...w, title: w.title } : w
        ),
      };
    });
    set({ trips: updated });
  },

  appendItinerary: (tripId: string, item: ItineraryItem) => {
    const { trips } = get();
    const updated = trips.map((trip) => {
      if (trip.id !== tripId) return trip;
      return { ...trip, itinerary: [...trip.itinerary, item] };
    });
    set({ trips: updated });
  },

  planTrip: async (intent: string, intent_group: string, preferences: string[]) => {
    set({ isLoading: true });
    try {
      const api_url = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      
      const response = await fetch(`${api_url}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intent, intent_group, preferences }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map properties to standard trip shape for compatibility
      const tripState = {
         id: "generated-" + Date.now(),
         title: data.intent + " Adventure",
         country: "Multiple Destinations",
         description: "A specially curated trip matching your " + data.intent_group + " requirements.",
         heroImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
         cities: [],
         priceEstimate: 1200,
         duration: "5 days",
         included: preferences,
         ...data
      };
      
      set({ selectedTrip: tripState, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
}));
