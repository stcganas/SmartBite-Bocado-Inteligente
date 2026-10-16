import { Restaurant } from '../store/db';
import {
  RealDistanceResult,
  getRealDistanceSingle,
  getRealDistancesBatch,
  formatDistanceUnits,
  formatDurationUnits,
  calculateHaversineMeters,
} from '../services/mapboxService';

export const getBogotaTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
};

const formatTime12h = (time24: string): string => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

export const isRestaurantOpen = (restaurant: Restaurant, date: Date = getBogotaTime()): boolean => {
  if (!restaurant) return false;
  // If no detailed hours or empty object, assume open (legacy support)
  if (!restaurant.detailedHours || Object.keys(restaurant.detailedHours).length === 0) {
    return true;
  }

  try {
    const now = date;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentDayData = restaurant.detailedHours[currentDay];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let isOpenToday = false;
    
    // Check current day's configured schedule
    if (currentDayData && currentDayData.enabled !== false) {
      // If enabled but no explicit shifts, assume open all day
      if (!currentDayData.shifts || currentDayData.shifts.length === 0) {
        isOpenToday = true;
      } else {
        isOpenToday = currentDayData.shifts.some((shift: { open: string; close: string }) => {
          if (!shift.open || !shift.close) return false;
          
          const [openH, openM] = shift.open.split(':').map(Number);
          const [closeH, closeM] = shift.close.split(':').map(Number);
          
          const openMinutes = openH * 60 + openM;
          const closeMinutes = closeH * 60 + closeM;

          if (closeMinutes < openMinutes) {
            // Shift crosses midnight (starts today, finishes tomorrow)
            // Example: 22:00 to 03:00 -> We are checking TODAY'S shift, 
            // so we only match if we've passed the start time today.
            return currentTime >= openMinutes;
          }

          // Standard shift (starts and finishes today)
          return currentTime >= openMinutes && currentTime <= closeMinutes;
        });
      }
    }

    if (isOpenToday) return true;

    // Check if a shift from PREVIOUS day crossed midnight into today
    const prevDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const prevDayName = days[prevDayIndex];
    const prevDayData = restaurant.detailedHours[prevDayName];

    let isOpenFromYesterday = false;
    
    if (prevDayData && prevDayData.enabled !== false) {
      if (prevDayData.shifts && prevDayData.shifts.length > 0) {
        isOpenFromYesterday = prevDayData.shifts.some((shift: { open: string; close: string }) => {
          if (!shift.open || !shift.close) return false;
          
          const [openH, openM] = shift.open.split(':').map(Number);
          const [closeH, closeM] = shift.close.split(':').map(Number);
          
          const openMinutes = openH * 60 + openM;
          const closeMinutes = closeH * 60 + closeM;

          if (closeMinutes < openMinutes) {
            // Yesterday's shift crossed midnight into TODAY
            // Example: Yesterday 22:00 to Today 03:00 -> We verify if current time TODAY is <= close time
            return currentTime <= closeMinutes;
          }
          
          return false;
        });
      }
    }

    return isOpenFromYesterday;
  } catch (error) {
    console.error('Error checking restaurant open status:', error);
    return true; // Default to open on error to avoid blocking sales
  }
};

export const getDetailedHoursForToday = (restaurant: Restaurant, date: Date = getBogotaTime()): string => {
  if (!restaurant) return 'No especificado';
  if (!restaurant.detailedHours || Object.keys(restaurant.detailedHours).length === 0) {
    return restaurant.openingHours || 'Abierto';
  }
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesEs: Record<string, string> = {
    sunday: 'Domingo',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado'
  };
  const currentDay = days[date.getDay()];
  const dayData = restaurant.detailedHours[currentDay];

  if (!dayData || dayData.enabled === false) return 'Cerrado hoy';
  if (!dayData.shifts || dayData.shifts.length === 0) return 'Abierto todo el día';

  return dayData.shifts
    .map((s: any) => `${formatTime12h(s.open)} a ${formatTime12h(s.close)}`)
    .join(', ');
};

export interface RestaurantScheduleSummary {
  isOpen: boolean;
  statusText: "ABIERTO" | "CERRADO";
  todaySchedule: string;
  formattedMessage: string;
  detailedHoursSummary: string;
}

