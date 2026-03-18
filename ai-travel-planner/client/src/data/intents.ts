import skydiving from "@/assets/skydiving.jpg";
import rainforest from "@/assets/rainforest.jpg";
import shinjuku from "@/assets/shinjuku.jpg";
import island from "@/assets/island.jpg";
import temples_in_forest from "@/assets/temples_in_forest.jpg";
import beach from "@/assets/beach.jpg";
import raft from "@/assets/raft.jpg";
import surfing from "@/assets/surfing.jpg";
import heritage2 from "@/assets/heritage2.jpg";
import diving from "@/assets/diving.jpg";
import rock_climbing from "@/assets/rock_climbing.jpg";
import mountain_biking from "@/assets/mountain_biking.jpg";

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
        image: skydiving,
      },
      {
        id: "discovery",
        title: "Discovery",
        description: "Focus on novelty, 'hidden gems', and off-the-beaten-path locations.",
        group: "Group A",
        image: rainforest,
      },
      {
        id: "social-pulse",
        title: "Social Pulse",
        description: "High-energy nightlife, festivals, crowded markets, and urban exploration.",
        group: "Group A",
        image: shinjuku,
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
        image: island,
      },
      {
        id: "digital-detox",
        title: "Digital Detox",
        description: "'Off-the-grid' locations with a focus on mindfulness and disconnecting.",
        group: "Group B",
        image: temples_in_forest,
      },
      {
        id: "rejuvenation",
        title: "Rejuvenation",
        description: "Focused on self-care, luxury resorts, and slow-paced sensory experiences.",
        group: "Group B",
        image: beach,
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
        image: raft,
      },
      {
        id: "romantic-escape",
        title: "Romantic Escape",
        description: "Intimate settings, aesthetic landscapes, and curated dining experiences.",
        group: "Group C",
        image: surfing,
      },
      {
        id: "heritage-roots",
        title: "Heritage & Roots",
        description: "Exploring ancestral history, cultural museums, and local traditions.",
        group: "Group C",
        image: heritage2,
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
        image: diving,
      },
      {
        id: "wanderlust",
        title: "Wanderlust",
        description: "Minimal pre-planning, flexible routes, and open-ended itineraries.",
        group: "Group D",
        image: rock_climbing,
      },
      {
        id: "road-trip",
        title: "Road Trip",
        description: "Focus on the transit experience, scenic lookouts, and geographic breadth.",
        group: "Group D",
        image: mountain_biking,
      },
    ],
  },
];
