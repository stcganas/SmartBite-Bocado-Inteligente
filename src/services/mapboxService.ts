/**
 * Mapbox Distance & Geocoding Service
 * Computes REAL driving distances and travel times between user and restaurants
 * using Mapbox Matrix API and Directions API.
 */

export interface RealDistanceResult {
  distanceMeters: number;
  distanceKm: number;
  formattedDistance: string; // e.g. "A 450 m" or "A 1.2 km"
  durationSeconds?: number;
  formattedDuration?: string; // e.g. "3 min"
  isRealDriving: boolean; // true if returned by Mapbox driving route
}

// In-memory cache to prevent redundant API calls
const distanceCache = new Map<string, { data: RealDistanceResult; timestamp: number }>();
const geocodeCache = new Map<string, { lat: number; lng: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function getMapboxToken(): string | null {
  return import.meta.env.VITE_MAPBOX_TOKEN || null;
}

/**
 * Format meters into clean Colombian presentation:
 * < 1000m: "A 350 m"
 * >= 1000m: "A 1.2 km"
 */
export function formatDistanceUnits(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    const meters = Math.max(10, Math.round(distanceMeters));
    return `A ${meters} m`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `A ${km} km`;
}

/**
 * Format duration in seconds into human-readable text (e.g. "4 min")
 */
export function formatDurationUnits(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours} h ${remMinutes} min`;
}

/**
 * Fallback Haversine geodesic distance in meters (adjusted with typical urban road factor ~1.25)
 */
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  applyRoadFactor: boolean = true
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightMeters = R * c;
  return applyRoadFactor ? straightMeters * 1.25 : straightMeters;
}

/**
 * Geocode address with Mapbox Geocoding API v5
 */
export async function geocodeAddressWithMapbox(
  address: string,
  city?: string,
  dept?: string
): Promise<{ lat: number; lng: number } | null> {
  const token = getMapboxToken();
  const cleanAddress = address.trim();
  const cacheKey = `${cleanAddress}|${city || ""}|${dept || ""}`.toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  if (!token) return null;

  try {
    const query = `${cleanAddress}, ${city || "Maicao"}, ${dept || "La Guajira"}, Colombia`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json?country=co&access_token=${token}&limit=1`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (feature && Array.isArray(feature.center)) {
      const [lng, lat] = feature.center;
      const coords = { lat, lng };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  } catch (err) {
    console.warn("Mapbox geocoding error:", err);
  }

  return null;
}

/**
 * Calculate single real driving distance between user and restaurant via Mapbox Directions API
 */
export async function getRealDistanceSingle(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RealDistanceResult> {
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(
    4
  )},${destination.lng.toFixed(4)}`;

  const cached = distanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = getMapboxToken();

  // If no token, compute high-accuracy geodesic estimate
  if (!token) {
    const meters = calculateHaversineMeters(origin.lat, origin.lng, destination.lat, destination.lng);
    const result: RealDistanceResult = {
      distanceMeters: Math.round(meters),
      distanceKm: parseFloat((meters / 1000).toFixed(1)),
      formattedDistance: formatDistanceUnits(meters),
      durationSeconds: Math.round((meters / 1000 / 25) * 3600), // ~25 km/h urban speed
      formattedDuration: formatDurationUnits(Math.round((meters / 1000 / 25) * 3600)),
      isRealDriving: false,
    };
    return result;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=false&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox API responded ${res.status}`);

    const data = await res.json();
    const route = data.routes?.[0];

    if (route && typeof route.distance === "number") {
      const meters = route.distance;
      const seconds = route.duration || 60;
      const result: RealDistanceResult = {
        distanceMeters: Math.round(meters),
        distanceKm: parseFloat((meters / 1000).toFixed(1)),
        formattedDistance: formatDistanceUnits(meters),
        durationSeconds: Math.round(seconds),
        formattedDuration: formatDurationUnits(seconds),
        isRealDriving: true,
      };

      distanceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    console.warn("Mapbox directions fetch error:", err);
  }

  // Fallback if network or quota issue
  const fallbackMeters = calculateHaversineMeters(origin.lat, origin.lng, destination.lat, destination.lng);
  return {
    distanceMeters: Math.round(fallbackMeters),
    distanceKm: parseFloat((fallbackMeters / 1000).toFixed(1)),
    formattedDistance: formatDistanceUnits(fallbackMeters),
    durationSeconds: Math.round((fallbackMeters / 1000 / 25) * 3600),
    formattedDuration: formatDurationUnits(Math.round((fallbackMeters / 1000 / 25) * 3600)),
    isRealDriving: false,
  };
}