export const getRestaurantScheduleSummary = (restaurant: Restaurant, date: Date = getBogotaTime()): RestaurantScheduleSummary => {
  const isOpen = isRestaurantOpen(restaurant, date);
  const todaySchedule = getDetailedHoursForToday(restaurant, date);
  const generalHours = restaurant?.openingHours || 'No especificado';

  let formattedMessage = "";
  if (isOpen) {
    formattedMessage = `El restaurante ${restaurant.name} se encuentra ABIERTO. Horario de hoy: ${todaySchedule}.`;
  } else {
    if (todaySchedule === 'Cerrado hoy') {
      formattedMessage = `El restaurante ${restaurant.name} se encuentra CERRADO el día de hoy. Horario general: ${generalHours}.`;
    } else {
      formattedMessage = `El restaurante ${restaurant.name} se encuentra CERRADO en este momento. Su horario de atención para hoy es: ${todaySchedule}. Por favor vuelve a ordenar dentro de su horario de atención.`;
    }
  }

  return {
    isOpen,
    statusText: isOpen ? "ABIERTO" : "CERRADO",
    todaySchedule,
    formattedMessage,
    detailedHoursSummary: todaySchedule !== 'No especificado' ? todaySchedule : generalHours
  };
};

// ==============================================================================
// PROXIMITY & GPS LOCATION UTILITIES
// ==============================================================================

export const COLOMBIA_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "maicao": { lat: 11.3775, lng: -72.2436 },
  "riohacha": { lat: 11.5444, lng: -72.9072 },
  "uribia": { lat: 11.7139, lng: -72.2656 },
  "fonseca": { lat: 10.8872, lng: -72.8483 },
  "san juan del cesar": { lat: 10.7711, lng: -73.0028 },
  "manaure": { lat: 11.7778, lng: -72.4444 },
  "albania": { lat: 11.1611, lng: -72.5928 },
  "dibulla": { lat: 11.2722, lng: -73.3106 },
  "barranquilla": { lat: 10.9685, lng: -74.7813 },
  "valledupar": { lat: 10.4631, lng: -73.2532 },
  "santa marta": { lat: 11.2408, lng: -74.1990 },
  "cartagena": { lat: 10.3910, lng: -75.4794 },
  "bogota": { lat: 4.7110, lng: -74.0721 },
  "medellin": { lat: 6.2442, lng: -75.5812 },
  "cali": { lat: 3.4516, lng: -76.5320 },
  "bucaramanga": { lat: 7.1254, lng: -73.1198 },
  "cucuta": { lat: 7.8939, lng: -72.5078 },
  "monteria": { lat: 8.7479, lng: -75.8814 },
  "sincelejo": { lat: 9.3047, lng: -75.3978 },
  "pereira": { lat: 4.8133, lng: -75.6961 },
  "manizales": { lat: 5.0689, lng: -75.5174 },
  "armenia": { lat: 4.5339, lng: -75.6811 },
  "ibague": { lat: 4.4389, lng: -75.2322 },
  "villavicencio": { lat: 4.1420, lng: -73.6266 },
  "pasto": { lat: 1.2136, lng: -77.2811 },
  "popayan": { lat: 2.4448, lng: -76.6147 },
  "neiva": { lat: 2.9273, lng: -75.2819 },
  "tunja": { lat: 5.5353, lng: -73.3678 }
};

