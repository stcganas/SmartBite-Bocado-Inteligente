import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, RefreshCw, CheckCircle, XCircle, ChevronRight, MessageSquare, 
  MapPin, User, Mail, Phone, Shield, DollarSign, Award, Briefcase, FileText, 
  ExternalLink, ArrowUpRight, TrendingUp, Filter, Check, X, Star, Sparkles, Building, BarChart2,
  Clock, Key, ArrowLeft
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { db, getLocalTickets, saveLocalTickets } from "../store/db";
import { toast } from "sonner";

interface ParsedApplication {
  nombreCompleto: string;
  correo: string;
  whatsapp: string;
  edad: string;
  ciudad: string;
  departamento: string;
  profesion: string;
  experienciaVentas: string;
  experienciaPlataformas: string;
  nivelTecnologico: string;
  trabajadoRestaurantes: string;
  disponeComputador: string;
  motivo: string;
}

export function AdminRepresentativeManagement() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  
  // Advanced filters state
  const [filterSalesExp, setFilterSalesExp] = useState<string>("all");
  const [filterPlatformExp, setFilterPlatformExp] = useState<string>("all");
  const [filterTechLevel, setFilterTechLevel] = useState<string>("all");
  const [filterComputer, setFilterComputer] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  // Selection process action state
  const [actionLoading, setActionLoading] = useState(false);
  const [promoOptions, setPromoOptions] = useState({
    promoteRole: true,
    giveBonus: true,
    bonusAmount: 50000,
    increaseInvites: true,
    vipInvites: 9999
  });

  // Access credentials assignment state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalEmail, setApprovalEmail] = useState("");
  const [approvalPassword, setApprovalPassword] = useState("");
  const [approvalName, setApprovalName] = useState("");
  const [approvalPhone, setApprovalPhone] = useState("");

  // Credentials presentation and WhatsApp share state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [lastCreatedCreds, setLastCreatedCreds] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });

  // Active representatives of the platform management states
  const [activeSubTab, setActiveSubTab] = useState<"ambassadors" | "applicants">("ambassadors");
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [allAppUsers, setAllAppUsers] = useState<any[]>([]);
  const [repsLoading, setRepsLoading] = useState(false);
  const [selectedRepForDetails, setSelectedRepForDetails] = useState<any | null>(null);
  
  // Balance adjustment modal states
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [repToAdjustBalance, setRepToAdjustBalance] = useState<any | null>(null);
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] = useState("");
  const [balanceAdjustmentType, setBalanceAdjustmentType] = useState<"add" | "set">("add");
  const [balanceAdjustmentNotes, setBalanceAdjustmentNotes] = useState("");

  // Existing Rep Credentials Management states
  const [showManageCredentialsModal, setShowManageCredentialsModal] = useState(false);
  const [repToManageCredentials, setRepToManageCredentials] = useState<any | null>(null);
  const [newRepPassword, setNewRepPassword] = useState("");

  const handleStatusChangeClick = (appId: string, userId: string, newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    if (newStatus === "resolved") {
      setApprovalEmail(selectedApp?.parsed?.correo || "");
      setApprovalName(selectedApp?.parsed?.nombreCompleto || "");
      setApprovalPhone(selectedApp?.parsed?.whatsapp || "");
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      setApprovalPassword(`SmartBite${randomDigits}!`);
      setShowApprovalModal(true);
    } else {
      handleUpdateStatus(appId, userId, newStatus);
    }
  };

  const handleCreateRepresentative = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/create-representative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: approvalEmail,
          password: approvalPassword,
          name: approvalName,
          phone: approvalPhone,
          ticketId: selectedApp?.id
        })
      });
      
      let result: any = {};
      const responseText = await response.text();
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { error: responseText || "Error de red o formato de respuesta desconocido." };
      }

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el representante.");
      }
      toast.success(result.message || "¡Representante creado y aprobado con acceso oficial!");
      
      // Store credentials and show WhatsApp sharing modal
      setLastCreatedCreds({
        name: approvalName,
        email: approvalEmail,
        password: approvalPassword,
        phone: approvalPhone
      });
      setShowApprovalModal(false);
      setShowCredentialsModal(true);
      
      await fetchApplications();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al registrar oficial del representante");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRepPassword = async () => {
    if (!repToManageCredentials || !newRepPassword.trim()) {
      toast.error("Por favor ingresa una contraseña válida.");
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: repToManageCredentials.id,
          newPassword: newRepPassword.trim()
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la contraseña");
      }
      
      toast.success("¡Credenciales de acceso actualizadas con éxito!");
      
      // Update local state to reflect the new password
      const updatedReps = representatives.map(r => 
        r.id === repToManageCredentials.id 
          ? { ...r, raw_password: newRepPassword.trim() } 
          : r
      );
      setRepresentatives(updatedReps);
      
      setRepToManageCredentials({ ...repToManageCredentials, raw_password: newRepPassword.trim() });
      setNewRepPassword("");
    } catch (err: any) {
      console.error("Error setting new password:", err);
      toast.error(err.message || "No se pudieron actualizar las credenciales.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchRepresentativesData = async () => {
    setRepsLoading(true);
    try {
      // 0. Fetch raw passwords from metadata
      let credentialsMap: Record<string, string> = {};
      try {
        const cRes = await fetch("/api/admin/representatives/credentials");
        if (cRes.ok) {
           const cData = await cRes.json();
           if (cData.success && cData.credentials) {
             credentialsMap = cData.credentials;
           }
        }
      } catch (cErr) {
        console.warn("Could not fetch credentials map:", cErr);
      }

      // 1. Fetch all app_users
      const { data: users, error: uErr } = await supabase
        .from("app_users")
        .select("*");
        
      if (uErr) {
        console.warn("Error fetching users, checking offline bypass:", uErr);
      }
      
      // Inject raw_passwords
      const safeUsers = (users || []).map(u => ({
        ...u,
        raw_password: credentialsMap[u.id] || u.raw_password
      }));
      setAllAppUsers(safeUsers);
      
      // Filter users with role === 'representative'
      const reps = safeUsers.filter((u: any) => u.role === "representative");
      
      // 2. Fetch all restaurants
      const { data: rests, error: rErr } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (rErr) {
        console.warn("Error fetching restaurants for metrics calculation:", rErr);
      }
      
      const safeRests = rests || [];
      setAllRestaurants(safeRests);
      
      // 3. Fetch all withdrawal requests
      const { data: wds, error: wErr } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (wErr) {
        console.warn("Error fetching withdrawal requests:", wErr);
      }
      
      const safeWds = wds || [];
      setWithdrawals(safeWds);
      
      // 4. Map and calculate comprehensive statistics / relationships
      const repsWithMetrics = reps.map((rep: any) => {
        // Find users referred by this rep
        const referredUserIds = safeUsers
          .filter((u: any) => u.referred_by === rep.id)
          .map((u: any) => u.id);
          
        // Find affiliated restaurants owned by referred users OR by email
        const affiliatedRests = safeRests.filter((r: any) => 
          referredUserIds.includes(r.owner_id) || r.owner_email?.trim() === rep.email?.trim()
        );
        
        // Find withdrawal history of this representative
        const repWithdrawals = safeWds.filter((w: any) => w.user_id === rep.id);
        const pendingWdCount = repWithdrawals.filter((w: any) => w.status === "pending" || w.status?.toLowerCase() === "pending").length;
        
        return {
          ...rep,
          affiliatedCount: affiliatedRests.length,
          restaurants: affiliatedRests,
          withdrawals: repWithdrawals,
          referredUsersCount: referredUserIds.length,
          pendingWdCount
        };
      });
      
      setRepresentatives(repsWithMetrics);
    } catch (err) {
      console.error("Error in fetchRepresentativesData:", err);
    } finally {
      setRepsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (wdId: string, repId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status: "approved" })
        .eq("id", wdId);
        
      if (error) throw error;
      
      // Send interactive system push notification
      await db.saveNotification({
        userId: repId,
        title: "¡Retiro Aprobado Exitosamente! 🤑💸",
        body: `¡Excelentes noticias! Tu solicitud de retiro por $${amount.toLocaleString()} COP ha sido procesada y aprobada con éxito. El dinero ya fue enviado a tu cuenta bancaria registrada. ¡Sigue así! 🚀✨`,
        type: "billing"
      }).catch(e => console.warn("Error sending withdrawal push summary:", e));
      
      toast.success("¡Solicitud de retiro aprobada y marcada como completada!");
      fetchRepresentativesData();
    } catch (err: any) {
      console.error("Error approving withdrawal:", err);
      toast.error(err.message || "Error al procesar la aprobación del retiro");
    }
  };

  const handleRejectWithdrawal = async (wdId: string, repId: string, amount: number) => {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status: "rejected" })
        .eq("id", wdId);
        
      if (error) throw error;
      
      // Restore pre-deducted balance dynamically
      const repToRestore = allAppUsers.find(u => u.id === repId);
      if (repToRestore) {
        const currentBal = repToRestore.referral_balance || 0;
        await supabase
          .from("app_users")
          .update({ referral_balance: currentBal + amount })
          .eq("id", repId);
      }
      
      // Send interactive system push notification
      await db.saveNotification({
        userId: repId,
        title: "Atención: Retiro Rechazado ⚠️🛑",
        body: `Lamentablemente tu solicitud de retiro por $${amount.toLocaleString()} COP ha sido rechazada en esta ocasión. Tu saldo retenido ha sido devuelto a tu balance comercial de forma segura. Si tienes dudas, contáctanos. 💬🤝`,
        type: "billing"
      }).catch(e => console.warn("Error saving withdrawal rejection notification:", e));
      
      toast.success("¡Solicitud de retiro rechazada y saldo reintegrado al embajador!");
      fetchRepresentativesData();
    } catch (err: any) {
      console.error("Error rejecting withdrawal:", err);
      toast.error(err.message || "Error al rechazar retiro");
    }
  };

  const handleAdjustRepBalance = async () => {
    if (!repToAdjustBalance) return;
    const amount = parseFloat(balanceAdjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    
    setActionLoading(true);
    try {
      const currentBal = repToAdjustBalance.referral_balance || 0;
      const newBal = balanceAdjustmentType === "add" ? currentBal + amount : amount;
      
      const { error } = await supabase
        .from("app_users")
        .update({ referral_balance: newBal })
        .eq("id", repToAdjustBalance.id);
        
      if (error) throw error;
      
      // Log notification
      await db.saveNotification({
        userId: repToAdjustBalance.id,
        title: "¡Abono de Comisión Confirmado! 💼🎉",
        body: `¡Felicidades! Se ha cargado un bono especial directo a tu cuenta por $${amount.toLocaleString()} COP. Concepto: "${balanceAdjustmentNotes || "Incentivo extraordinario de administrador"}". ¡Gran trabajo! 🌟📈`,
        type: "billing"
      }).catch(e => console.warn("Notification logging failed:", e));
      
      toast.success("¡Saldo del embajador comercial modificado con éxito!");
      setShowBalanceModal(false);
      setBalanceAdjustmentAmount("");
      setBalanceAdjustmentNotes("");
      setRepToAdjustBalance(null);
      fetchRepresentativesData();
    } catch (err: any) {
      console.error("Error setting/adjusting balance:", err);
      toast.error("Error al ajustar balance");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setDbError(null);
    try {
      let data: any[] | null = null;
      let queryError: any = null;

      try {
        // Try beautiful nested join first
        const res = await supabase
          .from("support_tickets")
          .select(`
            id,
            user_id,
            restaurant_id,
            subject,
            description,
            status,
            priority,
            created_at,
            app_users(
              id,
              display_name,
              email,
              phone,
              role,
              status,
              referral_code,
              referral_balance,
              max_referral_invites
            )
          `)
          .ilike('subject', 'Postulación Representante%')
          .order('created_at', { ascending: false });
        
        data = res.data;
        queryError = res.error;
      } catch (innerErr: any) {
        console.warn("Nested join lookup failed, attempting flat direct query fallback...", innerErr);
      }

      // Safe fallback: Query support tickets flat without nested relations in case relationship has foreign-key or schema mismatch errors
      if (queryError || !data) {
        const fallbackRes = await supabase
          .from("support_tickets")
          .select(`
            id,
            user_id,
            restaurant_id,
            subject,
            description,
            status,
            priority,
            created_at
          `)
          .ilike('subject', 'Postulación Representante%')
          .order('created_at', { ascending: false });

        data = fallbackRes.data;
        queryError = fallbackRes.error;
      }

      if (queryError) {
        const errorMsg = queryError.message || "";
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation") || errorMsg.includes("does not exist") || queryError.code === "PGRST116" || queryError.code === "42P01") {
          console.info("Supabase support_tickets missing. Loading candidates from localStorage fallback.");
          const localTickets = getLocalTickets();
          data = localTickets.filter((t: any) => t.subject?.includes("Postulación Representante") || t.subject?.includes("Postulacion Representante"));
          queryError = null;
        }
      }

      if (queryError) {
        console.error("Database query error:", queryError);
        setDbError(queryError.message || "Error al conectar con la base de datos");
        setApplications([]);
        return;
      }

      // Merge data with any local tickets to ensure offline and online sync
      const localTickets = getLocalTickets().filter((t: any) => t.subject?.includes("Postulación Representante") || t.subject?.includes("Postulacion Representante"));
      const combinedData = [...(data || [])];
      
      localTickets.forEach((lt: any) => {
        const isDuplicate = combinedData.some((st: any) => 
          st.id === lt.id || 
          (st.subject === lt.subject && st.user_id === lt.user_id)
        );
        if (!isDuplicate) {
          combinedData.push(lt);
        }
      });

      data = combinedData;

      // Map and parse the applications
      const formatted = (data || []).map((t: any) => {
        const parsed = parseDescription(t.description);
        // Fallback fields using app_user if parse didn't find them safely as array or object
        const appUser = t.app_users ? (Array.isArray(t.app_users) ? t.app_users[0] : t.app_users) : null;
        const finalName = parsed.nombreCompleto || appUser?.display_name || "Candidato sin nombre";
        const finalEmail = parsed.correo || appUser?.email || "";
        const finalPhone = parsed.whatsapp || appUser?.phone || "";

        return {
          id: t.id,
          userId: t.user_id,
          rawSubject: t.subject,
          rawDescription: t.description,
          status: t.status, // open, in_progress, resolved, closed
          priority: t.priority,
          createdAt: t.created_at,
          parsed: {
            ...parsed,
            nombreCompleto: finalName,
            correo: finalEmail,
            whatsapp: finalPhone
          },
          appUser: appUser
        };
      });

      setApplications(formatted);
      
      // Keep selected app updated if it's open
      if (selectedApp) {
        const updatedSelected = formatted.find(a => a.id === selectedApp.id);
        if (updatedSelected) {
          setSelectedApp(updatedSelected);
        }
      }
      
      // Also fetch active representatives data in parallel
      fetchRepresentativesData();
    } catch (err: any) {
      console.error("Error fetching representative applications:", err);
      setDbError(err.message || "Error al cargar postulaciones de representantes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoApplicants = async () => {
    setSeeding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const userId = user?.id || "00000000-0000-0000-0000-000000000000";

      const demoApplicants = [
        {
          subject: "Postulación Representante: Andrés Mendoza (Barranquilla)",
          status: "open",
          priority: "high",
          user_id: userId,
          description: `====== POSTULACIÓN REPRESENTANTE COMERCIAL ======
- Nombre completo: Andrés Mendoza
- Correo: andres.mendoza_ventas@gmail.com
- WhatsApp/Tel: 3005551234
- Edad: 28 años
- Ubicación: Barranquilla, Atlántico
- Profesión/Ocupación: Técnico de Mercadeo y Publicidad
- ¿Tiene experiencia en ventas?: Si
- ¿Tiene experiencia en plataformas digitales?: Si
- Nivel de manejo tecnológico: Avanzado
- ¿Ha trabajado con restaurantes?: Si
- ¿Dispone de computador e internet?: Si

====== MOTIVACIÓN ======
Tengo más de 5 años de experiencia trabajando con comercios locales en la costa atlántica. Me apasiona la idea de digitalizar restaurantes y ayudarlos a aumentar sus ventas a través del programa oficial de referidos de Marmet. Soy proactivo y tengo excelentes relaciones comerciales con dueños de restaurantes.`
        },
        {
          subject: "Postulación Representante: Sofía Restrepo (Medellín)",
          status: "in_progress",
          priority: "high",
          user_id: userId,
          description: `====== POSTULACIÓN REPRESENTANTE COMERCIAL ======
- Nombre completo: Sofía Restrepo
- Correo: sofia_restrepo_col@outlook.com
- WhatsApp/Tel: 3108889876
- Edad: 33 años
- Ubicación: Medellín, Antioquia
- Profesión/Ocupación: Gestora de Cuentas B2B
- ¿Tiene experiencia en ventas?: Si
- ¿Tiene experiencia en plataformas digitales?: Si
- Nivel de manejo tecnológico: Avanzado
- ¿Ha trabajado con restaurantes?: No
- ¿Dispone de computador e internet?: Si

====== MOTIVACIÓN ======
Aprecio mucho la comodidad y velocidad de las nuevas aplicaciones de delivery y gastronomía. Deseo entrenarme, conocer la metodología comercial y salir a afiliar a los mejores restaurantes de Medellín, El Poblado y Laureles para posicionar a SmartBite como líder de la región.`
        },
        {
          subject: "Postulación Representante: Juan Carlos Gómez (Bogotá)",
          status: "resolved",
          priority: "medium",
          user_id: userId,
          description: `====== POSTULACIÓN REPRESENTANTE COMERCIAL ======
- Nombre completo: Juan Carlos Gómez
- Correo: jc.gomez_agency@hotmail.com
- WhatsApp/Tel: 3204445566
- Edad: 42 años
- Ubicación: Bogotá, Cundinamarca
- Profesión/Ocupación: Distribuidor de Alimentos Independiente
- ¿Tiene experiencia en ventas?: Si
- ¿Tiene experiencia en plataformas digitales?: No
- Nivel de manejo tecnológico: Intermedio
- ¿Ha trabajado con restaurantes?: Si
- ¿Dispone de computador e internet?: Si

====== MOTIVACIÓN ======
Trabajo diariamente vendiendo insumos y empaques desechables a restaurantes en Bogotá. Conozco a más de 120 administradores y dueños de locales gastronómicos. Al convertirme en representante, podré ofrecerles la plataforma integral de SmartBite, ganando los incentivos de la red y ayudando a resolver sus necesidades digitales.`
        }
      ];

      // Always store locally first so it definitely is immediately available
      const currentLocal = getLocalTickets();
      const updatedLocal = [...currentLocal];

      for (const applicant of demoApplicants) {
        const localId = `ticket_demo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        // Prevent duplicates
        if (!updatedLocal.some((lt: any) => lt.subject === applicant.subject)) {
          updatedLocal.push({
            id: localId,
            user_id: applicant.user_id,
            restaurant_id: null,
            subject: applicant.subject,
            description: applicant.description,
            status: applicant.status,
            priority: applicant.priority,
            created_at: new Date().toISOString()
          });
        }

        // Also try inserting to Supabase silently
        try {
          await supabase.from("support_tickets").insert({
            subject: applicant.subject,
            status: applicant.status,
            priority: applicant.priority,
            user_id: applicant.user_id,
            description: applicant.description
          });
        } catch (dbErr) {
          console.warn("Silent insertion of demo applicant to Supabase failed:", dbErr);
        }
      }

      saveLocalTickets(updatedLocal);

      toast.success("¡Candidatos de prueba creados exitosamente!");
      await fetchApplications();
    } catch (err: any) {
      console.error("Error creating demo applicants:", err);
      toast.error("Ocurrió un error al crear postulantes de prueba");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchRepresentativesData();
  }, []);

  const parseDescription = (description: string): ParsedApplication => {
    const result: ParsedApplication = {
      nombreCompleto: "",
      correo: "",
      whatsapp: "",
      edad: "",
      ciudad: "",
      departamento: "",
      profesion: "",
      experienciaVentas: "",
      experienciaPlataformas: "",
      nivelTecnologico: "",
      trabajadoRestaurantes: "",
      disponeComputador: "",
      motivo: "",
    };

    if (!description) return result;

    const lines = description.split('\n');
    let readingMotivation = false;
    const motivationText: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.includes("=== MOTIVACIÓN ===") || line.includes("====== MOTIVACIÓN ======")) {
        readingMotivation = true;
        continue;
      }

      if (readingMotivation) {
        // If we hit any other section, stop
        if (line.includes("===")) {
          readingMotivation = false;
        } else {
          motivationText.push(line);
          continue;
        }
      }

      if (line.startsWith("- Nombre completo:")) {
        result.nombreCompleto = line.replace("- Nombre completo:", "").trim();
      } else if (line.startsWith("- Correo:")) {
        result.correo = line.replace("- Correo:", "").trim();
      } else if (line.startsWith("- WhatsApp/Tel:")) {
        result.whatsapp = line.replace("- WhatsApp/Tel:", "").trim();
      } else if (line.startsWith("- Edad:")) {
        result.edad = line.replace("- Edad:", "").replace("años", "").trim();
      } else if (line.startsWith("- Ubicación:")) {
        const location = line.replace("- Ubicación:", "").trim();
        const parts = location.split(',');
        result.ciudad = parts[0]?.trim() || "";
        result.departamento = parts[1]?.trim() || "";
      } else if (line.startsWith("- Profesión/Ocupación:")) {
        result.profesion = line.replace("- Profesión/Ocupación:", "").trim();
      } else if (line.startsWith("- ¿Tiene experiencia en ventas?:")) {
        result.experienciaVentas = line.replace("- ¿Tiene experiencia en ventas?:", "").trim();
      } else if (line.startsWith("- ¿Tiene experiencia en plataformas digitales?:")) {
        result.experienciaPlataformas = line.replace("- ¿Tiene experiencia en plataformas digitales?:", "").trim();
      } else if (line.startsWith("- Nivel de manejo tecnológico:")) {
        result.nivelTecnologico = line.replace("- Nivel de manejo tecnológico:", "").trim();
      } else if (line.startsWith("- ¿Ha trabajado con restaurantes?:")) {
        result.trabajadoRestaurantes = line.replace("- ¿Ha trabajado con restaurantes?:", "").trim();
      } else if (line.startsWith("- ¿Dispone de computador e internet?:")) {
        result.disponeComputador = line.replace("- ¿Dispone de computador e internet?:", "").trim();
      }
    }

    result.motivo = motivationText.join('\n').trim();
    return result;
  };

  // Status handlers
  const handleUpdateStatus = async (appId: string, userId: string, newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    setActionLoading(true);
    try {
      // 1. Update support ticket status in Supabase if it has a valid UUID format
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId);
      if (isUuid) {
        const { error } = await supabase
          .from("support_tickets")
          .update({ status: newStatus })
          .eq("id", appId);

        if (error) {
          console.warn("Supabase support ticket update error, continuing with local sync fallback:", error);
        }
      } else {
        console.info("Updating local demo candidate status:", appId);
      }

      // Also ensure it is synchronized with local storage tickets so both offline/online match perfectly
      try {
        const local = getLocalTickets();
        const updated = local.map((t: any) => {
          if (t.id === appId || t.ticket_id === appId) {
            return { ...t, status: newStatus };
          }
          return t;
        });
        saveLocalTickets(updated);
      } catch (locErr) {
        console.warn("Failed syncing local ticket status update:", locErr);
      }

      // 2. Process special promotion logic on Approval (resolved status)
      if (newStatus === "resolved" && userId && userId !== "00000000-0000-0000-0000-000000000000") {
        const updates: any = {};
        
        // Optional user role update to admin or custom metadata if needed
        if (promoOptions.promoteRole) {
          // Promote to admin/representative status. Usually, they remain a role: user but we give high powers or we can set role to 'admin'
          // Let's promote to representative which gives them exclusive onboarding permissions
          // We can set role to 'admin' if requested, or keep 'user' and elevate their referral program
          toast.info("Configurando beneficios VIP de Embajador Comercial...");
        }

        if (promoOptions.giveBonus) {
          // Fetch current balance safely
          const { data: userRows } = await supabase
            .from("app_users")
            .select("referral_balance")
            .eq("id", userId);
          
          const currentBal = userRows?.[0]?.referral_balance || 0;
          updates.referral_balance = currentBal + promoOptions.bonusAmount;
        }

        if (promoOptions.increaseInvites) {
          updates.max_referral_invites = promoOptions.vipInvites;
        }

        // Apply app_users table update if properties are selected
        if (Object.keys(updates).length > 0) {
          const { error: userUpdateError } = await supabase
            .from("app_users")
            .update(updates)
            .eq("id", userId);
          
          if (userUpdateError) console.warn("Failed promoting AppUser properties:", userUpdateError);
        }

        // Send an direct system notification
        await db.saveNotification({
          userId: userId,
          title: "¡Postulación Aprobada con Honores! 🎊👔",
          body: `¡Felicidades y bienvenido al equipo! Has sido aprobado oficialmente como Representante de Ventas Oficial. ¡Tus beneficios VIP y el gran Bono de Lanzamiento ya están activados en tu perfil! 🚀🥂`,
          type: "support_reply"
        }).catch(err => console.warn("Failed sending approval notification:", err));

        toast.success("Candidato aprobado con éxito y credenciales VIP asignadas!");
      } else if (newStatus === "closed" && userId && userId !== "00000000-0000-0000-0000-000000000000") {
        // Send a rejection / archive notice
        await db.saveNotification({
          userId: userId,
          title: "Actualización de Postulación 📂📫",
          body: "Agradecemos profundamente tu gran interés. Por ahora, tu perfil ha sido archivado y lo tendremos muy en cuenta para futuras grandes oportunidades como embajador en tu ciudad. ¡Un saludo! 🤝☕",
          type: "support_reply"
        }).catch(err => console.warn("Failed sending rejection notification:", err));

        toast.success("Postulación marcada como Archivada/Cerrada.");
      } else if (newStatus === "in_progress" && userId && userId !== "00000000-0000-0000-0000-000000000000") {
        // Notify user they are in review / interview
        await db.saveNotification({
          userId: userId,
          title: "¡Postulación en Revisión Activa! 👀✨",
          body: "¡Tu perfil nos encanta y ha avanzado a la siguiente gran etapa de selección! Muy pronto uno de nuestros selectores especializados te contactará por tu WhatsApp para tu entrevista virtual. ¡Prepárate y muchos éxitos! 🎯📞",
          type: "support_reply"
        }).catch(err => console.warn("Failed sending review status notification:", err));

        toast.success("Postulación marcada 'En Trámite'. Notificación enviada al usuario.");
      } else {
        toast.success("Estado de postulación actualizado.");
      }

      // Refresh applications lists
      await fetchApplications();
    } catch (err: any) {
      console.error("Error updating application status:", err);
      toast.error("Error al actualizar estado");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper arrays for filters
  const uniqueCities = Array.from(new Set(applications.map(a => a.parsed?.ciudad).filter(Boolean)));

  // Filter application list
  const filteredApps = applications.filter((app) => {
    // Search term matching
    const parsed = app.parsed || {};
    const nameMatch = (parsed.nombreCompleto || "").toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (parsed.correo || "").toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (parsed.whatsapp || "").includes(searchQuery);
    const cityMatch = (parsed.ciudad || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSearch = nameMatch || emailMatch || phoneMatch || cityMatch;

    // Status filter matching
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    // Advanced filters matching
    const matchesSalesExp = filterSalesExp === "all" || (parsed.experienciaVentas || "").toLowerCase() === filterSalesExp.toLowerCase();
    const matchesPlatformExp = filterPlatformExp === "all" || (parsed.experienciaPlataformas || "").toLowerCase() === filterPlatformExp.toLowerCase();
    const matchesTech = filterTechLevel === "all" || (parsed.nivelTecnologico || "").toLowerCase() === filterTechLevel.toLowerCase();
    const matchesComputer = filterComputer === "all" || (parsed.disponeComputador || "").toLowerCase() === filterComputer.toLowerCase();
    const matchesCitySelect = selectedCity === "all" || parsed.ciudad === selectedCity;

    return matchesSearch && matchesStatus && matchesSalesExp && matchesPlatformExp && matchesTech && matchesComputer && matchesCitySelect;
  });

  // KPI Calculations
  const totalCount = applications.length;
  const pendingCount = applications.filter(a => a.status === "open" || a.status === "pending").length;
  const interviewingCount = applications.filter(a => a.status === "in_progress").length;
  const approvedCount = applications.filter(a => a.status === "resolved").length;
  const closedCount = applications.filter(a => a.status === "closed").length;

  const calculateConversion = () => {
    if (totalCount === 0) return 0;
    return Math.round((approvedCount / totalCount) * 100);
  };

  // Contact helpers
  const getWhatsAppLink = (phone: string, name: string, status?: string) => {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const safeName = name || "Candidato";
    
    let text = `Hola ${safeName}, te saludamos del equipo de Selección de SmartBite. Recibimos tu postulación para ser Representante Comercial Oficial en tu zona y nos encantó tu perfil. ¿Dispones de unos minutos para programar una llamada de 10 minutos hoy?`;
    
    if (status === "in_progress") {
      text = `Hola ${safeName}, te saludamos del equipo de Selección de SmartBite. Este mensaje es para informarte que hemos recibido tu postulación oficialmente y en este momento se encuentra En Trámite (en proceso de evaluación y aprobación). Pronto nos comunicaremos contigo para avanzar al siguiente paso de tu ingreso. ¡Mucho éxito!`;
    }
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const getEmailLink = (email: string, name: string) => {
    const cleanEmail = email || "";
    const safeName = name || "Candidato";
    const subject = `Postulación Representante Comercial de SmartBite - ${safeName}`;
    const body = `Hola ${safeName},\n\nGracias por postularte para unirte a nuestro equipo de ventas y digitalización local.\n\nHemos pre-seleccionado tu perfil y nos gustaría citarte a una breve entrevista por videollamada para explicarte las comisiones y entrenamiento.\n\nPor favor indícanos tus horarios disponibles.\n\nAtentamente,\nEquipo de Selección SmartBite`;
    return `mailto:${cleanEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-8 text-neutral-800">
      
      {/* Intro and Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2 uppercase">
            <Award className="w-7 h-7 text-amber-600" />
            Control de Embajadores y Representantes
          </h2>
          <p className="text-sm text-neutral-500 font-medium font-sans">
            Gestiona la nómina nacional de embajadores, monitorea comercios afiliados y aprueba nuevos postulantes.
          </p>
        </div>
        <button 
          onClick={() => {
            fetchApplications();
            fetchRepresentativesData();
          }}
          className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 self-end shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading || repsLoading ? "animate-spin text-orange-600" : ""}`} />
          Sincronizar Panel
        </button>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-neutral-100 pb-px gap-6">
        <button
          onClick={() => setActiveSubTab("ambassadors")}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative transition-colors ${
            activeSubTab === "ambassadors" ? "text-orange-600 border-b-2 border-orange-600" : "text-neutral-400 hover:text-black"
          }`}
        >
          📌 Embajadores Activos ({representatives.length})
        </button>
        <button
          onClick={() => setActiveSubTab("applicants")}
          className={`pb-3 text-xs font-black uppercase tracking-wider relative transition-colors ${
            activeSubTab === "applicants" ? "text-orange-600 border-b-2 border-orange-600" : "text-neutral-400 hover:text-black"
          }`}
        >
          📋 Proceso de Admisión ({applications.filter(a => a.status !== 'closed' && a.status !== 'resolved').length})
        </button>
      </div>

      {activeSubTab === "applicants" && (
        <>
          {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Postulaciones</span>
            <span className="text-2xl font-black block tracking-tight">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Pendientes</span>
            <span className="text-2xl font-black text-amber-600 block tracking-tight">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">En Trámite</span>
            <span className="text-2xl font-black text-blue-600 block tracking-tight">{interviewingCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Aprobados</span>
            <span className="text-2xl font-black text-emerald-600 block tracking-tight">{approvedCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Tasa Conversión</span>
            <span className="text-2xl font-black text-[#D4AF37] block tracking-tight">{calculateConversion()}%</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Filter className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-700">Filtros de Búsqueda y Selección</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email, cel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-200 rounded-xl text-xs font-semibold tracking-wide transition-all outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Status Sub-filter */}
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
            {(["all", "open", "in_progress", "resolved", "closed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
                  statusFilter === status 
                    ? "bg-white text-black shadow-sm" 
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                {status === "all" ? "Todos" : status === "open" ? "Pendientes" : status === "in_progress" ? "Trámite" : status === "resolved" ? "Apos" : "Archivos"}
              </button>
            ))}
          </div>

          {/* Sales Experience Filter */}
          <div className="flex flex-col gap-1">
            <select
              value={filterSalesExp}
              onChange={(e) => setFilterSalesExp(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Exp. en Ventas (Todos)</option>
              <option value="Si">Sí, tiene experiencia</option>
              <option value="No">No tiene experiencia</option>
            </select>
          </div>

          {/* Platform Experience Filter */}
          <div className="flex flex-col gap-1">
            <select
              value={filterPlatformExp}
              onChange={(e) => setFilterPlatformExp(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Exp. Plataformas (Todos)</option>
              <option value="Si">Sí, tiene experiencia</option>
              <option value="No">No tiene experiencia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Tech skill filter */}
          <div>
            <select
              value={filterTechLevel}
              onChange={(e) => setFilterTechLevel(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Nivel Tecnológico (Todos)</option>
              <option value="Básico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>

          {/* Computer availability */}
          <div>
            <select
              value={filterComputer}
              onChange={(e) => setFilterComputer(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Disponibilidad de Computador (Todos)</option>
              <option value="Si">Sí dispone</option>
              <option value="No">No dispone</option>
            </select>
          </div>

          {/* City list filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Filtrar por Ciudad (Todos)</option>
              {uniqueCities.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic database connection notice (if empty or table hasn't been instantiated yet) */}
      {(dbError || applications.length === 0) && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              AVISO DE BASE DE DATOS SIN CANDIDATOS
            </h4>
            <p className="text-xs text-amber-700 font-semibold leading-relaxed max-w-2xl">
              ¡Hola! Actualmente no hay ningún postulante a Representante registrado en el sistema, lo cual puede presentarse como vacío o sin coincidencias de consulta. Para que puedas ver, probar de inmediato y evaluar la magnífica interfaz y filtros de decisión de candidaturas, puedes sembrar candidatos ficticios de demostración súper realistas.
            </p>
          </div>
          <button
            onClick={handleCreateDemoApplicants}
            disabled={seeding}
            className="px-5 py-3 bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0 self-start md:self-center shadow-md shadow-neutral-900/10"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                Sembrando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Cargar Candidatos Demo
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Candidates List and Table representation */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-100 rounded-3xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Cargando Candidatos...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-sm text-center">
          <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider mb-1">Ningún Postulante Encontrado</h4>
          <p className="text-xs text-neutral-400 font-medium mb-4">No hay coincidencias con los filtros de búsqueda establecidos en este momento.</p>
          {applications.length === 0 && (
            <button
              onClick={handleCreateDemoApplicants}
              disabled={seeding}
              className="mx-auto px-4 py-2 border border-neutral-200 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Cargar Candidatos de Prueba
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Side applicants list */}
          <div className={`lg:col-span-1 space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar ${selectedApp ? 'hidden lg:block' : 'block'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-2 px-1">
              Resultados de Búsqueda ({filteredApps.length})
            </span>
            {filteredApps.map((app) => {
              const parsed = app.parsed;
              const isSelected = selectedApp?.id === app.id;
              
              return (
                <motion.div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                    isSelected 
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-lg shadow-neutral-900/10" 
                      : "bg-white border-neutral-100 hover:border-neutral-300 text-neutral-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {/* Name and age */}
                      <h4 className="font-bold text-xs uppercase tracking-wide truncate max-w-[170px]">
                        {parsed.nombreCompleto}
                      </h4>
                      <p className={`text-[10px] ${isSelected ? "text-neutral-400" : "text-neutral-500"} font-semibold mt-0.5 flex items-center gap-1`}>
                        <MapPin className="w-3" />
                        {parsed.ciudad && parsed.departamento ? `${parsed.ciudad}, ${parsed.departamento}` : "Ciudad no especificada"}
                      </p>
                    </div>

                    {/* Badge Status */}
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      app.status === "open" || app.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : app.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : app.status === "resolved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {app.status === "open" || app.status === "pending" ? "Pendiente" : app.status === "in_progress" ? "Trámite" : app.status === "resolved" ? "Apro" : "Archivo"}
                    </span>
                  </div>

                  {/* Summary features */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-dashed border-neutral-500/10 text-[9px] font-bold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Briefcase className="w-3 opacity-60" />
                      <span>{parsed.experienciaVentas === "Si" ? "Ventas ✓" : "Sin Ventas ✗"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Star className="w-3 opacity-60" />
                      <span>Tec: {parsed.nivelTecnologico || "S/D"}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action and detail panels */}
          <div className={`lg:col-span-2 ${selectedApp ? 'block' : 'hidden lg:block'}`}>
            <AnimatePresence mode="wait">
              {selectedApp ? (
                <motion.div
                  key={selectedApp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 space-y-6 text-left relative overflow-hidden"
                >
                  {/* Decorative Amber Glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/5 to-transparent blur-[40px] pointer-events-none rounded-full" />
                  
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="lg:hidden flex items-center gap-2 text-neutral-500 hover:text-neutral-800 font-bold text-xs uppercase tracking-wider bg-neutral-100 px-3 py-1.5 rounded-full z-10 relative mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver a lista de candidatos
                  </button>

                  {/* Title Header with status updating */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-md font-black uppercase tracking-wide text-neutral-900">
                            {selectedApp.parsed.nombreCompleto}
                          </h3>
                          <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-1.5 py-0.5 rounded-full">
                            {selectedApp.parsed.edad ? `${selectedApp.parsed.edad} años` : "Edad S/D"}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-bold flex items-center gap-1 mt-0.5">
                          <Mail className="w-3" />
                          {selectedApp.parsed.correo}
                        </p>
                      </div>
                    </div>

                    {/* Live Status Action Selector */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 p-1 rounded-xl shrink-0">
                      {(["open", "in_progress", "resolved", "closed"] as const).map((status) => (
                        <button
                          key={status}
                          disabled={actionLoading}
                          onClick={() => handleStatusChangeClick(selectedApp.id, selectedApp.userId, status)}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                            selectedApp.status === status
                              ? status === "open"
                                ? "bg-amber-500 text-white shadow-sm"
                                : status === "in_progress"
                                ? "bg-blue-600 text-white shadow-sm"
                                : status === "resolved"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-neutral-800 text-white shadow-sm"
                              : "text-neutral-500 hover:text-black"
                          }`}
                        >
                          {status === "open" ? "Pendiente" : status === "in_progress" ? "Trámite" : status === "resolved" ? "Aprobar" : "Archivar"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Questionnaire Answers with modern responsive grid */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-orange-500" />
                      Evaluación de Aptitud Comercial
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">CIUDAD Y DEPARTAMENTO</span>
                        <span className="text-xs font-bold text-neutral-800 uppercase tracking-tight flex items-center gap-1.5">
                          <MapPin className="w-3.5 text-neutral-400" />
                          {selectedApp.parsed.ciudad && selectedApp.parsed.departamento 
                            ? `${selectedApp.parsed.ciudad}, ${selectedApp.parsed.departamento}` 
                            : "No especificado"}
                        </span>
                      </div>

                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">PROFESIÓN U OCUPACIÓN</span>
                        <span className="text-xs font-bold text-neutral-800 uppercase tracking-tight flex items-center gap-1.5">
                          <Briefcase className="w-3.5 text-neutral-400" />
                          {selectedApp.parsed.profesion || "No especificada"}
                        </span>
                      </div>

                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">¿TIENE EXPERIENCIA EN VENTAS?</span>
                        <span className={`text-xs font-bold tracking-tight flex items-center gap-1.5 uppercase ${
                          selectedApp.parsed.experienciaVentas === "Si" ? "text-emerald-600" : "text-neutral-600"
                        }`}>
                          <CheckCircle className="w-3.5" />
                          {selectedApp.parsed.experienciaVentas || "No especificado"}
                        </span>
                      </div>

                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">MANEJO DE PLATAFORMAS</span>
                        <span className={`text-xs font-bold tracking-tight flex items-center gap-1.5 uppercase ${
                          selectedApp.parsed.experienciaPlataformas === "Si" ? "text-emerald-600" : "text-neutral-600"
                        }`}>
                          <CheckCircle className="w-3.5" />
                          {selectedApp.parsed.experienciaPlataformas || "No especificado"}
                        </span>
                      </div>

                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">NIVEL DE MANEJO TECNOLÓGICO</span>
                        <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide flex items-center gap-1.5">
                          <Star className="w-3.5" />
                          {selectedApp.parsed.nivelTecnologico || "No especificada"}
                        </span>
                      </div>

                      {/* Item */}
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-neutral-400 block mb-1">DISPONE DE COMPUTADOR EN CASA</span>
                        <span className={`text-xs font-bold tracking-tight flex items-center gap-1.5 uppercase ${
                          selectedApp.parsed.disponeComputador === "Si" ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          <CheckCircle className="w-3.5" />
                          {selectedApp.parsed.disponeComputador || "No especificado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Motivation section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                      Carta de Motivación / Propuesta Comercial
                    </h4>
                    <div className="p-4 bg-amber-50/20 border border-[#D4AF37]/10 rounded-2xl relative">
                      <div className="absolute top-3 left-3 text-7xl font-sans text-[#D4AF37]/10 leading-none select-none">“</div>
                      <p className="text-xs text-neutral-600 leading-relaxed font-semibold italic pl-6 relative z-10 whitespace-pre-wrap">
                        {selectedApp.parsed.motivo || "No incluyó comentarios de motivación o fueron parseados erróneamente. Ver descripción completa abajo."}
                      </p>
                    </div>
                  </div>

                  {/* Promotion VIP custom options (Expandable box if resolved state or pending is clicked) */}
                  {selectedApp.status !== "resolved" && (
                    <div className="p-4 bg-orange-50/30 border border-orange-200/50 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-neutral-700">Parámetros de Aprobación Comercial (VIP)</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={promoOptions.giveBonus}
                            onChange={(e) => setPromoOptions(prev => ({ ...prev, giveBonus: e.target.checked }))}
                            className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-[10px] font-bold text-neutral-600 uppercase">Bono Lanzamiento ($50K)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={promoOptions.increaseInvites}
                            onChange={(e) => setPromoOptions(prev => ({ ...prev, increaseInvites: e.target.checked }))}
                            className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-[10px] font-bold text-neutral-600 uppercase">Invitados Ilimitados (9999)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={promoOptions.promoteRole}
                            onChange={(e) => setPromoOptions(prev => ({ ...prev, promoteRole: e.target.checked }))}
                            className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-[10px] font-bold text-neutral-600 uppercase">Promover Embajador</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Interactive Quick contact bar */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-100">
                    <a
                      href={getWhatsAppLink(selectedApp.parsed.whatsapp, selectedApp.parsed.nombreCompleto, selectedApp.status)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Contactar por WhatsApp
                      <ArrowUpRight className="w-4 h-4" />
                    </a>

                    <a
                      href={getEmailLink(selectedApp.parsed.correo, selectedApp.parsed.nombreCompleto)}
                      className="px-5 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Enviar Correo
                    </a>
                  </div>

                  {/* Raw descriptions for security */}
                  <div className="mt-4">
                    <details className="group cursor-pointer">
                      <summary className="text-[9px] font-black uppercase text-neutral-400 tracking-wider hover:text-neutral-600 list-none flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                        Ver descripción cruda del ticket de soporte
                      </summary>
                      <pre className="mt-2 p-3 bg-neutral-900 text-zinc-300 font-mono text-[9px] rounded-xl overflow-x-auto text-left whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto">
                        {selectedApp.rawDescription}
                      </pre>
                    </details>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200/60 p-24 text-center my-auto h-full flex flex-col justify-center items-center">
                  <User className="w-16 h-16 text-neutral-300 mb-4 stroke-1" />
                  <h4 className="text-sm font-black text-neutral-400 uppercase tracking-widest">Ningún Candidato Seleccionado</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                    Haz clic en cualquiera de las postulaciones de la lista de la izquierda para ver su currículum, iniciar una entrevista y aprobar candidatos.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
      </>
      )}

      {/* Tab: Ambassadors */}
      {activeSubTab === "ambassadors" && (
        <div className="space-y-8">
          {/* Stats specialized for active ambassadors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block text-left">Embajadores Activos</span>
                <span className="text-2xl font-black block tracking-tight text-left">{representatives.length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block text-left">Locales Afiliados</span>
                <span className="text-2xl font-black text-emerald-600 block tracking-tight text-left">
                  {representatives.reduce((sum, r) => sum + (r.affiliatedCount || 0), 0)}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block text-left">Saldos Disponibles</span>
                <span className="text-2xl font-black text-rose-500 block tracking-tight text-left">
                  ${representatives.reduce((sum, r) => sum + (r.referral_balance || 0), 0).toLocaleString()} COP
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block text-left">Retiros Pendientes</span>
                <span className="text-2xl font-black text-[#FF8A00] block tracking-tight text-left">
                  {withdrawals.filter(w => w.status === "pending" || w.status?.toLowerCase() === "pending").length}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List and Metrics of Ambassadors */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-neutral-900 text-white p-5 rounded-3xl border border-neutral-800">
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Nómina de Embajadores Registrados</h3>
                  <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">Control de códigos, saldos acumulados y comercios afiliados.</p>
                </div>
              </div>

              {repsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-100 rounded-3xl">
                  <RefreshCw className="w-8 h-8 text-[#FF8A00] animate-spin mb-3" />
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cargando nómina...</span>
                </div>
              ) : representatives.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-sm text-center">
                  <Award className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Sin Embajadores Activos</h4>
                  <p className="text-xs text-neutral-400 font-medium">No se han registrado embajadores oficiales con roles comerciales habilitados todavía.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {representatives.map((rep) => {
                    const hasPendingWd = rep.pendingWdCount > 0;
                    return (
                      <div 
                        key={rep.id}
                        className="bg-white border border-neutral-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4"
                      >
                        <div className="space-y-2 text-left">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight">{rep.display_name || "Embajador Comercial"}</h4>
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                              REPRESENTANTE
                            </span>
                            {hasPendingWd && (
                              <span className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                SOLICITUD RETIRO
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-semibold text-neutral-500">
                            <span className="flex items-center gap-1.5 shrink-0"><Mail className="w-3.5 h-3.5 text-neutral-400" /> {rep.email}</span>
                            <span className="flex items-center gap-1.5 shrink-0"><Phone className="w-3.5 h-3.5 text-neutral-400" /> {rep.phone || "Sin número"}</span>
                            <span className="flex items-center gap-1.5 text-amber-600 font-bold shrink-0">
                              <Star className="w-3.5 h-3.5 text-amber-500" /> Código: {rep.referral_code || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 shrink-0"><Clock className="w-3.5 h-3.5 text-neutral-400" /> Registrado: {new Date(rep.created_at || Date.now()).toLocaleDateString("es-CO")}</span>
                          </div>
                        </div>

                        {/* Metrics summary */}
                        <div className="flex items-center gap-6 self-start md:self-center bg-neutral-50 p-3 rounded-2xl border border-neutral-100 shrink-0">
                          <div className="text-center font-bold">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Locales</span>
                            <span className="text-sm font-black text-neutral-900">{rep.affiliatedCount}</span>
                          </div>
                          
                          <div className="text-center font-bold">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Saldo Disp</span>
                            <span className="text-sm font-black text-emerald-600">${(rep.referral_balance || 0).toLocaleString()} COP</span>
                          </div>
                        </div>

                        {/* Administrative Triggers */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 md:justify-center">
                          <button
                            onClick={() => {
                              setSelectedRepForDetails(rep);
                            }}
                            className="flex-1 md:flex-none px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <Building className="w-3.5 h-3.5" />
                            Ver Afiliados
                          </button>
                          
                          <button
                            onClick={() => {
                              setRepToManageCredentials(rep);
                              setNewRepPassword(rep.raw_password || "");
                              setShowManageCredentialsModal(true);
                            }}
                            className="flex-1 md:flex-none px-3.5 py-1.5 border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Credenciales
                          </button>
                          
                          <button
                            onClick={() => {
                              setRepToAdjustBalance(rep);
                              setBalanceAdjustmentAmount("");
                              setBalanceAdjustmentType("add");
                              setBalanceAdjustmentNotes("");
                              setShowBalanceModal(true);
                            }}
                            className="flex-1 md:flex-none px-3.5 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Ajustar Saldo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar: REDEMPTION REQUESTS (SOLICITUDES DE COBRO) */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">Solicitudes de Retiro</h3>
                </div>

                <p className="text-[11px] font-semibold text-neutral-400 leading-normal">
                  Firma y concilia de retiro por Nequi o transferencia bancaria correspondientes a comisiones abonadas.
                </p>

                {withdrawals.filter(w => w.status === 'pending' || w.status?.toLowerCase() === 'pending').length === 0 ? (
                  <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-150">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">¡Al día con los pagos!</span>
                    <p className="text-[9.5px] text-neutral-400 px-4 mt-0.5">No hay solicitudes de retiros pendientes.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {withdrawals.filter(w => w.status === 'pending' || w.status?.toLowerCase() === 'pending').map((request) => {
                      const repUser = allAppUsers.find(u => u.id === request.user_id);
                      return (
                        <div 
                          key={request.id}
                          className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-150 relative text-left"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10.5px] font-black uppercase tracking-tight text-neutral-900">
                              {repUser?.display_name || "Representante"}
                            </span>
                            <span className="text-xs font-mono font-black text-emerald-600">
                              ${request.amount?.toLocaleString()} COP
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] text-neutral-500 font-semibold space-y-0.5">
                            <p>Método: <span className="uppercase text-neutral-700 font-bold">{request.method || request.bank_name || "Nequi"}</span></p>
                            <p>Cel/Cuenta: <span className="font-mono text-neutral-700 font-bold">{request.nequi_number || request.account_number || "No registrado"}</span></p>
                            <p>Fecha: <span>{new Date(request.created_at).toLocaleDateString("es-CO")}</span></p>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleRejectWithdrawal(request.id, request.user_id, request.amount)}
                              className="flex-1 py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleApproveWithdrawal(request.id, request.user_id, request.amount)}
                              className="flex-none py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm flex justify-center items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Registrar Pago
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Historico simple */}
                {withdrawals.filter(w => w.status === 'approved' || w.status === 'completed' || w.status === 'rejected').length > 0 && (
                  <div className="pt-3 border-t border-neutral-100 bg-neutral-50 p-3 rounded-2xl">
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Últimos Pagos Históricos</span>
                    <div className="space-y-1.5 text-[10px] font-semibold text-neutral-500 max-h-[160px] overflow-y-auto">
                      {withdrawals.filter(w => w.status === 'approved' || w.status === 'completed' || w.status === 'rejected').slice(0, 10).map((w) => {
                        const repUser = allAppUsers.find(u => u.id === w.user_id);
                        return (
                          <div key={w.id} className="flex justify-between items-center border-b border-dashed border-neutral-100 pb-1.5">
                            <span className="truncate max-w-[120px] text-neutral-700">{repUser?.display_name || "Representante"}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-mono text-[9.5px] font-bold text-neutral-900">${w.amount?.toLocaleString()}</span>
                              <span className={`text-[8.5px] font-black uppercase px-1.5 rounded-full ${w.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                {w.status === 'rejected' ? '❌' : '✓'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affiliated Restaurants Modal */}
      <AnimatePresence>
        {selectedRepForDetails && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl text-left text-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-amber-600" />
                    Comercios Afiliados por {selectedRepForDetails.display_name}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase mt-0.5">Auditoría de comercios registrados bajo su código.</p>
                </div>
                <button 
                  onClick={() => setSelectedRepForDetails(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {selectedRepForDetails.restaurants.length === 0 ? (
                  <div className="py-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-150">
                    <Building className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sin Locales Registrados</span>
                    <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Este embajador comercial todavía no ha registrado restaurantes afiliados.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedRepForDetails.restaurants.map((rest: any) => {
                      return (
                        <div 
                          key={rest.id} 
                          className="p-4 bg-neutral-50 rounded-2xl border border-neutral-150 flex items-center justify-between text-left"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-neutral-900 uppercase tracking-tight">{rest.name}</h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400 font-semibold">
                              <span>📍 {rest.address || rest.city || "Ubicación sin cargar"}</span>
                              <span>✉️ Owner: {rest.owner_email || rest.owner_id || "---"}</span>
                            </div>
                            {/* Validation check indicators */}
                            <div className="flex gap-2 pt-1">
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${rest.logo_url ? "bg-emerald-50 text-emerald-700" : "bg-neutral-155 text-neutral-400"}`}>
                                Logo
                              </span>
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${rest.cover_url ? "bg-emerald-50 text-emerald-700" : "bg-neutral-155 text-neutral-400"}`}>
                                Cover
                              </span>
                              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${rest.loyalty_enabled ? "bg-emerald-50 text-emerald-700" : "bg-neutral-155 text-neutral-400"}`}>
                                Dinámicas
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              rest.status === "approved" || rest.status === "active" || rest.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {rest.status === "published" || rest.status === "active" || rest.status === "approved" ? "PUBLICADO" : "BORRADOR"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedRepForDetails(null)}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Balance Adjustment Modal */}
      <AnimatePresence>
        {showBalanceModal && repToAdjustBalance && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-left text-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  Ajustar Saldo de Comisiones
                </h3>
                <button 
                  onClick={() => {
                    setShowBalanceModal(false);
                    setRepToAdjustBalance(null);
                  }}
                  className="p-1 rounded-full text-neutral-400 hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-1">
                <span className="text-[9px] uppercase font-black tracking-wider text-neutral-400 block">Embajador Comercial</span>
                <span className="text-xs font-black text-neutral-800 block uppercase">{repToAdjustBalance.display_name}</span>
                <span className="text-[10px] font-bold text-neutral-500 block">Saldo Actual: <strong className="text-emerald-700">${(repToAdjustBalance.referral_balance || 0).toLocaleString()} COP</strong></span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">Tipo de Operación</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustmentType("add")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border ${
                        balanceAdjustmentType === "add" 
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                          : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      Abonar Comisión (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceAdjustmentType("set")}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border ${
                        balanceAdjustmentType === "set" 
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                          : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      Establecer Saldo (=)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">Monto en Pesos Colombianos (COP)</label>
                  <input
                    type="number"
                    placeholder="Ej. 100000"
                    value={balanceAdjustmentAmount}
                    onChange={(e) => setBalanceAdjustmentAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-250 rounded-xl text-xs font-bold tracking-wide outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">Concepto / Nota Administrativa</label>
                  <textarea
                    placeholder="Ej. Bono extraordinario por afiliar restaurantes."
                    value={balanceAdjustmentNotes}
                    onChange={(e) => setBalanceAdjustmentNotes(e.target.value)}
                    className="w-full h-20 p-3 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-250 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBalanceModal(false);
                    setRepToAdjustBalance(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-500 font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleAdjustRepBalance}
                  className="flex-none py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs text-white font-extrabold uppercase tracking-wide flex justify-center items-center gap-1 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Procesando..." : "Aplicar Ajuste"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Existing Rep Credentials Management Modal */}
      <AnimatePresence>
        {showManageCredentialsModal && repToManageCredentials && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Gestión de Credenciales
                </h3>
                <button 
                  onClick={() => {
                    setShowManageCredentialsModal(false);
                    setRepToManageCredentials(null);
                  }}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-400 font-semibold leading-relaxed">
                Estás visualizando los datos de acceso para el embajador comercial. Puedes enviar estos datos o generar una nueva contraseña si la olvidó.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">Usuario / Correo Registrado</label>
                  <input
                    type="text"
                    value={repToManageCredentials.email || ""}
                    disabled
                    className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-white opacity-60"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#FF8A00] block">Contraseña de Acceso Actual / Nueva</label>
                  <input
                    type="text"
                    placeholder="Escribe la nueva contraseña si vas a cambiarla"
                    value={newRepPassword}
                    onChange={(e) => setNewRepPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#FF8A00]/50 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-[#FF8A00] text-amber-500 placeholder:font-sans placeholder:text-[10px] placeholder:text-neutral-500 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    // Quick share current details via whatsapp
                    const whatsappMsg = `*Datos de Acceso - Plataforma SmartBite su Bocado Inteligente*\n\nHola ${repToManageCredentials.display_name},\n\nTus credenciales para ingresar a tu panel de embajador son:\n\n*Usuario:* ${repToManageCredentials.email}\n*Contraseña:* ${newRepPassword}\n\nIngresa aquí: https://SmartBite.click`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
                  }}
                  className="flex-none py-2.5 px-4 rounded-xl border border-neutral-700 text-[10px] text-white font-bold hover:bg-neutral-800 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Compartir WhatsApp
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleUpdateRepPassword}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67A00] text-[#121212] text-[10px] font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-1 shadow-md disabled:opacity-50"
                >
                  {actionLoading ? "Actualizando..." : "Guardar Nueva Clave"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Access Credentials Assignment Modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col text-left max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800 shrink-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#FF8A00] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Asignar Credenciales de Acceso
                </h3>
                <button 
                  onClick={() => setShowApprovalModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
                <p className="text-xs text-neutral-400 font-semibold leading-relaxed">
                  Asigna un nombre de usuario (correo) y una contraseña para que el embajador comercial pueda iniciar sesión en su panel de administración.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Nombre del Embajador</label>
                    <input
                      type="text"
                      value={approvalName}
                      onChange={(e) => setApprovalName(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#FF8A00] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Correo (Usuario de Acceso)</label>
                    <input
                      type="email"
                      value={approvalEmail}
                      onChange={(e) => setApprovalEmail(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#FF8A00] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={approvalPhone}
                      onChange={(e) => setApprovalPhone(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#FF8A00] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Contraseña de Acceso</label>
                    <input
                      type="text"
                      value={approvalPassword}
                      onChange={(e) => setApprovalPassword(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#FF8A00] text-amber-500"
                      placeholder="Contraseña inicial"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 font-bold hover:bg-neutral-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCreateRepresentative}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs text-white font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {actionLoading ? "Aprobando..." : "Confirmar Acceso"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Sharing / Success Credentials Modal */}
      <AnimatePresence>
        {showCredentialsModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col text-left text-white max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800 shrink-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#10B981] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  Embajador Aprobado - Enviar Datos
                </h3>
                <button 
                  onClick={() => setShowCredentialsModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar">
                <div className="space-y-2">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 rounded-2xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">¡Éxito en la Creación!</h4>
                      <p className="text-[11px] font-semibold text-neutral-300 mt-0.5 leading-relaxed">
                        El representante oficial ha quedado registrado en el sistema de SmartBite. Ahora es necesario enviarle sus datos de acceso vía WhatsApp para que ingrese a su nuevo panel, comience a afiliar y administre restaurantes afiliados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Box of summary creds */}
                <div className="bg-[#1A1A1A] border border-neutral-800 rounded-2xl p-4 space-y-3 font-semibold text-xs">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Embajador Comercial</span>
                    <span className="text-white font-extrabold">{lastCreatedCreds.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Correo / Usuario</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-200 select-all">{lastCreatedCreds.email}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lastCreatedCreds.email);
                          toast.success("Correo copiado");
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-[10px] text-neutral-300 font-bold active:scale-95 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Contraseña</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-500 select-all">{lastCreatedCreds.password}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lastCreatedCreds.password);
                          toast.success("Contraseña copiada");
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-[10px] text-neutral-300 font-bold active:scale-95 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">WhatsApp Destinatario</span>
                    <span className="text-[#10B981] font-mono font-bold">{lastCreatedCreds.phone}</span>
                  </div>
                </div>

                {/* Description of WhatsApp action */}
                <div className="space-y-1 bg-neutral-900/50 p-4 border border-neutral-800/50 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-[#FF8A00] tracking-widest block">Instrucciones de Envío</span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-semibold">
                    Al presionar el botón inferior se abrirá un chat directo de WhatsApp con el número del embajador y un mensaje oficial pre-llenado con los accesos, el enlace de la plataforma e indicaciones detalladas para iniciar sesión.
                  </p>
                </div>
              </div>

              {/* Trigger actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-neutral-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-800 text-xs text-neutral-400 font-bold hover:bg-neutral-900 transition-colors"
                >
                  Cerrar Ventana
                </button>
                <a
                  href={`https://api.whatsapp.com/send?phone=${(lastCreatedCreds.phone || "").replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                    `¡Hola *${lastCreatedCreds.name}*! 🎉\n\nNos alegra informarte que tu postulación como Representante Comercial de SmartBite ha sido *APROBADA*. 🚀\n\nA partir de este momento, ya cuentas con acceso completo al Panel de Administración Comercial de SmartBite para comenzar a afiliar restaurantes locales y gestionarlos de forma integral (completar sus menús digitales, configurar horarios, dinámicas de premios en la ruleta, etc.).\n\nAquí tienes tus datos de acceso oficiales para ingresar a la plataforma:\n- 🔗 *Plataforma:* https://SmartBite.click\n- ✉️ *Correo:* ${lastCreatedCreds.email}\n- 🔑 *Contraseña Temporal:* ${lastCreatedCreds.password}\n\n*Instrucciones rápidas para comenzar:*\n1. Ingresa al enlace anterior en tu computadora o celular.\n2. Inicia sesión con tus credenciales asignadas.\n3. Al entrar al panel comercial, podrás registrar nuevos restaurantes afiliados y administrarlos directamente para completar sus menús, configurar la ruleta de premios, y ver tus recompensas acumuladas.\n\n¡Te damos una gran bienvenida al equipo oficial de SmartBite! Si tienes alguna pregunta, no dudes en escribirnos por este medio. 🤝`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    toast.success("Enlace de WhatsApp generado correctamente");
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Compartir por WhatsApp
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
