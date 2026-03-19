const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Persistence for used images in the current session
const usedImages = new Set<string>();

/**
 * Fetches a random image from Unsplash based on a search query.
 * Matches image with text meaning and ensures no repetition by retrying once.
 */
export async function getImage(query: string): Promise<string> {
  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${ACCESS_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unsplash API Error");

    const data = await response.json();
    const imageUrl = data.urls.regular;

    // Check for repetition
    if (usedImages.has(imageUrl)) {
      // Simple retry logic
      const secondResponse = await fetch(url);
      const secondData = await secondResponse.json();
      const secondUrl = secondData.urls.regular;
      usedImages.add(secondUrl);
      return secondUrl;
    }

    usedImages.add(imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Image fetch failed:", error);
    // Semantic fallbacks based on query
    if (query.toLowerCase().includes("city")) return "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1000";
    if (query.toLowerCase().includes("mountain")) return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000";
    if (query.toLowerCase().includes("beach")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000";
    return "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000";
  }
}
