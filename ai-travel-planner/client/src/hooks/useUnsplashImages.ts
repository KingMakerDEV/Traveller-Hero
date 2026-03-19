// import { useState, useEffect, useRef } from 'react';

// const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
// const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80";

// const fetchSingleImage = async (keyword: string): Promise<string> => {
//   if (!UNSPLASH_ACCESS_KEY) {
//     console.warn("Unsplash API key is missing. Using fallback image.");
//     return FALLBACK_IMAGE;
//   }

//   const performFetch = async (query: string): Promise<string | null> => {
//     try {
//       const response = await fetch(
//         `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
//         {
//           headers: {
//             Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
//           },
//         }
//       );

//       if (response.status === 403) {
//         return FALLBACK_IMAGE; // Rate limit hit
//       }

//       const data = await response.json();
//       if (data.results && data.results.length > 0) {
//         return data.results[0].urls.regular;
//       }
//       return null;
//     } catch (error) {
//       console.error('Error fetching Unsplash image:', error);
//       return null;
//     }
//   };

//   // Try with full keyword
//   let url = await performFetch(keyword);
  
//   // Retry 1: No results? Try first two words
//   if (!url) {
//     const firstTwoWords = keyword.split(' ').slice(0, 2).join(' ');
//     if (firstTwoWords && firstTwoWords !== keyword) {
//       url = await performFetch(firstTwoWords);
//     }
//   }

//   // Retry 2: Still no results? Try first word only
//   if (!url) {
//     const firstWord = keyword.split(' ')[0];
//     if (firstWord && firstWord !== keyword) {
//       url = await performFetch(firstWord);
//     }
//   }

//   return url || FALLBACK_IMAGE;
// };

// // Existing single-image hook (internal logic updated for safety)
// export const useUnsplashImages = (query: string, count: number = 5) => {
//   const [images, setImages] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!query) return;
    
//     if (!UNSPLASH_ACCESS_KEY) {
//       setImages([FALLBACK_IMAGE]);
//       return;
//     }

//     const fetchImages = async () => {
//       setLoading(true);
//       try {
//         const response = await fetch(
//           `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
//           {
//             headers: {
//               Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
//             },
//           }
//         );

//         if (response.status === 403) {
//           setImages([FALLBACK_IMAGE]);
//           return;
//         }

//         const data = await response.json();
//         if (data.results && data.results.length > 0) {
//           setImages(data.results.map((img: any) => img.urls.regular));
//         } else {
//           // Retry with shorter query if no results
//           const shortQuery = query.split(' ').slice(0, 2).join(' ');
//           if (shortQuery && shortQuery !== query) {
//             const retryResponse = await fetch(
//               `https://api.unsplash.com/search/photos?query=${encodeURIComponent(shortQuery)}&per_page=${count}&orientation=landscape`,
//               {
//                 headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
//               }
//             );
//             const retryData = await retryResponse.json();
//             if (retryData.results && retryData.results.length > 0) {
//               setImages(data.results.map((img: any) => img.urls.regular));
//               return;
//             }
//           }
//           setImages([FALLBACK_IMAGE]);
//         }
//       } catch (error) {
//         console.error('Error fetching Unsplash images:', error);
//         setImages([FALLBACK_IMAGE]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchImages();
//   }, [query, count]);

//   return { images, loading };
// };

// // NEW hook for multiple keywords
// export const useMultipleUnsplashImages = (keywords: string[], count: number = 3) => {
//   const [images, setImages] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const fetchedRef = useRef<string>(JSON.stringify(keywords));

//   useEffect(() => {
//     if (!keywords || keywords.length === 0) return;
    
//     // Simple deduplication of logic run
//     if (fetchedRef.current === JSON.stringify(keywords) && images.length > 0) return;
//     fetchedRef.current = JSON.stringify(keywords);

//     const fetchAll = async () => {
//       setLoading(true);
//       try {
//         // Fetch one image per keyword up to 'count'
//         const limitedKeywords = keywords.slice(0, count);
//         const results = await Promise.all(
//           limitedKeywords.map(kw => fetchSingleImage(kw))
//         );
        
//         // Deduplicate URLs
//         const uniqueUrls = Array.from(new Set(results));
//         setImages(uniqueUrls);
//       } catch (error) {
//         console.error('Error in useMultipleUnsplashImages:', error);
//         setImages([FALLBACK_IMAGE]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [keywords, count]);

//   return { images, loading };
// };


import { useState, useEffect, useRef } from 'react';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920&q=80";

// Global URL registry — tracks every image URL used in the current page session
// Prevents the same photo appearing twice anywhere on the page
const usedImageUrls = new Set<string>();