/**
 * Batch calculate real driving distances between user and up to 24 restaurants
 * using Mapbox Matrix API in a single HTTP request!
 */
export async function getRealDistancesBatch(
  origin: { lat: number; lng: number },
  destinations: Array<{ id: string; lat: number; lng: number }>
): Promise<Record<string, RealDistanceResult>> {
  const results: Record<string, RealDistanceResult> = {};
  if (!destinations || destinations.length === 0) return results;

  const token = getMapboxToken();
  const toFetch: Array<{ id: string; lat: number; lng: number; index: number }> = [];

  // Check cache first
  destinations.forEach((dest, idx) => {
    const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${dest.lat.toFixed(
      4
    )},${dest.lng.toFixed(4)}`;
    const cached = distanceCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      results[dest.id] = cached.data;
    } else {
      toFetch.push({ ...dest, index: idx });
    }
  });

  // If all cached or no token, process remaining
  if (toFetch.length === 0) return results;

  if (!token) {
    toFetch.forEach((dest) => {
      const meters = calculateHaversineMeters(origin.lat, origin.lng, dest.lat, dest.lng);
      const res: RealDistanceResult = {
        distanceMeters: Math.round(meters),
        distanceKm: parseFloat((meters / 1000).toFixed(1)),
        formattedDistance: formatDistanceUnits(meters),
        durationSeconds: Math.round((meters / 1000 / 25) * 3600),
        formattedDuration: formatDurationUnits(Math.round((meters / 1000 / 25) * 3600)),
        isRealDriving: false,
      };
      results[dest.id] = res;
    });
    return results;
  }

  // Mapbox Matrix API supports up to 25 total coordinates (1 origin + 24 destinations)
  const CHUNK_SIZE = 24;
  for (let i = 0; i < toFetch.length; i += CHUNK_SIZE) {
    const chunk = toFetch.slice(i, i + CHUNK_SIZE);

    // If only 1 destination in chunk, Directions API is cleaner
    if (chunk.length === 1) {
      const single = chunk[0];
      const singleRes = await getRealDistanceSingle(origin, { lat: single.lat, lng: single.lng });
      results[single.id] = singleRes;
      continue;
    }

    try {
      const coords = [
        `${origin.lng},${origin.lat}`,
        ...chunk.map((c) => `${c.lng},${c.lat}`),
      ];
      const destIndices = chunk.map((_, idx) => idx + 1).join(";");
      const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords.join(
        ";"
      )}?sources=0&destinations=${destIndices}&annotations=distance,duration&access_token=${token}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Matrix API error ${res.status}`);

      const data = await res.json();
      const distancesRow = data.distances?.[0];
      const durationsRow = data.durations?.[0];

      if (Array.isArray(distancesRow)) {
        chunk.forEach((item, cIdx) => {
          const meters = distancesRow[cIdx];
          const seconds = durationsRow ? durationsRow[cIdx] : 180;
          if (typeof meters === "number" && !isNaN(meters)) {
            const resultItem: RealDistanceResult = {
              distanceMeters: Math.round(meters),
              distanceKm: parseFloat((meters / 1000).toFixed(1)),
              formattedDistance: formatDistanceUnits(meters),
              durationSeconds: Math.round(seconds || 180),
              formattedDuration: formatDurationUnits(seconds || 180),
              isRealDriving: true,
            };
            results[item.id] = resultItem;

            // Cache it
            const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${item.lat.toFixed(
              4
            )},${item.lng.toFixed(4)}`;
            distanceCache.set(key, { data: resultItem, timestamp: Date.now() });
          } else {
            // fallback
            const fb = calculateHaversineMeters(origin.lat, origin.lng, item.lat, item.lng);
            results[item.id] = {
              distanceMeters: Math.round(fb),
              distanceKm: parseFloat((fb / 1000).toFixed(1)),
              formattedDistance: formatDistanceUnits(fb),
              isRealDriving: false,
            };
          }
        });
      }
    } catch (err) {
      console.warn("Matrix fetch failed, falling back to geodesic:", err);
      chunk.forEach((item) => {
        if (!results[item.id]) {
          const fb = calculateHaversineMeters(origin.lat, origin.lng, item.lat, item.lng);
          results[item.id] = {
            distanceMeters: Math.round(fb),
            distanceKm: parseFloat((fb / 1000).toFixed(1)),
            formattedDistance: formatDistanceUnits(fb),
            isRealDriving: false,
          };
        }
      });
    }
  }

  return results;
}
