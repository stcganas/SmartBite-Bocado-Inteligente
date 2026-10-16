import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../store/db';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Utensils, Mail, Lock, User as UserIcon, Store, MapPin, Phone, CheckCircle2, Car, ChevronRight, ArrowLeft, Star } from 'lucide-react';
import { DateSelector } from '../components/DateSelector';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageSizeInfo } from '../components/ImageSizeInfo';
import { toast } from 'sonner';
import { getDepartments, getCitiesByDepartment } from '../utils/colombiaData';
import { getCategoryVisual } from '../utils/categoryTheme';

const transparentImg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==";

export default function Auth() {
  const [platformSettings, setPlatformSettings] = useState<any | null>(null);
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    db.getPlatformSettings().then(v => {
      setPlatformSettings(v);
    });
  }, []);

  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register';
  const [showLanding, setShowLanding] = useState(!initialMode && !searchParams.get('mode'));
  const [isLogin, setIsLogin] = useState(!initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'restaurant' | 'driver'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Restaurant specific fields
  const [address, setAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantType, setRestaurantType] = useState('Comida Rápida');
  const [businessType, setBusinessType] = useState<'physical' | 'online'>('physical');
  const [businessCategory, setBusinessCategory] = useState<string>('restaurant');
  const [handlesPromotions, setHandlesPromotions] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(true);

  // Driver specific fields
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'motocarro' | 'bicycle' | 'car'>('motorcycle');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [documentPhoto, setDocumentPhoto] = useState<File | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
  const [tecnomecanicaPhoto, setTecnomecanicaPhoto] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const navigate = useNavigate();
  const { user, appUser, loading: authLoading } = useAuth();
  const [showSpinner, setShowSpinner] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const restaurantCategories = [
    'Comida Rápida', 'Italiana', 'Mexicana', 'China', 'Japonesa', 
    'Vegetariana/Vegana', 'Cafetería', 'Panadería', 'Parrilla', 'Mariscos',
    'Verdulería', 'Licores', 'Salsamentaría'
  ];

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    } else if (mode === 'reset_password') {
      setIsResettingPassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (user && !appUser && !isRegistered && !isResettingPassword && !isRegisteringRef.current) {
      console.log('Auth: User exists but appUser is missing, showing spinner');
      setShowSpinner(true);
      // Faster fallback for appUser loading
      timeoutId = setTimeout(() => {
        if (!appUser && user) {
          console.warn('Auth: Profile timeout, navigating by metadata');
          const metadataRole = user.user_metadata?.role || 'user';
          // Check for hardcoded admin email matches if necessary
          const isPlatformAdmin = user.email === 'mariagomez6211@gmail.com';
          const role = isPlatformAdmin ? 'admin' : metadataRole;
          
          console.log('Auth: Fallback decision - role:', role);
      if (role === 'admin') navigate('/platform', { replace: true });
          else if (role === 'restaurant') {
            if (sessionStorage.getItem('isNewRegistration') === 'true') {
              sessionStorage.removeItem('isNewRegistration');
              navigate('/admin?tab=billing', { replace: true });
            } else {
              navigate('/admin', { replace: true });
            }
          }
          else if (role === 'representative') {
            navigate('/representative', { replace: true });
          }
          else {
            const inviteCode = searchParams.get('inviteCode');
            const targetPath = inviteCode ? `/profile?tab=parchis&inviteCode=${inviteCode}` : '/profile';
            navigate(targetPath, { replace: true });
          }
        }
      }, 5000); // Reduced from 8s for better UX
    } else {
      if (user && appUser) {
        console.log('Auth: Both user and appUser available');
      }
      setShowSpinner(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, appUser, navigate, isRegistered, isResettingPassword]);

  useEffect(() => {
    if (user && appUser && !isRegistered && !isResettingPassword && !isRegisteringRef.current) {
      setIsRedirecting(true);
      console.log('Auth: Redirecting user based on role', appUser.role);
      
      const role = appUser.role;
      if (role === 'admin') {
        navigate('/platform', { replace: true });
      } else if (role === 'restaurant') {
        if (sessionStorage.getItem('isNewRegistration') === 'true') {
          sessionStorage.removeItem('isNewRegistration');
          navigate('/admin?tab=billing', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else if (role === 'driver') {
        navigate('/driver', { replace: true });
      } else if (role === 'representative') {
        navigate('/representative', { replace: true });
      } else {
        // For client users, verify if profile is missing critical fields
        const isProfileComplete = !!(appUser.displayName && appUser.phone && appUser.birthDate);
        const inviteCode = searchParams.get('inviteCode');
        
        if (inviteCode) {
          navigate(`/profile?tab=parchis&inviteCode=${inviteCode}`, { replace: true });
        } else if (!isProfileComplete) {
          navigate('/profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, appUser, navigate, isRegistered, isResettingPassword]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const msg = 'Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). Por favor, configúralas en el panel de Secrets.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success('Contraseña actualizada exitosamente');
        setIsResettingPassword(false);
        setIsLogin(true);
        setLoading(false);
        navigate('/auth?mode=login', { replace: true });
      } else if (isForgotPassword) {
        const productionUrl = platformSettings?.productionUrl || "https://ais-pre-vwxtz7i5u6etdfshis6t4s-122130928241.us-east1.run.app";
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${productionUrl}/#/auth?mode=reset_password`,
        });
        if (error) throw error;
        toast.success('Se ha enviado un enlace de recuperación');
        setIsForgotPassword(false);
        setIsLogin(true);
        setLoading(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Don't set loading to false, let the redirect handle unmounting
      } else {
        let emailExists = false;
        const checkEmailWithRetry = async (retries = 1): Promise<boolean> => {
          try {
            const { data, error: checkError } = await Promise.race([
              supabase.rpc('check_email_exists', { check_email: email }),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout checking email')), 15000))
            ]);

            if (checkError) throw checkError;
            return !!data;
          } catch (rpcErr: any) {
            if (retries > 0 && (rpcErr.message === 'Timeout checking email' || rpcErr.message === 'Failed to fetch')) {
              console.warn('Auth: Retrying email check after error:', rpcErr.message);
              return checkEmailWithRetry(retries - 1);
            }
            // Log as warning since this is non-critical optimization
            if (rpcErr?.message !== 'Failed to fetch' && !rpcErr?.message?.includes('Failed to fetch') && !rpcErr?.message?.includes('Supabase no está configurado')) {
              console.warn('Auth: Email check optimization skipped (timeout or error):', rpcErr.message || rpcErr);
            }
            return false;
          }
        };

        emailExists = await checkEmailWithRetry();

        if (emailExists) {
          throw new Error('Este correo electrónico ya está registrado.');
        }

        isRegisteringRef.current = true;

        if (role === 'driver') {
          if (!documentPhoto || !licensePhoto || !profilePhoto) {
            throw new Error('Por favor sube todos los documentos obligatorios (Cédula, Licencia y Foto de Perfil)');
          }
        }

        const signUpData: any = {
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: role,
            }
          }
        };

        if (role === 'restaurant') {
          signUpData.options.data = {
            ...signUpData.options.data,
            restaurant_name: name,
            address,
            department,
            city,
            phone,
            restaurant_type: restaurantType,
            business_type: businessType,
            business_category: businessCategory,
            handles_promotions: handlesPromotions,
            has_delivery: hasDelivery
          };
        } else if (role === 'driver') {
          signUpData.options.data = {
            ...signUpData.options.data,
            vehicle_type: vehicleType,
            license_plate: licensePlate,
            phone: phone
          };
        }

        const { data, error: signUpError } = await supabase.auth.signUp(signUpData);
        if (signUpError) throw signUpError;
        
        if (data.user) {
          console.log('Auth: User created, creating profiles...', data.user.id);
          
          // Link Referral if present
          const refCode = searchParams.get('ref');
          if (refCode && role === 'user') {
            try {
              const { referralService } = await import('../services/referralService');
              // For platform link, we use a generic ID or let service handle it.
              // In this case, we'll use "platform" as restaurantId if not context-aware.
              await referralService.linkReferral(data.user.id, refCode, 'platform');
              console.log('Auth: Referral linked successfully');
            } catch (linkErr) {
              console.error('Auth: Error linking referral:', linkErr);
            }
          }

          // Create app_user profile
          const { error: userError } = await supabase.from('app_users').upsert({
            id: data.user.id,
            email: email,
            role: role,
            status: 'active',
            display_name: name
          });
          
          if (userError) {
            console.error('Auth: Error creating app_user profile:', userError);
            // We continue anyway as the trigger might have handled it
          }

          if (role === 'restaurant') {
            console.log('Auth: Creating restaurant profile...');
            const { error: restError } = await db.saveRestaurant({
              id: '',
              name: name,
              type: restaurantType,
              businessCategory: businessCategory,
              description: 'El mejor lugar para comer.',
              logo: '',
              coverImage: '',
              phone: phone,
              address: address,
              department: department,
              city: city,
              businessType: businessType,
              handlesPromotions: handlesPromotions,
              hasDelivery: hasDelivery,
              banners: []
            }, data.user.id);
            
            if (restError) {
              console.error('Auth: Error creating restaurant profile:', restError);
            }
          }

          if (role === 'driver') {
            console.log('Auth: Creating driver profile...');
            
            const uploadFile = async (file: File, path: string) => {
              const fileExt = file.name.split('.').pop();
              const fileName = `${data.user.id}/${path}_${Math.random()}.${fileExt}`;
              const { error: uploadError, data: uploadData } = await supabase.storage
                .from('driver-documents')
                .upload(fileName, file);
              
              if (uploadError) throw uploadError;
              const { data: { publicUrl } } = supabase.storage
                .from('driver-documents')
                .getPublicUrl(fileName);
              return publicUrl;
            };

            let docUrl = '';
            let licUrl = '';
            let tecUrl = '';
            let profUrl = '';

            try {
              if (documentPhoto) docUrl = await uploadFile(documentPhoto, 'document');
              if (licensePhoto) licUrl = await uploadFile(licensePhoto, 'license');
              if (tecnomecanicaPhoto) tecUrl = await uploadFile(tecnomecanicaPhoto, 'tecnomecanica');
              if (profilePhoto) profUrl = await uploadFile(profilePhoto, 'profile');
            } catch (uploadErr) {
              console.error('Error uploading driver documents:', uploadErr);
              toast.error('Error al subir los documentos. El perfil se creó pero faltan archivos.');
            }

            const { error: driverError } = await supabase.from('driver_profiles').upsert({
              id: data.user.id,
              vehicle_type: vehicleType,
              license_plate: licensePlate,
              vehicle_color: vehicleColor,
              document_number: documentNumber,
              birth_date: birthDate,
              document_photo: docUrl,
              license_photo: licUrl,
              tecnomecanica_photo: tecUrl,
              profile_photo: profUrl,
              approval_status: 'pending',
              is_online: false
            });
            
            if (driverError) {
              console.error('Auth: Error creating driver profile:', driverError);
            }
          }
        }
        
        console.log('Auth: Registration process completed for role:', role);
        const inviteCode = searchParams.get('inviteCode');

        if (role === 'restaurant') {
          sessionStorage.setItem('isNewRegistration', 'true');
          setIsRedirecting(true);
          toast.success('Restaurante registrado con éxito. Redirigiendo a los planes...');
          setTimeout(() => {
            navigate('/admin?tab=billing', { replace: true });
          }, 1500);
        } else if (role === 'driver') {
          setIsRedirecting(true);
          setTimeout(() => {
            navigate('/driver', { replace: true });
          }, 1500);
        } else {
          setIsRedirecting(true);
          toast.success('Registro exitoso.');
          setTimeout(() => {
            if (inviteCode) {
              navigate(`/profile?tab=parchis&inviteCode=${inviteCode}`, { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 1500);
        }
      }
    } catch (err: any) {
      isRegisteringRef.current = false;
      let errorMessage = err.message || 'Ocurrió un error durante la autenticación';
      
      if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Has excedido el límite de intentos. Por favor, intenta de nuevo más tarde.';
      } else if (errorMessage === 'Este correo electrónico ya está registrado.') {
        // Special handling for already registered email
        errorMessage = 'Este correo electrónico ya está en uso. Por favor, utiliza otro correo electrónico o inicia sesión si ya tienes una cuenta.';
      } else if (errorMessage.includes('Email not confirmed')) {
        // Special handling for unconfirmed email during login
        errorMessage = 'Debes confirmar tu correo electrónico. Por favor, revisa la bandeja de entrada del correo que usaste en el registro y confirma tu cuenta dando clic en el enlace de confirmación.';
      } else if (errorMessage === 'Failed to fetch' || errorMessage.includes('Failed to fetch') || errorMessage.includes('Supabase no está configurado')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet o la configuración de Supabase (URL y Anon Key).';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales de inicio de sesión inválidas. Por favor, verifica tu correo y contraseña.';
      } else {
        console.error('Auth: Authentication error details:', {
          code: err.code,
          message: err.message,
          status: err.status,
          role,
          email
        });
      }
      
      setError(errorMessage);
      
      if (errorMessage.includes('ya está en uso') || errorMessage.includes('confirmar tu correo')) {
        toast.info(errorMessage, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
      setLoading(false);
    }
  };

  const transparentImg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==";

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base px-4 py-12">
        <div className="max-w-md w-full relative p-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-card text-white rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
          >
          <div className="h-40 relative overflow-hidden bg-surface-variant">
            <img 
              src={platformSettings?.paymentGateways?.authClientBanner || transparentImg} 
              alt="Success" 
              className="w-full h-full object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex justify-center translate-y-1/2">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border-4 border-white">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
          </div>
          
          <div className="p-10 pt-14">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">¡Bienvenido!</h2>
            <p className="text-white/50 font-medium mb-6">
              Tu registro en <span className="text-orange-600 font-bold">SmartBite</span> ha sido exitoso.
            </p>
            <div className="bg-[#D4AF37]/5 p-6 rounded-2xl mb-8 text-left border border-[#D4AF37]/20">
              <p className="text-sm text-[#D4AF37] font-bold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFDF00]" /> Acción requerida:
              </p>
              <p className="text-sm text-orange-700">
                Hemos enviado un correo a <span className="font-bold">{email}</span>. Por favor, verifícalo para activar tu cuenta.
              </p>
            </div>
            <button
              onClick={() => {
                setIsRegistered(false);
                setIsLogin(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/20 transition-all"
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

  if (authLoading || showSpinner || isRedirecting) {
    return (
      <div className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-[99999] overflow-hidden text-white font-sans">
        <div className="absolute inset-0 bg-radial-gradient from-orange-600/20 via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-28 h-28 glass-card p-3 rounded-[2rem] shadow-2xl shadow-orange-500/10 border-4 border-white/20 mb-8"
          >
            {platformSettings?.appLogo ? (
              <img 
                src={platformSettings.appLogo} 
                alt={platformSettings?.appName || ""} 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector(".fallback-text");
                    if (fallback) fallback.classList.remove("hidden");
                  }
                }}
              />
            ) : (
             <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-[1.5rem] flex items-center justify-center font-black text-white text-4xl">
               {(platformSettings?.appName || "M").charAt(0).toUpperCase()}
             </div>
            )}
            <div className="fallback-text hidden w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-[1.5rem] flex items-center justify-center font-black text-white text-4xl">
              {(platformSettings?.appName || "M").charAt(0).toUpperCase()}
            </div>
          </motion.div>

          {!platformSettings?.appLogo && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-black bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent mb-2"
            >
              {platformSettings?.appName || ""}
            </motion.h2>
          )}

          <div className="w-24 h-1 bg-surface-light rounded-full overflow-hidden mx-auto mb-4 relative">
            <motion.div 
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute w-2/3 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            />
          </div>
          <p className="text-xs text-white/50 font-bold tracking-wider uppercase animate-pulse">
            Configurando perfil seguro...
          </p>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className="min-h-[100svh] flex flex-col items-center justify-center bg-[#0B0B0B] relative overflow-hidden text-white font-sans pb-10">
        {/* Background Base */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80" 
            alt="Dining Background"
            className="w-full h-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/80 to-[#0B0B0B]/30" />
        </div>

        <div className="z-10 w-full max-w-sm flex flex-col items-center gap-12 mt-[-10vh]">
          {/* Center Logo Section */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <h1 className="text-[50px] font-sans font-normal tracking-tight text-white drop-shadow-md mb-2 flex flex-col items-center gap-0">
              <span>Smart<span className="font-bold text-[#FF8A00]">Bite</span></span>
            </h1>
            
            <p className="text-center text-[16px] text-[#A0A0A0] leading-relaxed px-4 font-medium max-w-[280px]">
              Disfruta, gana monedas de oro <br /> y recibe increíbles premios
            </p>
          </motion.div>

          {/* Bottom Actions */}
          <div className="w-full px-6 space-y-4">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                setIsLogin(true);
                setShowLanding(false);
              }}
              className="w-full py-4 text-[16px] font-bold text-white rounded-full transition-transform active:scale-95 shadow-[0_8px_25px_rgba(255,138,0,0.3)]"
              style={{ background: 'linear-gradient(135deg, #FF8A00 0%, #FFB347 100%)' }}
            >
              Iniciar sesión
            </motion.button>
            
            <motion.button
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 }}
               onClick={() => {
                 setIsLogin(false);
                 setShowLanding(false);
               }}
               className="w-full py-4 text-[16px] font-bold text-white rounded-full border border-white/20 hover:bg-white/5 transition-all text-center active:scale-95"
            >
              Registrarse
            </motion.button>
          </div>
          
          {/* Promo Section: Gamification Explanation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full max-w-sm px-6 mt-4 flex flex-col items-center gap-4"
          >
            <div className="w-full h-32 rounded-[24px] overflow-hidden relative shadow-lg">
              <img 
                src={platformSettings?.authPageImage || platformSettings?.paymentGateways?.authPageImage || "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?auto=format&fit=crop&q=80"} 
                alt="Chica feliz ganando Monedas de Oro"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/60 to-transparent mix-blend-multiply" />
              <div className="absolute top-2 right-2 bg-[#FF8A00] text-white font-black text-[10px] px-2 py-1 rounded-full shadow border border-yellow-300/50">
                ⭐ GANA MÁS
              </div>
            </div>
            
            <div className="bg-white rounded-[20px] p-5 w-full text-center border border-neutral-100 shadow-sm">
              <h3 className="text-[14px] font-black text-neutral-900 mb-2 leading-tight">
                {platformSettings?.authPromoTitle || "Gana Monedas de Oro en cada pedido 🪙"}
              </h3>
              <p className="text-[12px] text-neutral-600 font-medium leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: platformSettings?.authPromoDescription || "Cada vez que pidas en tus restaurantes favoritos, ganarás Monedas de Oro automáticamente. ¡Úsalas para canjear productos gratis o compra giros especiales en nuestra increíble <strong>Ruleta Pay</strong> para ganar grandes sorpresas!" }}>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] relative overflow-hidden py-12 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-200/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#D4AF37]/20 blur-[100px]" />
      </div>

      <div className={`w-full relative z-10 transition-all duration-300 ${!isLogin && !isForgotPassword && !isResettingPassword && (role === 'restaurant' || role === 'driver') ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="relative p-1">
          {/* Main Card Container */}
          <div className="relative glass-card text-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-[#FFDF00]/60 overflow-hidden bg-[#111111]/90 backdrop-blur-2xl">
            
            {/* Card Inner Background Image - Young People */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543352634-99a5d50ae78e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}
            />
            
            <div className="relative z-10 w-full">
              {/* Header Banner Image */}
              <div className="relative h-40">
              <div className="absolute inset-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : `register-${role}`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-surface-variant"
                  >
                    <img 
                      src={
                        isResettingPassword ? transparentImg :
                        isForgotPassword ? transparentImg :
                        isLogin ? (platformSettings?.paymentGateways?.authClientBanner || transparentImg) :
                        role === 'restaurant' ? (platformSettings?.paymentGateways?.authRestaurantBanner || transparentImg) :
                        role === 'driver' ? (platformSettings?.paymentGateways?.authDriverBanner || transparentImg) :
                        (platformSettings?.paymentGateways?.authClientBanner || transparentImg)
                      }
                      alt="Banner"
                      className="w-full h-full object-cover opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/20 to-transparent" />
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <div className="absolute top-4 right-4 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFDF00] animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Plataforma Premium</span>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-sm mb-1.5 font-sans">
                  {isResettingPassword ? 'Nueva Contraseña' : 
                   isForgotPassword ? 'Recuperar Cuenta' : 
                   isLogin ? '¡Hola de nuevo!' : 
                   role === 'restaurant' ? 'Tu Negocio' : 
                   role === 'driver' ? 'Gana Dinero' : 
                   'Crea tu Cuenta'}
                </h2>
                <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em]">
                  {isLogin ? 'Ingresa tus credenciales para continuar' : 'Completa los datos para empezar'}
                </p>
              </div>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
                      error.includes('ya está en uso') || error.includes('confirmar tu correo')
                        ? 'bg-blue-50 border-blue-100 text-blue-800'
                        : 'bg-red-50 border-red-100 text-red-800'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${
                      error.includes('ya está en uso') || error.includes('confirmar tu correo')
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <Utensils className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLogin && !isForgotPassword && !isResettingPassword && (
                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-3 gap-3 p-1.5 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
                    {[
                      { id: 'user', label: 'Cliente', icon: UserIcon, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/30' },
                      { id: 'restaurant', label: 'Negocio', icon: Store, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/30' },
                      { id: 'driver', label: 'Repartidor', icon: Car, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/30' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as any)}
                        className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                          role === r.id 
                            ? `${r.bg} ${r.border} ${r.color} shadow-lg shadow-[#D4AF37]/10 scale-[1.02]` 
                            : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5 text-white/50'
                        }`}
                      >
                        <r.icon className={`w-5 h-5 ${role === r.id ? r.color : 'text-white/50'}`} />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    {!isLogin && !isForgotPassword && !isResettingPassword && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Nombre Completo</label>
                        <div className="relative group/input">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] focus:ring-4 focus:ring-[#FFDF00]/10 transition-all"
                            placeholder={role === 'restaurant' ? 'Nombre Comercial del Negocio' : 'Ej: Juan Pérez'}
                          />
                        </div>
                      </div>
                    )}

                    {!isLogin && !isForgotPassword && !isResettingPassword && role === 'restaurant' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 p-6 sm:p-8 bg-[#D4AF37]/5 rounded-[2rem] border border-[#D4AF37]/20 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Store className="w-24 h-24 text-[#D4AF37]" />
                        </div>
                        <div className="relative z-10 space-y-5">
                          <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-4 h-px bg-[#D4AF37]/50" />
                            Detalles del Negocio
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Departamento</label>
                              <select
                                required
                                value={department}
                                onChange={(e) => {
                                  setDepartment(e.target.value);
                                  setCity('');
                                }}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all appearance-none"
                              >
                                <option value="">Selecciona...</option>
                                {getDepartments().map(dep => <option key={dep} value={dep}>{dep}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Ciudad/Municipio</label>
                              <select
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                disabled={!department}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all appearance-none disabled:opacity-50"
                              >
                                <option value="">Selecciona...</option>
                                {department && getCitiesByDepartment(department).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Dirección</label>
                              <div className="relative group/input">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                                <input
                                  type="text"
                                  required
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                  placeholder="Calle 123 #45-67"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Teléfono</label>
                              <div className="relative group/input">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                  placeholder="300 123 4567"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Modelo de Negocio</label>
                              <select
                                value={businessCategory}
                                onChange={(e) => setBusinessCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all appearance-none cursor-pointer"
                              >
                                {platformSettings?.businessCategories && platformSettings.businessCategories.length > 0 ? (
                                  platformSettings.businessCategories.map((cat: any) => {
                                    const visual = getCategoryVisual(cat.id);
                                    return (
                                      <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white py-2">
                                        {visual.emoji} {cat.title.replace("Explorar ", "")}
                                      </option>
                                    );
                                  })
                                ) : (
                                  <>
                                    <option value="restaurant" className="bg-neutral-900 text-white">🍽️ Restaurante / Comidas</option>
                                    <option value="grocery" className="bg-neutral-900 text-white">🥦 Verdulería / Frutería</option>
                                    <option value="liquor" className="bg-neutral-900 text-white">🍾 Licores / Bebidas</option>
                                    <option value="salsamentaria" className="bg-neutral-900 text-white">🥓 Salsamentaría / Charcutería</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Especialidad</label>
                              <select
                                value={restaurantType}
                                onChange={(e) => setRestaurantType(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all appearance-none cursor-pointer"
                              >
                                {restaurantCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Tipo</label>
                              <select
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value as any)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all appearance-none cursor-pointer"
                              >
                                <option value="physical">Local Físico</option>
                                <option value="online">Solo Domicilios</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-4 p-4 bg-orange-100/50 rounded-2xl border border-orange-200">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-lg text-white">
                                   <Star className="w-5 h-5 flex-shrink-0" />
                                </div>
                                <p className="text-sm text-orange-900 font-medium leading-relaxed">
                                   Al registrarte se te asignará automáticamente el <strong className="font-extrabold text-orange-600">Plan Gratis por 30 días</strong> (Limitado a categorías y productos). 
                                   <br/>Si deseas más funciones, no te preocupes, luego podrás actualizar a un plan de <b>pago fijo</b> o <b>comisiones</b> desde tu panel.
                                </p>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!isLogin && !isForgotPassword && !isResettingPassword && role === 'driver' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-6 p-6 sm:p-8 bg-[#D4AF37]/5 rounded-[2rem] border border-[#D4AF37]/20 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Car className="w-24 h-24 text-[#D4AF37]" />
                        </div>
                        <div className="relative z-10 space-y-6">
                          <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-4 h-px bg-[#D4AF37]/50" />
                            Información Personal
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">N° Documento</label>
                              <input
                                type="text"
                                required
                                value={documentNumber}
                                onChange={(e) => setDocumentNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                placeholder="12345678"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Fecha Nacimiento</label>
                              <DateSelector
                                value={birthDate}
                                onChange={(dateStr) => setBirthDate(dateStr)}
                                variant="dark"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Teléfono</label>
                              <div className="relative group/input">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                  placeholder="300 123 4567"
                                />
                              </div>
                            </div>
                          </div>

                          <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center gap-2 pt-2">
                            <span className="w-4 h-px bg-[#D4AF37]/50" />
                            Detalles del Vehículo
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Tipo</label>
                              <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value as any)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all cursor-pointer"
                              >
                                <option value="motorcycle" className="bg-neutral-900 text-white">Motocicleta</option>
                                <option value="motocarro" className="bg-neutral-900 text-white">Motocarro</option>
                                <option value="bicycle" className="bg-neutral-900 text-white">Bicicleta</option>
                                <option value="car" className="bg-neutral-900 text-white">Automóvil</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Placa</label>
                              <input
                                type="text"
                                value={licensePlate}
                                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                placeholder="ABC-123"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Color del Vehículo</label>
                              <input
                                type="text"
                                value={vehicleColor}
                                onChange={(e) => setVehicleColor(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] transition-all"
                                placeholder="Ej: Rojo, Negro"
                              />
                            </div>
                          </div>

                          <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center gap-2 pt-2">
                            <span className="w-4 h-px bg-[#D4AF37]/50" />
                            Documentación (Fotos)
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 ml-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Cédula (Obligatorio)</label>
                                <ImageSizeInfo type="document" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={(e) => setDocumentPhoto(e.target.files?.[0] || null)}
                                className="w-full text-xs text-white/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 ml-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Licencia (Obligatorio)</label>
                                <ImageSizeInfo type="document" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={(e) => setLicensePhoto(e.target.files?.[0] || null)}
                                className="w-full text-xs text-white/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 ml-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Foto Perfil (Obligatorio)</label>
                                <ImageSizeInfo type="profile" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                required
                                onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                                className="w-full text-xs text-white/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 ml-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Tecnomecánica (Opcional)</label>
                                <ImageSizeInfo type="document" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setTecnomecanicaPhoto(e.target.files?.[0] || null)}
                                className="w-full text-xs text-white/50 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!isResettingPassword && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-2">Correo Electrónico</label>
                        <div className="relative group/input">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] focus:ring-4 focus:ring-[#FFDF00]/10 transition-all"
                            placeholder="ejemplo@correo.com"
                          />
                        </div>
                      </div>
                    )}

                    {!isForgotPassword && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Contraseña</label>
                          {isLogin && !isResettingPassword && (
                            <button
                              type="button"
                              onClick={() => setIsForgotPassword(true)}
                              className="text-[10px] text-orange-600 hover:text-orange-700 font-black uppercase tracking-widest transition-colors"
                            >
                              ¿Olvidaste tu clave?
                            </button>
                          )}
                        </div>
                        <div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFDF00] z-10 pointer-events-none transition-all duration-300 group-focus-within/input:scale-110" />
                          <input
                            type="password"
                            required={!isForgotPassword}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-[#FFDF00] focus:ring-4 focus:ring-[#FFDF00]/10 transition-all"
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-6 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#E0BFB8] hover:from-[#C5A059] hover:to-[#D4AF37] text-black font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isResettingPassword ? 'Actualizar Clave' : isForgotPassword ? 'Enviar Enlace' : isLogin ? 'Entrar Ahora' : 'Crear mi Cuenta'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {!isResettingPassword && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isForgotPassword) setIsForgotPassword(false);
                      else setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="text-xs font-bold text-white/50 hover:text-orange-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    {isForgotPassword ? (
                      <><ArrowLeft className="w-3 h-3" /> Volver al inicio</>
                    ) : (
                      isLogin ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'
                    )}
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
