import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, clearStaleSupabaseTokens } from '../lib/supabase';
import { db, AppUser } from '../store/db';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  appUser: AppUser | null;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshAppUser?: () => Promise<void>;
  isLoginPromptOpen: boolean;
  setLoginPromptOpen: (isOpen: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  appUser: null,
  signOut: async () => {},
  loading: true,
  isLoginPromptOpen: false,
  setLoginPromptOpen: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginPromptOpen, setLoginPromptOpen] = useState(false);
  const fetchingRef = React.useRef<string | null>(null);

  const refreshAppUser = async () => {
    if (user) {
      await fetchAppUser(user.id, user.email || '', user.user_metadata);
    }
  };

  const fetchAppUser = async (userId: string, email: string, metadata?: any) => {
    // Prevent concurrent fetches for the same user
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;

    // Try to load cached profile immediately to prevent visual flash / empty form popups
    let cachedProfile: AppUser | null = null;
    try {
      const cachedStr = localStorage.getItem(`smartbite_profile_${userId}`);
      if (cachedStr) {
        cachedProfile = JSON.parse(cachedStr) as AppUser;
        console.log('AuthContext: Loaded cached profile for user immediately:', userId);
        setAppUser(cachedProfile);
      }
    } catch (e) {
      console.warn('AuthContext: Error loading profile from cache:', e);
    }

    const isPlatformAdmin = email === 'mariagomez6211@gmail.com';
    const metadataRole = metadata?.role;
    const initialRole = isPlatformAdmin ? 'admin' : (metadataRole || 'user');
    const isGuest = email.includes('@smartbite.guest.com') || email.startsWith('guest_') || metadata?.is_guest === true;

    if (isGuest) {
      try {
        localStorage.setItem('smartbite_is_guest', 'true');
        sessionStorage.setItem('dismissed_profile_modal', 'true');
      } catch (e) {}
    }

    const fallbackProfile: AppUser = {
      id: userId,
      email: email,
      role: initialRole as any,
      status: 'active',
      profileCompleted: isGuest ? true : (cachedProfile ? (cachedProfile.profileCompleted || false) : false),
      isGuest: isGuest,
      createdAt: new Date().toISOString()
    };

    try {
      // Robust timeout for slow db or network connection
      const profilePromise = db.getAppUser(userId);
      let didTimeout = false;
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => {
        didTimeout = true;
        resolve(null);
      }, 7000));
      
      const profile = await Promise.race([profilePromise, timeoutPromise]);
      
      if (profile) {
        console.log('AuthContext: Profile loaded from Database successfully');
        
        if (isGuest) {
          profile.profileCompleted = true;
          profile.isGuest = true;
        }
        
        // Force admin role for the platform administrator
        if (isPlatformAdmin && profile.role !== 'admin') {
          console.log('AuthContext: Forcing admin role for platform administrator');
          profile.role = 'admin';
          // Update database in background
          supabase.from('app_users').update({ role: 'admin' }).eq('id', userId).then(({ error }) => {
            if (error) console.error('AuthContext: Error updating admin role:', error);
          });
        }

        // Self-correct role if metadata says restaurant but profile says user
        // ONLY if they actually have a restaurant record
        if (metadata?.role === 'restaurant' && profile.role !== 'restaurant' && profile.role !== 'admin') {
          try {
            const restPromise = db.getRestaurantByOwner(userId);
            const restTimeout = new Promise<null>(res => setTimeout(() => res(null), 5000));
            const existingRest = await Promise.race([restPromise, restTimeout]);
            
            if (existingRest) {
              console.log('AuthContext: Self-correcting role to restaurant based on metadata and existing record');
              profile.role = 'restaurant';
              supabase.from('app_users').update({ role: 'restaurant' }).eq('id', userId).then(({ error }) => {
                if (error) console.error('AuthContext: Error updating restaurant role:', error);
              });
            }
          } catch (err) {
            console.warn('AuthContext: Error during restaurant role verification:', err);
          }
        }

        // Self-correct role if metadata says driver but profile says user
        if (metadata?.role === 'driver' && profile.role !== 'driver' && profile.role !== 'admin') {
          console.log('AuthContext: Self-correcting role to driver based on metadata');
          profile.role = 'driver';
          supabase.from('app_users').update({ role: 'driver' }).eq('id', userId).then(({ error }) => {
            if (error) console.error('AuthContext: Error updating driver role:', error);
          });
        }

        // Ensure referral code exists
        if (!profile.referralCode) {
          try {
            const { referralService } = await import('../services/referralService');
            const code = await referralService.ensureReferralCode(profile);
            profile.referralCode = code;
          } catch (err) {
            console.error('AuthContext: Error ensuring referral code:', err);
          }
        }

        // Cache loaded profile in localStorage
        try {
          localStorage.setItem(`smartbite_profile_${userId}`, JSON.stringify(profile));
        } catch (e) {
          console.warn('AuthContext: Error storing loaded profile to cache:', e);
        }

        setAppUser(profile);
        fetchingRef.current = null;
        return;
      }

      // If we did not find a profile is because it was deleted, not created yet, or query failed.
      // If we timed out, or query errored, we should NOT assume new profile & show empty form.
      if (didTimeout) {
        console.warn('AuthContext: DB fetch timed out. Using cached profile or non-blocking fallback.');
        const finalProfile = cachedProfile || { ...fallbackProfile, profileCompleted: true };
        setAppUser(finalProfile);
        fetchingRef.current = null;
        return;
      }

      console.log('AuthContext: Profile explicitly not found in DB, upserting initial profile');
      // If no profile, try to create or update one
      let finalInitialRole = 'user';
      if (isPlatformAdmin) {
        finalInitialRole = 'admin';
      } else if (metadataRole && ['user', 'restaurant', 'driver', 'admin', 'representative'].includes(metadataRole)) {
        finalInitialRole = metadataRole;
      }
      
      const upsertPromise = supabase.from('app_users').upsert({
        id: userId,
        email: email,
        role: finalInitialRole,
        status: 'active'
      }).select().maybeSingle();
      
      const upsertTimeoutPromise = new Promise<{data: any, error: any}>((resolve) => setTimeout(() => resolve({data: null, error: { message: 'Timeout upserting profile' }}), 5000));
      const { data, error } = await Promise.race([upsertPromise, upsertTimeoutPromise]);
      
      if (data && !error) {
        console.log('AuthContext: Profile upserted successfully');
        const upsertedProfile: AppUser = {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          profileCompleted: isGuest ? true : (data.profile_completed || false),
          isGuest: isGuest,
          createdAt: data.created_at
        };

        try {
          localStorage.setItem(`smartbite_profile_${userId}`, JSON.stringify(upsertedProfile));
        } catch (e) {}

        setAppUser(upsertedProfile);
      } else {
        if (error) console.error('AuthContext: Error upserting app user:', error);
        console.log('AuthContext: Using cached profile or non-blocking fallback');
        const finalProfile = cachedProfile || { ...fallbackProfile, profileCompleted: true };
        setAppUser(finalProfile);
      }
    } catch (error) {
      console.error('AuthContext: Error in fetchAppUser:', error);
      const finalProfile = cachedProfile || { ...fallbackProfile, profileCompleted: true };
      setAppUser(finalProfile);
    } finally {
      fetchingRef.current = null;
    }
  };

    useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;
    let currentProfileSubscription: any = null;

    const cleanupRealtime = () => {
      if (currentProfileSubscription) {
        currentProfileSubscription.unsubscribe();
        currentProfileSubscription = null;
      }
    };

    const setupRealtime = (userId: string) => {
      cleanupRealtime();
      currentProfileSubscription = supabase
        .channel(`app_user_profile_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'app_users',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log('AuthContext: Profile update received via realtime:', payload);
            const data = payload.new as any;
            setAppUser(prev => {
              if (!prev) return null;
              const updated = {
                ...prev,
                displayName: data.display_name || prev.displayName,
                referralBalance: data.referral_balance ?? prev.referralBalance,
                referralCode: data.referral_code || prev.referralCode,
                profileCompleted: data.profile_completed ?? prev.profileCompleted,
                avatarUrl: data.avatar_url || prev.avatarUrl,
              };
              try {
                localStorage.setItem(`smartbite_profile_${userId}`, JSON.stringify(updated));
              } catch (e) {
                console.warn('AuthContext: Error caching realtime update:', e);
              }
              return updated;
            });
          }
        )
        .subscribe();
    };

    const initAuth = async () => {
      try {
        console.log('AuthContext: initAuth starting...');
        
        // Fast path for non-authenticated check
        const hasProbableAuth = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!hasProbableAuth) {
           console.log('AuthContext: No auth token in localStorage, skipping getSession');
           if (mounted) setLoading(false);
           return;
        }

        let session: Session | null = null;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            const errorMsg = error.message || String(error);
            const isRefreshTokenError = 
              errorMsg.includes('Refresh Token Not Found') || 
              errorMsg.includes('Invalid Refresh Token') ||
              errorMsg.includes('refresh_token_not_found') ||
              errorMsg.includes('invalid_grant') ||
              errorMsg.includes('session_not_found');

            if (isRefreshTokenError) {
              console.warn('AuthContext: Stale or invalid refresh token found, resetting local session gracefully.');
              clearStaleSupabaseTokens();
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
              if (mounted) {
                setSession(null);
                setUser(null);
                setAppUser(null);
                setLoading(false);
              }
              return;
            } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('Supabase no está configurado')) {
              console.warn('AuthContext: Supabase connectivity notice:', errorMsg);
            } else {
              console.warn('AuthContext: Notice during getSession:', errorMsg);
            }
          } else {
            session = data?.session ?? null;
          }
        } catch (sessionErr: any) {
          const errStr = sessionErr?.message || String(sessionErr);
          if (
            errStr.includes('Refresh Token') || 
            errStr.includes('refresh_token') || 
            errStr.includes('invalid_grant') ||
            errStr.includes('session_not_found')
          ) {
            console.warn('AuthContext: Invalid refresh token caught during getSession, cleaning local auth state...');
            clearStaleSupabaseTokens();
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            if (mounted) {
              setSession(null);
              setUser(null);
              setAppUser(null);
              setLoading(false);
            }
            return;
          }
          console.warn('AuthContext: Handled session initialization exception:', errStr);
        }
        
        console.log('AuthContext: session found:', !!session);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: session user found, fetching appUser');
          currentUserId = session.user.id;
          setupRealtime(session.user.id);
          sessionStorage.removeItem('auth_reload_attempted');
          
          // Do not await to avoid blocking initialization
          fetchAppUser(session.user.id, session.user.email || '', session.user.user_metadata);
        } else {
          console.log('AuthContext: no session user');
          setAppUser(null);
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        if (
          errorMsg.includes('Refresh Token Not Found') || 
          errorMsg.includes('Invalid Refresh Token') ||
          errorMsg.includes('refresh_token_not_found') ||
          errorMsg.includes('invalid_grant') ||
          errorMsg.includes('session_not_found')
        ) {
          console.warn('AuthContext: Invalid refresh token handled gracefully, cleaning up...');
          clearStaleSupabaseTokens();
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        } else {
          console.warn('AuthContext: Non-critical auth init notice:', errorMsg);
        }
        if (mounted) {
          setSession(null);
          setUser(null);
          setAppUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth().catch(err => {
      console.warn('AuthContext: Handled initAuth background notice:', err?.message || err);
      if (mounted) setLoading(false);
    });

    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out, forcing load completion');
        setLoading(false);
      }
    }, 3500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Do not aggressively clear session on transient events to prevent form state loss
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        
        if (currentUserId !== session.user.id) {
          console.log('AuthContext: Auth state changed for new user', session.user.id);
          currentUserId = session.user.id;
          setupRealtime(session.user.id);
          
          fetchAppUser(session.user.id, session.user.email || '', session.user.user_metadata);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        currentUserId = null;
        setAppUser(null);
        cleanupRealtime();
        setLoading(false);
      } else {
        // For other events (like TOKEN_REFRESHED failing transiently), just ensure we aren't stuck loading
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      cleanupRealtime();
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear local state immediately for better UX
    setSession(null);
    setUser(null);
    setAppUser(null);
    localStorage.removeItem('chatMessages');
    
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (error) {
      // Ignore
    } finally {
      clearStaleSupabaseTokens();
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, appUser, signOut, loading, refreshAppUser, isLoginPromptOpen, setLoginPromptOpen }}>
      {children}
    </AuthContext.Provider>
  );
};
