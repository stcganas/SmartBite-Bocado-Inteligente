import fs from 'fs';

let content = fs.readFileSync('src/store/db.ts', 'utf8');

// 1. Add ReferralRequest interface
const interfaceToAdd = `
export interface ReferralRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  restaurantId: string;
  restaurantName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
`;

if (!content.includes('export interface ReferralRequest')) {
  // insert before export interface AppUser
  content = content.replace('export interface AppUser', interfaceToAdd + '\nexport interface AppUser');
}

// 2. Add methods to db exports
const methodsToAdd = `
  createReferralRequest: async (data: Omit<ReferralRequest, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    try {
      const { error } = await supabase.from('referral_requests').insert({
        user_id: data.userId,
        user_name: data.userName,
        user_email: data.userEmail,
        user_phone: data.userPhone,
        restaurant_id: data.restaurantId,
        restaurant_name: data.restaurantName,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (error) {
      console.warn("createReferralRequest error, proceeding with local stub", error);
      // Stub
      const requests = JSON.parse(localStorage.getItem('referral_requests') || '[]');
      requests.push({
        id: Math.random().toString(36).substring(7),
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('referral_requests', JSON.stringify(requests));
    }
  },
  
  getReferralRequests: async (): Promise<ReferralRequest[]> => {
    try {
      const { data, error } = await supabase.from('referral_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        userName: d.user_name,
        userEmail: d.user_email,
        userPhone: d.user_phone,
        restaurantId: d.restaurant_id,
        restaurantName: d.restaurant_name,
        status: d.status,
        createdAt: d.created_at
      }));
    } catch (error) {
       console.warn("getReferralRequests error", error);
       return JSON.parse(localStorage.getItem('referral_requests') || '[]');
    }
  },

  updateReferralRequestStatus: async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
     try {
       const { error } = await supabase.from('referral_requests').update({ status }).eq('id', requestId);
       if (error) throw error;
     } catch (err) {
       console.warn("updateReferralRequestStatus error", err);
       const requests = JSON.parse(localStorage.getItem('referral_requests') || '[]');
       const reqIndex = requests.findIndex((r: any) => r.id === requestId);
       if (reqIndex !== -1) {
         requests[reqIndex].status = status;
         localStorage.setItem('referral_requests', JSON.stringify(requests));
       }
     }
  },
`;

if (!content.includes('createReferralRequest:')) {
  // find first export const db = {
  content = content.replace('export const db = {', 'export const db = {\n' + methodsToAdd);
}

fs.writeFileSync('src/store/db.ts', content, 'utf8');
console.log('Patched db.ts');
