import { useEffect, useState } from 'react';

// Simple in-memory cache so the counties GeoJSON is fetched only once and shared
// between the sheriff choropleth and the police bubble map.
let cached = null;
let inflight = null;

export default function useCountiesGeojson(url) {
  const [geojson, setGeojson] = useState(cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cached) {
      setGeojson(cached);
      return undefined;
    }
    let active = true;
    if (!inflight) {
      inflight = fetch(url).then((res) => res.json());
    }
    inflight
      .then((data) => {
        cached = data;
        if (active) setGeojson(data);
      })
      .catch(() => {
        inflight = null;
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return { geojson, error };
}
