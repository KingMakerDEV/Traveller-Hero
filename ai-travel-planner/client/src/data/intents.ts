export interface Intent {
  id: string;
  title: string;
  description: string;
  group: string;
  image: string;
}

export interface IntentGroup {
  id: string;
  title: string;
  intents: Intent[];
}

export const INTENT_GROUPS: IntentGroup[] = [
  {
    id: "Group A",
    title: "High-Energy & Stimulation",
    intents: [
      {
        id: "adrenaline",
        title: "Adrenaline",
        description: "High-intensity activities, physical challenges, and extreme sports.",
        group: "Group A",
        image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "discovery",
        title: "Discovery",
        description: "Focus on novelty, 'hidden gems', and off-the-beaten-path locations.",
        group: "Group A",
        image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "social-pulse",
        title: "Social Pulse",
        description: "High-energy nightlife, festivals, crowded markets, and urban exploration.",
        group: "Group A",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "Group B",
    title: "Restoration & Wellness",
    intents: [
      {
        id: "peace-serenity",
        title: "Peace & Serenity",
        description: "Quiet, nature-focused retreats, minimal transit, and low-crowd density.",
        group: "Group B",
        image: "https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "digital-detox",
        title: "Digital Detox",
        description: "'Off-the-grid' locations with a focus on mindfulness and disconnecting.",
        group: "Group B",
        image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "rejuvenation",
        title: "Rejuvenation",
        description: "Focused on self-care, luxury resorts, and slow-paced sensory experiences.",
        group: "Group B",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "Group C",
    title: "Connection & Kinship",
    intents: [
      {
        id: "family-bonding",
        title: "Family Bonding",
        description: "Multi-generational friendly activities, safety-first logistics, and shared memories.",
        group: "Group C",
        image: "https://images.unsplash.com/photo-1602070183145-21c607f2a176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "romantic-escape",
        title: "Romantic Escape",
        description: "Intimate settings, aesthetic landscapes, and curated dining experiences.",
        group: "Group C",
        image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "heritage-roots",
        title: "Heritage & Roots",
        description: "Exploring ancestral history, cultural museums, and local traditions.",
        group: "Group C",
        image: "https://images.unsplash.com/photo-1518998053401-a414f08e484a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "Group D",
    title: "Tactical & Pragmatic",
    intents: [
      {
        id: "quick-break",
        title: "The Quick Break",
        description: "Optimized for maximum experience in a 48–72 hour window.",
        group: "Group D",
        image: "https://images.unsplash.com/photo-1536648719266-9bc0abed4392?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "wanderlust",
        title: "Wanderlust",
        description: "Minimal pre-planning, flexible routes, and open-ended itineraries.",
        group: "Group D",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "road-trip",
        title: "Road Trip",
        description: "Focus on the transit experience, scenic lookouts, and geographic breadth.",
        group: "Group D",
        image: "https://images.unsplash.com/photo-1463123081488-789f998ac9c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];