// Call this on route change to reset the registry
export const resetUsedImages = () => usedImageUrls.clear();

const fetchSingleImage = async (keyword: string, page: number = 1): Promise<string> => {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("Unsplash API key is missing. Using fallback image.");
    return FALLBACK_IMAGE;
  }

  const performFetch = async (query: string, pageNum: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${pageNum}&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (response.status === 403) {
        console.warn("Unsplash rate limit hit. Using fallback.");
        return FALLBACK_IMAGE;
      }

      const data = await response.json();
      if (!data.results || data.results.length === 0) return null;

      // Find first result that has not been used yet on this page
      for (const result of data.results) {
        const url = result.urls.regular;
        if (!usedImageUrls.has(url)) {
          usedImageUrls.add(url);
          return url;
        }
      }

      // All results already used — try next page
      if (pageNum < 5) {
        return performFetch(query, pageNum + 1);
      }

      // Absolute fallback — return last result even if duplicate
      const lastUrl = data.results[data.results.length - 1].urls.regular;
      return lastUrl;

    } catch (error) {
      console.error('Error fetching Unsplash image:', error);
      return null;
    }
  };

  // Try with full keyword at requested page
  let url = await performFetch(keyword, page);

  // Retry with first two words if no results
  if (!url) {
    const firstTwoWords = keyword.split(' ').slice(0, 2).join(' ');
    if (firstTwoWords && firstTwoWords !== keyword) {
      url = await performFetch(firstTwoWords, 1);
    }
  }

  // Retry with first word only
  if (!url) {
    const firstWord = keyword.split(' ')[0];
    if (firstWord && firstWord !== keyword) {
      url = await performFetch(firstWord, 1);
    }
  }

  return url || FALLBACK_IMAGE;
};

// ─────────────────────────────────────────────
// Hook 1 — Single image with page offset
// Use page parameter to get different images for same keyword
// Day 1 → page 1, Day 2 → page 2, Day 3 → page 3 etc
// ─────────────────────────────────────────────
export const useUnsplashImage = (keyword: string, page: number = 1) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword) return;

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      const url = await fetchSingleImage(keyword, page);
      if (!cancelled) {
        setImageUrl(url);
        setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [keyword, page]);

  return { imageUrl, loading };
};

// ─────────────────────────────────────────────
// Hook 2 — Multiple images from array of keywords
// One image per keyword, each at page 1
// Since keywords differ per call results will naturally differ
// ─────────────────────────────────────────────
export const useMultipleUnsplashImages = (keywords: string[]) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const prevKeywords = useRef<string>("");

  useEffect(() => {
    if (!keywords || keywords.length === 0) return;

    const keyStr = keywords.join("|");
    if (keyStr === prevKeywords.current && images.length > 0) return;
    prevKeywords.current = keyStr;

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          keywords.map((kw, index) => fetchSingleImage(kw, index + 1))
        );
        if (!cancelled) {
          setImages(results);
        }
      } catch (error) {
        console.error('Error in useMultipleUnsplashImages:', error);
        if (!cancelled) setImages([FALLBACK_IMAGE]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [keywords.join("|")]);

  return { images, loading };
};

// ─────────────────────────────────────────────
// Hook 3 — Legacy hook kept for backward compatibility
// Components using useUnsplashImages(keyword, count) still work
// ─────────────────────────────────────────────
export const useUnsplashImages = (query: string, count: number = 5) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    if (!UNSPLASH_ACCESS_KEY) {
      setImages([FALLBACK_IMAGE]);
      return;
    }

    let cancelled = false;

    const fetchImages = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 10)}&orientation=landscape`,
          {
            headers: {
              Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (response.status === 403) {
          if (!cancelled) setImages([FALLBACK_IMAGE]);
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          if (data.results && data.results.length > 0) {
            setImages(data.results.map((img: any) => img.urls.regular));
          } else {
            const shortQuery = query.split(' ').slice(0, 2).join(' ');
            if (shortQuery && shortQuery !== query) {
              const retryResponse = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(shortQuery)}&per_page=${Math.min(count, 10)}&orientation=landscape`,
                { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
              );
              const retryData = await retryResponse.json();
              if (retryData.results && retryData.results.length > 0) {
                setImages(retryData.results.map((img: any) => img.urls.regular));
                return;
              }
            }
            setImages([FALLBACK_IMAGE]);
          }
        }
      } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        if (!cancelled) setImages([FALLBACK_IMAGE]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchImages();
    return () => { cancelled = true; };
  }, [query, count]);

  return { images, loading };
};