export const normalizeLocationStr = (val?: string): string => {
  if (!val) return "";
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Derives coordinates for a restaurant or user from explicit GPS, or address / city.
 */
export function resolveLocationCoords(
  explicitLat?: number | null,
  explicitLng?: number | null,
  address?: string | null,
  city?: string | null,
  idSeed?: string | null
): { lat: number; lng: number; isEstimate: boolean } {
  if (
    explicitLat !== undefined &&
    explicitLat !== null &&
    !isNaN(explicitLat) &&
    explicitLng !== undefined &&
    explicitLng !== null &&
    !isNaN(explicitLng) &&
    explicitLat !== 0 &&
    explicitLng !== 0
  ) {
    return { lat: explicitLat, lng: explicitLng, isEstimate: false };
  }

  const normCity = normalizeLocationStr(city || "maicao");
  const base = COLOMBIA_CITY_COORDINATES[normCity] || COLOMBIA_CITY_COORDINATES["maicao"];

  let dLat = 0;
  let dLng = 0;

  if (address) {
    const calleMatch = address.match(/(?:calle|cll|cl|c\/?)\.?\s*(\d+)/i);
    const craMatch = address.match(/(?:carrera|cra|cr|k\/?|kra)\.?\s*(\d+)/i);

    if (calleMatch || craMatch) {
      const calleNum = calleMatch ? parseInt(calleMatch[1], 10) : 16;
      const craNum = craMatch ? parseInt(craMatch[1], 10) : 10;
      // In Colombian grids (like Maicao Calle 16 & Carrera 10 is central):
      // ~100m per street (0.0009 deg)
      dLat = (calleNum - 16) * 0.0009;
      dLng = (craNum - 10) * 0.0009;
      return { lat: base.lat + dLat, lng: base.lng + dLng, isEstimate: true };
    }
  }

  // Fallback: deterministic pseudo-hash based on ID/seed within 0.3 - 2.0 km of city center
  const seed = idSeed || address || city || "default";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const distKm = 0.3 + ((Math.abs(hash) % 170) / 100); // 0.3km to 2.0km
  dLat = (distKm / 111) * Math.cos(angle);
  dLng = (distKm / (111 * Math.cos((base.lat * Math.PI) / 180))) * Math.sin(angle);

  return { lat: base.lat + dLat, lng: base.lng + dLng, isEstimate: true };
}

export interface ProximityInfo {
  distanceKm: number;
  formattedDistance: string;
  isSameCity: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
  formattedDuration?: string;
  isRealDriving?: boolean;
}

export function getRestaurantProximity(
  restaurant: Restaurant,
  userLocation: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    address?: string | null;
  },
  precomputedRealDistance?: RealDistanceResult | null
): ProximityInfo {
  const normUserCity = normalizeLocationStr(userLocation.city || "maicao");
  const normRestCity = normalizeLocationStr(restaurant.city || "maicao");
  const isSameCity =
    normUserCity === normRestCity ||
    (Boolean(normUserCity && normRestCity) &&
      (normRestCity.includes(normUserCity) || normUserCity.includes(normRestCity)));

  // If we already have a real Mapbox driving result for this restaurant, use it directly!
  if (precomputedRealDistance) {
    return {
      distanceKm: precomputedRealDistance.distanceKm,
      formattedDistance: precomputedRealDistance.formattedDistance,
      isSameCity,
      distanceMeters: precomputedRealDistance.distanceMeters,
      durationSeconds: precomputedRealDistance.durationSeconds,
      formattedDuration: precomputedRealDistance.formattedDuration,
      isRealDriving: precomputedRealDistance.isRealDriving,
    };
  }

  const userCoords = resolveLocationCoords(
    userLocation.lat,
    userLocation.lng,
    userLocation.address,
    userLocation.city || "maicao",
    "user_reference"
  );

  const restCoords = resolveLocationCoords(
    restaurant.latitude,
    restaurant.longitude,
    restaurant.address,
    restaurant.city || "maicao",
    restaurant.id || restaurant.name
  );

  const distanceMeters = calculateHaversineMeters(
    userCoords.lat,
    userCoords.lng,
    restCoords.lat,
    restCoords.lng,
    true
  );

  let distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

  // If different city and somehow distance is tiny, add realistic inter-city distance only when coords are not explicit
  const hasExplicitRestCoords = restaurant.latitude && restaurant.longitude && restaurant.latitude !== 0;
  const hasExplicitUserCoords = userLocation.lat && userLocation.lng && userLocation.lat !== 0;
  if (!isSameCity && (!hasExplicitRestCoords || !hasExplicitUserCoords) && distanceKm < 15) {
    distanceKm += 70;
  }

  const formattedDistance = formatDistanceUnits(distanceKm * 1000);
  const approxSeconds = Math.round((distanceKm / 25) * 3600);

  return {
    distanceKm,
    formattedDistance,
    isSameCity,
    distanceMeters: Math.round(distanceKm * 1000),
    durationSeconds: approxSeconds,
    formattedDuration: formatDurationUnits(approxSeconds),
    isRealDriving: false,
  };
}

/**
 * Resolves real Mapbox driving distances in batch for a list of restaurants
 */
export async function batchResolveRestaurantDistances(
  restaurants: Restaurant[],
  userLocation: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    address?: string | null;
  }
): Promise<Record<string, RealDistanceResult>> {
  const userCoords = resolveLocationCoords(
    userLocation.lat,
    userLocation.lng,
    userLocation.address,
    userLocation.city || "maicao",
    "user_reference"
  );

  const destinations = restaurants.map((r) => {
    const coords = resolveLocationCoords(
      r.latitude,
      r.longitude,
      r.address,
      r.city || "maicao",
      r.id || r.name
    );
    return {
      id: r.id,
      lat: coords.lat,
      lng: coords.lng,
    };
  });

  return await getRealDistancesBatch(
    { lat: userCoords.lat, lng: userCoords.lng },
    destinations
  );
}

/**
 * Resolves real Mapbox driving distance for a single restaurant
 */
export async function getRestaurantRealDistanceMapbox(
  restaurant: Restaurant,
  userLocation: {
    lat?: number | null;
    lng?: number | null;
    city?: string | null;
    address?: string | null;
  }
): Promise<RealDistanceResult> {
  const userCoords = resolveLocationCoords(
    userLocation.lat,
    userLocation.lng,
    userLocation.address,
    userLocation.city || "maicao",
    "user_reference"
  );

  const restCoords = resolveLocationCoords(
    restaurant.latitude,
    restaurant.longitude,
    restaurant.address,
    restaurant.city || "maicao",
    restaurant.id || restaurant.name
  );

  return await getRealDistanceSingle(
    { lat: userCoords.lat, lng: userCoords.lng },
    { lat: restCoords.lat, lng: restCoords.lng }
  );
}

