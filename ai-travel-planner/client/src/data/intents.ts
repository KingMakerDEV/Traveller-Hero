export interface Intent {
  id: string;
  title: string;
  description: string;
  group: string;
  image: string;
  keyword: string;
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
        image: "https://images.unsplash.com/photo-1521033332975-77aff1c5c1c1?w=800&q=80",
        keyword: "extreme sports adventure adrenaline"
      },
      {
        id: "discovery",
        title: "Discovery",
        description: "Focus on novelty, 'hidden gems', and off-the-beaten-path locations.",
        group: "Group A",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
        keyword: "hiking hidden gems adventure discovery"
      },
      {
        id: "social-pulse",
        title: "Social Pulse",
        description: "High-energy nightlife, festivals, crowded markets, and urban exploration.",
        group: "Group A",
        image: "https://images.unsplash.com/photo-1514525253348-8d955c327424?w=800&q=80",
        keyword: "nightlife party city lights social pulse"
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
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
        keyword: "peaceful landscape lake mountains serenity"
      },
      {
        id: "digital-detox",
        title: "Digital Detox",
        description: "'Off-the-grid' locations with a focus on mindfulness and disconnecting.",
        group: "Group B",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
        keyword: "meditation cabin in woods digital detox"
      },
      {
        id: "rejuvenation",
        title: "Rejuvenation",
        description: "Focused on self-care, luxury resorts, and slow-paced sensory experiences.",
        group: "Group B",
        image: "https://images.unsplash.com/photo-1544161515-4af6b1d46152?w=800&q=80",
        keyword: "spa wellness luxury resort rejuvenation"
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
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
        keyword: "family hiking picnic bonding"
      },
      {
        id: "romantic-escape",
        title: "Romantic Escape",
        description: "Intimate settings, aesthetic landscapes, and curated dining experiences.",
        group: "Group C",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
        keyword: "romantic sunset dinner beach honeymoon"
      },
      {
        id: "heritage-roots",
        title: "Heritage & Roots",
        description: "Exploring ancestral history, cultural museums, and local traditions.",
        group: "Group C",
        image: "https://images.unsplash.com/photo-1523733566440-2ddb73d2ee39?w=800&q=80",
        keyword: "historic building museum culture heritage"
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
        image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80",
        keyword: "city break weekend trip quick break"
      },
      {
        id: "wanderlust",
        title: "Wanderlust",
        description: "Minimal pre-planning, flexible routes, and open-ended itineraries.",
        group: "Group D",
        image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
        keyword: "adventure backpacker world travel wanderlust"
      },
      {
        id: "road-trip",
        title: "Road Trip",
        description: "Focus on the transit experience, scenic lookouts, and geographic breadth.",
        group: "Group D",
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
        keyword: "road trip california desert highway"
      },
    ],
  },
];
