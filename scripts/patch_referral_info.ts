import fs from 'fs';

let content = fs.readFileSync('src/pages/ReferralProgramInfo.tsx', 'utf8');

// 1. Add requested logic
content = content.replace(
  'const [isEnrolling, setIsEnrolling] = useState(false);',
  'const [isEnrolling, setIsEnrolling] = useState(false);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);\n  const [hasPendingRequest, setHasPendingRequest] = useState(false);\n'
);

// We need to load if the user has a pending request
const loadDataPatch = `
    async function loadData() {
      if (!restaurantId) return;
      try {
        const r = await db.getRestaurant(restaurantId);
        setRestaurant(r);
        
        // check pending request if user is logged in
        if (appUser) {
           const reqs = await db.getReferralRequests();
           const pending = reqs.find(req => req.restaurantId === restaurantId && req.userId === appUser.id && req.status === 'pending');
           if (pending) setHasPendingRequest(true);
        }
      } catch (err) {
        console.error("Error loading restaurant info:", err);
      } finally {
        setLoading(false);
      }
    }
`;
content = content.replace(/async function loadData\(\) \{[\s\S]*?\}\n    loadData\(\);/m, loadDataPatch + '\n    loadData();');

// change handleEnroll
const newHandleEnroll = `
  const handleEnrollClick = () => {
    if (!user || !appUser) {
      toast.error('Inicia sesión para inscribirte al programa');
      navigate('/auth', { state: { from: \`/referrals-info/\${restaurantId}\` } });
      return;
    }
    if (isEnrolled) {
      toast.info('Ya estás inscrito en este programa');
      return;
    }
    setShowConfirmModal(true);
  };

  const submitEnrollRequest = async () => {
    if (!user || !appUser || !restaurant) return;
    setIsEnrolling(true);
    try {
      await db.createReferralRequest({
        userId: appUser.id,
        userName: appUser.displayName || 'Usuario sin nombre',
        userEmail: appUser.email || user.email || 'Sin correo',
        userPhone: appUser.phone || 'Sin número',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name
      });
      setHasPendingRequest(true);
      setShowConfirmModal(false);
      
      // Notify super admin optionally, or just save notification
      await db.saveNotification({
        userId: 'admin', // assuming superadmin gets it
        title: \`Nueva solicitud de referido: \${appUser.displayName}\`,
        body: \`\${appUser.displayName} ha solicitado unirse al programa de referidos de \${restaurant.name}.\`,
        type: 'global'
      });

      toast.success('Solicitud enviada con éxito. Será revisada por un administrador.');
    } catch(err) {
      console.error(err);
      toast.error('Ocurrió un error al enviar la solicitud');
    } finally {
      setIsEnrolling(false);
    }
  };
`;
// replace handleEnroll
content = content.replace(/const handleEnroll = async \(\) => \{[\s\S]*?\}\s*;\s*$/m, newHandleEnroll);

// replace isEnrolled in the DOM
if (content.includes('isEnrolled ? (')) {
  content = content.replace('isEnrolled ? (', 'isEnrolled ? (\n              <div className="w-full text-center space-y-4">\n                <div className="inline-flex items-center gap-2 bg-emerald-50 px-6 py-3 border border-emerald-100 text-emerald-700 font-black rounded-full text-sm">\n                  <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" /> ¡Ya estás inscrito en este programa!\n                </div>\n                <p className="text-xs text-on-surface-muted font-bold max-w-md mx-auto">\n                  Ve a tu menú de perfil y comparte tu código de referido para empezar a acumular saldo.\n                </p>\n                <div className="flex justify-center gap-4 pt-2">\n                  <Link \n                    to="/profile?tab=referral" \n                    className="px-6 py-3 bg-surface-variant hover:bg-surface-light text-on-surface font-black rounded-2xl text-xs uppercase tracking-wider"\n                  >\n                    Ver mi Panel de Referidos\n                  </Link>\n                </div>\n              </div>\n            ) : hasPendingRequest ? (\n              <div className="w-full text-center space-y-4">\n                <div className="inline-flex items-center gap-2 bg-amber-50 px-6 py-3 border border-amber-100 text-amber-700 font-black rounded-full text-sm">\n                  <TrendingUp className="w-5 h-5 text-amber-600 animate-pulse" /> Solicitud en revisión\n                </div>\n                <p className="text-xs text-on-surface-muted font-bold max-w-md mx-auto">\n                  Tu solicitud ha sido enviada al administrador. Recibirás una notificación cuando sea aprobada.\n                </p>\n              </div>\n            ) : (');
  // and the button logic check
  content = content.replace('onClick={handleEnroll}', 'onClick={handleEnrollClick}');
}

const modalHTML = `
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-base border border-outline rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-on-surface-muted hover:text-on-surface bg-surface-variant rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-on-surface mb-2">Confirmar Solicitud</h3>
            <p className="text-sm text-on-surface-muted mb-4 font-medium">
              Al confirmar, enviaremos tus datos registrados a <b>{restaurant?.name}</b> y al Super Administrador para su aprobación en el programa de embajadores.
            </p>
            <div className="bg-surface-variant rounded-xl p-3 mb-6">
               <p className="text-xs text-on-surface-variant font-bold uppercase mb-1">Tus datos a enviar:</p>
               <p className="text-sm text-on-surface font-medium">Nombre: {appUser?.displayName || 'Asignado'}</p>
               <p className="text-sm text-on-surface font-medium">Email: {appUser?.email || user?.email || 'N/A'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 bg-surface-variant text-on-surface font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={submitEnrollRequest}
                disabled={isEnrolling}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center"
              >
                {isEnrolling ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
`;
content = content.replace('</div>\n    </div>\n  );\n}', modalHTML + '\n      </div>\n    </div>\n  );\n}');

// adding X import if missing
if (!content.includes('X, ')) {
  content = content.replace('CheckCircle2, ', 'CheckCircle2, X, ');
}

fs.writeFileSync('src/pages/ReferralProgramInfo.tsx', content, 'utf8');
console.log('Patched ReferralProgramInfo');
