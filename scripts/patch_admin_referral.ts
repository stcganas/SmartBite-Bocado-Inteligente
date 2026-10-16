import fs from 'fs';

let content = fs.readFileSync('src/components/AdminReferralManagement.tsx', 'utf8');

// 1. We will add a new state for requests
content = content.replace(
  "const [users, setUsers] = useState<any[]>([]);",
  "const [users, setUsers] = useState<any[]>([]);\n  const [requests, setRequests] = useState<any[]>([]);\n  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests'>('requests');"
);

// 2. Fetch requests
const fetchRequestsCode = `
      // fetch pending requests
      try {
        const { db } = await import('../store/db');
        const reqs = await db.getReferralRequests();
        setRequests(reqs.filter((r: any) => r.status === 'pending'));
      } catch (err) {
        console.warn('Error fetching requests', err);
      }
`;
// add inside fetchReferralUsers after setting users
content = content.replace('setUsers(formattedUsers);', 'setUsers(formattedUsers);\n' + fetchRequestsCode);

// 3. Add handleApproveRequest and handleRejectRequest
const approveRejectCode = `
  const handleApproveRequest = async (request: any) => {
    try {
      const { db } = await import('../store/db');
      await db.updateReferralRequestStatus(request.id, 'approved');
      
      // Update user anniversaries
      const { data: user } = await supabase.from('app_users').select('anniversaries').eq('id', request.userId).single();
      let annivs = user?.anniversaries || [];
      if (!annivs.some((a: any) => a.type === 'referral_enrollment' && a.date === request.restaurantId)) {
         annivs.push({ type: 'referral_enrollment', date: request.restaurantId });
         await supabase.from('app_users').update({ anniversaries: annivs }).eq('id', request.userId);
      }
      
      await db.saveNotification({
        userId: request.userId,
        title: \`Solicitud Aprobada 🎉\`,
        body: \`Has sido aceptado en el programa de referidos de \${request.restaurantName}.\`,
        type: 'direct'
      });
      
      toast.success("Solicitud aprobada");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al aprobar");
    }
  };

  const handleRejectRequest = async (request: any) => {
    try {
      const { db } = await import('../store/db');
      await db.updateReferralRequestStatus(request.id, 'rejected');
      toast.success("Solicitud rechazada");
      fetchReferralUsers();
    } catch (err) {
      console.error(err);
      toast.error("Error al rechazar");
    }
  };
`;
content = content.replace('useEffect(() => {', approveRejectCode + '\n  useEffect(() => {');

// 4. Update UI to show tabs & list
// We will replace the entire rendering below the title
const renderCode = `      
      <div className="flex gap-4 mb-6 border-b border-outline pb-4 overflow-x-auto">
         <button onClick={() => setActiveSubTab('requests')} className={\`px-4 py-2 font-bold rounded-xl transition-all \${activeSubTab === 'requests' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-muted hover:text-on-surface'}\`}>
           Solicitudes Pendientes ({requests.length})
         </button>
         <button onClick={() => setActiveSubTab('users')} className={\`px-4 py-2 font-bold rounded-xl transition-all \${activeSubTab === 'users' ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-muted hover:text-on-surface'}\`}>
           Usuarios Activos ({filteredUsers.length})
         </button>
      </div>
      
      {activeSubTab === 'requests' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-on-surface-muted">No hay solicitudes pendientes</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-surface-variant p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-outline">
                <div>
                   <h3 className="font-bold text-on-surface text-lg">{req.userName} <span className="text-sm font-medium text-on-surface-muted">({req.userEmail})</span></h3>
                   <p className="text-sm text-on-surface-variant mt-1">Solicita unirse a: <b>{req.restaurantName}</b></p>
                   <p className="text-xs text-on-surface-muted">Tel: {req.userPhone}</p>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => handleApproveRequest(req)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                     <CheckCircle className="w-4 h-4" /> Aprobar
                   </button>
                   <button onClick={() => handleRejectRequest(req)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                     <XCircle className="w-4 h-4" /> Rechazar
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-on-surface-muted font-medium bg-surface-variant rounded-3xl border border-outline border-dashed">
              No se encontraron embajadores
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-surface-base rounded-[2rem] border border-outline overflow-hidden shadow-lg relative group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-inner">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <button 
                      onClick={() => handleRejectUser(user.id)}
                      className="text-xs text-red-500 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Revocar
                    </button>
                  </div>
                  
                  <h3 className="font-black text-xl text-on-surface mb-1 truncate">{user.display_name}</h3>
                  <p className="text-xs text-on-surface-muted font-medium mb-4">{user.email}</p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-outline pb-3">
                      <span className="text-on-surface-variant font-medium">Billetera</span>
                      <span className="font-black text-emerald-500">
                        {formatCurrency(user.referral_balance || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-b border-outline pb-3">
                      <span className="text-on-surface-variant font-medium">Invitaciones Usadas</span>
                      <span className="font-black text-on-surface">{user.usedInvitesCount} / {user.maxInvites}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Restaurantes ({user.restaurants?.length || 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
`;
// Replace the current rendering from `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">` downwards with our new code
// We need to be careful with string replacement.
const matchStart = '<div className="grid';
const contentParts = content.split(matchStart);
if (contentParts.length > 1) {
    // find the end of the return statement
    content = contentParts[0] + renderCode + '</div>\n  );\n}';
}

fs.writeFileSync('src/components/AdminReferralManagement.tsx', content, 'utf8');
console.log('Patched AdminReferralManagement');
