import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

let isOneSignalInitializing = false;
let globalIsInitialized = false;

export const useOneSignal = () => {
  const [isInitialized, setIsInitialized] = useState(globalIsInitialized);
  const { user } = useAuth();

  const initOneSignal = async () => {
    if (globalIsInitialized) {
        setIsInitialized(true);
        // Ensure user is logged in
        if (user?.id) {
          console.log('[OneSignal] Associating user login ID for already initialized instance:', user.id);
          try {
            await OneSignal.login(user.id);
          } catch(e) {
            console.error(e);
          }
        }
        return;
    }
    if (isOneSignalInitializing) {
        // Wait and poll until initialized
        const poll = setInterval(() => {
            if (globalIsInitialized) {
                setIsInitialized(true);
                clearInterval(poll);
            }
        }, 100);
        return;
    }
    isOneSignalInitializing = true;

    try {
      if (typeof window === 'undefined') return;

      const res = await fetch('/api/config');
      if (!res.ok) {
        throw new Error(`Failed to load config: ${res.statusText}`);
      }
      const config = await res.json();

      if (!config.onesignalAppId) {
        console.warn('[OneSignal] Missing onesignalAppId in backend response. Verify your environment variables.');
        isOneSignalInitializing = false;
        return;
      }

      console.log('[OneSignal] Initializing OneSignal with App ID:', config.onesignalAppId);
      
      const initOptions: any = {
        appId: config.onesignalAppId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      };

      await (OneSignal as any).init(initOptions);

      globalIsInitialized = true;
      setIsInitialized(true);
      console.log('[OneSignal] Registered and Initialized OneSignal successfully.');

      // Login / associate current user if logged in
      if (user?.id) {
        console.log('[OneSignal] Associating user login ID:', user.id);
        await OneSignal.login(user.id);
      }

    } catch (err: any) {
      console.warn('[OneSignal] Initialization error:', err.message || err);
    } finally {
      isOneSignalInitializing = false;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('[OneSignal] Prompting for notification permission...');
      if (typeof window === 'undefined') return false;

      if (!isInitialized) {
        await initOneSignal();
      }

      // Safeguard for multiple versions of OneSignal browser SDK
      if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
        await OneSignal.Notifications.requestPermission();
      } else if (typeof (OneSignal as any).registerForPushNotifications === 'function') {
        await (OneSignal as any).registerForPushNotifications({ force: true });
      } else if (typeof (OneSignal as any).showSlidedownPrompt === 'function') {
        await (OneSignal as any).showSlidedownPrompt();
      } else {
        // Fallback to native browser permission request if SDK functions are missing
        await window.Notification.requestPermission();
      }

      const isGranted = window.Notification?.permission === 'granted';
      return isGranted;
    } catch (error) {
      console.error('[OneSignal] Error requesting permission:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      initOneSignal();
    }
  }, [user?.id]);

  return { isInitialized, requestPermission };
};
