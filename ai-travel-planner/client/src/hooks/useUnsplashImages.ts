import { useState, useEffect, useRef } from 'react';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80";

const fetchSingleImage = async (keyword: string): Promise<string> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash API key is missing. Using fallback image.");
    return FALLBACK_IMAGE;
  }

  const performFetch = async (query: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (response.status === 403) {
        return FALLBACK_IMAGE; // Rate limit hit
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
      return null;
    } catch (error) {
      console.error('Error fetching Unsplash image:', error);
      return null;
    }
  };

  // Try with full keyword
  let url = await performFetch(keyword);
  
  // Retry 1: No results? Try first two words
  if (!url) {
    const firstTwoWords = keyword.split(' ').slice(0, 2).join(' ');
    if (firstTwoWords && firstTwoWords !== keyword) {
      url = await performFetch(firstTwoWords);
    }
  }

  // Retry 2: Still no results? Try first word only
  if (!url) {
    const firstWord = keyword.split(' ')[0];
    if (firstWord && firstWord !== keyword) {
      url = await performFetch(firstWord);
    }
  }

  return url || FALLBACK_IMAGE;
};

// Existing single-image hook (internal logic updated for safety)
export const useUnsplashImages = (query: string, count: number = 5) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    
    if (!UNSPLASH_ACCESS_KEY) {
      setImages([FALLBACK_IMAGE]);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (response.status === 403) {
          setImages([FALLBACK_IMAGE]);
          return;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setImages(data.results.map((img: any) => img.urls.regular));
        } else {
          // Retry with shorter query if no results
          const shortQuery = query.split(' ').slice(0, 2).join(' ');
          if (shortQuery && shortQuery !== query) {
            const retryResponse = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(shortQuery)}&per_page=${count}&orientation=landscape`,
              {
                headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
              }
            );
            const retryData = await retryResponse.json();
            if (retryData.results && retryData.results.length > 0) {
              setImages(data.results.map((img: any) => img.urls.regular));
              return;
            }
          }
          setImages([FALLBACK_IMAGE]);
        }
      } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        setImages([FALLBACK_IMAGE]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [query, count]);

  return { images, loading };
};

// NEW hook for multiple keywords
export const useMultipleUnsplashImages = (keywords: string[], count: number = 3) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string>(JSON.stringify(keywords));

  useEffect(() => {
    if (!keywords || keywords.length === 0) return;
    
    // Simple deduplication of logic run
    if (fetchedRef.current === JSON.stringify(keywords) && images.length > 0) return;
    fetchedRef.current = JSON.stringify(keywords);

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch one image per keyword up to 'count'
        const limitedKeywords = keywords.slice(0, count);
        const results = await Promise.all(
          limitedKeywords.map(kw => fetchSingleImage(kw))
        );
        
        // Deduplicate URLs
        const uniqueUrls = Array.from(new Set(results));
        setImages(uniqueUrls);
      } catch (error) {
        console.error('Error in useMultipleUnsplashImages:', error);
        setImages([FALLBACK_IMAGE]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [keywords, count]);

  return { images, loading };
};
