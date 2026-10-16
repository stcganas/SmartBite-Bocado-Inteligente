import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../contexts/AuthContext';

// Helper function to create canvas fingerprint
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    // Draw elements to fingerprint canvas rendering engine & OS text rendering
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("SmartBite-Fingerprint,😃", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("SmartBite-Fingerprint,😃", 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
};

// Helper function for quick hashing of component strings
const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return '00000000';
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Helper to get or generate persistent session ID
const getOrCreateSessionId = (): string => {
  try {
    let sessId = sessionStorage.getItem('sb_session_id');
    if (!sessId) {
      sessId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('sb_session_id', sessId);
    }
    return sessId;
  } catch {
    return `sess_tmp_${Date.now().toString(36)}`;
  }
};

// Calculate age group from birthdate
const calculateAgeGroup = (birthdate?: string): string | undefined => {
  if (!birthdate) return undefined;
  try {
    const birth = new Date(birthdate);
    if (isNaN(birth.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) return '<18';
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    return '55+';
  } catch {
    return undefined;
  }
};

export const VisitTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastTrackedRef = useRef<{ path: string; timestamp: number }>({ path: '', timestamp: 0 });

  useEffect(() => {
    const recordMyVisit = async () => {
      const path = location.pathname;
      const now = Date.now();
      
      // Throttle rapid repeated triggers on the exact same path (within 3 seconds)
      if (lastTrackedRef.current.path === path && (now - lastTrackedRef.current.timestamp) < 3000) {
        return;
      }
      
      // Do not record visits on administrative dashboard pages
      if (path.startsWith('/admin') || path.startsWith('/platform-admin')) {
        return;
      }

      lastTrackedRef.current = { path, timestamp: now };
      
      let restaurantId: string | undefined = undefined;
      if (path.startsWith('/restaurant/') || path.startsWith('/restaurante/')) {
        const parts = path.split('/');
        if (parts.length >= 3 && parts[2]) {
          restaurantId = parts[2]; // /restaurant/ID or /restaurante/ID
        }
      }
      
      const sessionId = getOrCreateSessionId();

      // 1. Fetch IP Address & Geolocation info (fails gracefully with multi-tier fallback)
      let ipAddress = 'Unknown';
      let cityGeo: string | undefined = undefined;
      
      try {
        // Tier 1: ipwho.is (Free, fast, CORS friendly)
        const ipData = await fetch('https://ipwho.is/')
          .then(r => r.json())
          .catch(() => null);

        if (ipData && ipData.success && ipData.ip) {
          ipAddress = ipData.ip;
          cityGeo = `${ipData.city || 'Desconocido'}, ${ipData.region || ''}, ${ipData.country || ''}`.replace(/,\s*,/g, ',').trim();
        } else {
          // Tier 2: ipapi.co
          const fallbackData = await fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .catch(() => null);
          if (fallbackData && fallbackData.ip) {
            ipAddress = fallbackData.ip;
            cityGeo = `${fallbackData.city || 'Desconocido'}, ${fallbackData.region || ''}, ${fallbackData.country_name || ''}`.replace(/,\s*,/g, ',').trim();
          }
        }
      } catch (e) {
        console.warn("Could not retrieve IP/Geo data, using local fallback:", e);
      }

      // Tier 3: If cityGeo still undefined, use user's saved city in localStorage
      if (!cityGeo || cityGeo.startsWith('Desconocido')) {
        const localCity = localStorage.getItem('userCity');
        const localDept = localStorage.getItem('userDepartment');
        if (localCity) {
          cityGeo = `${localCity}${localDept ? `, ${localDept}` : ''}, Colombia`;
        }
      }

      // 2. Compute device fingerprint
      let fingerprint = localStorage.getItem('sb_device_fp') || '';
      if (!fingerprint) {
        const canvasFp = getCanvasFingerprint();
        const fpComponents = [
          navigator.userAgent,
          `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          navigator.language,
          navigator.hardwareConcurrency || 'unknown',
          (navigator as any).deviceMemory || 'unknown',
          navigator.maxTouchPoints || 0,
          canvasFp
        ].join('|');
        
        fingerprint = `fp_${hashString(fpComponents)}`;
        localStorage.setItem('sb_device_fp', fingerprint);
      }

      // 3. Bot/Automation checks
      let esBot = false;
      const botSignals: string[] = [];
      
      // Signal A: Automation Webdriver flag
      if (navigator.webdriver) {
        esBot = true;
        botSignals.push('webdriver_active');
      }
      
      // Signal B: Header / Bot User Agent matches
      if (/HeadlessChrome|bot|crawl|spider|lighthouse|selenium|puppeteer|phantomjs/i.test(navigator.userAgent)) {
        esBot = true;
        botSignals.push('bot_user_agent');
      }
      
      // Signal C: Chrome emulation mismatch
      const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|OPR/i.test(navigator.userAgent);
      if (isChrome && !(window as any).chrome) {
        esBot = true;
        botSignals.push('fake_chrome_signature');
      }

      // Signal D: Impossible screen resolution
      if (window.screen.width === 0 || window.screen.height === 0) {
        esBot = true;
        botSignals.push('zero_dimension_screen');
      }

      // Signal E: Excessive browsing speed (crawler/scraper behavior)
      const navHistoryStr = sessionStorage.getItem('sb_nav_history') || '[]';
      let navHistory: number[] = [];
      try {
        navHistory = JSON.parse(navHistoryStr);
      } catch {
        navHistory = [];
      }
      navHistory.push(now);
      // Keep only transitions in the last 10 seconds
      const filteredNavs = navHistory.filter(t => now - t < 10000);
      sessionStorage.setItem('sb_nav_history', JSON.stringify(filteredNavs));
      
      if (filteredNavs.length >= 8) {
        esBot = true;
        botSignals.push('excessive_navigation_speed');
      }

      // 4. Clean up OS and Browser names
      let os = 'Desconocido';
      if (navigator.userAgent.indexOf('Win') !== -1) os = 'Windows';
      else if (navigator.userAgent.indexOf('Mac') !== -1) os = 'MacOS';
      else if (navigator.userAgent.indexOf('Linux') !== -1) os = 'Linux';
      else if (/Android/i.test(navigator.userAgent)) os = 'Android';
      else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) os = 'iOS';

      let browser = 'Desconocido';
      if (/Firefox/i.test(navigator.userAgent)) browser = 'Firefox';
      else if (/Chrome/i.test(navigator.userAgent)) browser = 'Chrome';
      else if (/Safari/i.test(navigator.userAgent)) browser = 'Safari';
      else if (/Edge/i.test(navigator.userAgent)) browser = 'Edge';
      else if (/Opera|OPR/i.test(navigator.userAgent)) browser = 'Opera';

      const rawDeviceInfo = JSON.stringify({
        os,
        browser,
        ip: ipAddress,
        botSignals,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      // 5. User Demographics Enrichment
      const userGender = (user as any)?.gender || (user as any)?.genero;
      const userAgeRange = calculateAgeGroup((user as any)?.birthdate || (user as any)?.fechaNacimiento);
      const userCityFromProfile = (user as any)?.city || (user as any)?.ciudad;

      // 6. Send telemetry record to Supabase backend
      await db.recordVisit({
        restaurantId,
        userId: user?.id,
        pagePath: path,
        sessionId,
        ipAddress,
        browser,
        os,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        deviceInfo: rawDeviceInfo,
        city: cityGeo || userCityFromProfile || 'Maicao, La Guajira',
        gender: userGender,
        ageRange: userAgeRange,
        esBot,
        botSignals,
        fingerprint,
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer || null,
          title: document.title || 'SmartBite'
        }
      });
    };

    recordMyVisit().catch(err => console.error("Error logging visit telemetry:", err));
  }, [location.pathname, user?.id]);

  return null;
};

