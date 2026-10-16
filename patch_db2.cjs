const fs = require('fs');
let file = fs.readFileSync('src/store/db.ts', 'utf8');

const visitMethods = `
  recordVisit: async (data: { restaurantId?: string; userId?: string; deviceInfo?: string; city?: string; gender?: string; ageRange?: string }): Promise<void> => {
    try {
      await supabase.from('restaurant_visits').insert({
        restaurant_id: data.restaurantId || null,
        user_id: data.userId || null,
        device_info: data.deviceInfo || null,
        city: data.city || null,
        gender: data.gender || null,
        age_range: data.ageRange || null,
      });
    } catch (error) {
      console.error("Error recording visit:", error);
    }
  },

  getTrafficStats: async (restaurantId?: string, startDate?: string, endDate?: string): Promise<{ visits: any[]; ageGroups: any[]; genderStats: any[]; cities: any[]; }> => {
    try {
      let query = supabase.from('restaurant_visits').select('*');
      
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      } else {
        query = query.is('restaurant_id', null);
      }

      if (startDate) {
        query = query.gte('visit_date', startDate);
      }
      if (endDate) {
        query = query.lte('visit_date', endDate);
      }

      const { data, error } = await query;
      
      if (error || !data) return { visits: [], ageGroups: [], genderStats: [], cities: [] };
      
      // Procesar datos para gráficos
      const visitsByDate: Record<string, { visits: number; unique: Set<string> }> = {};
      const ageGroups: Record<string, number> = {};
      const genderStats: Record<string, number> = {};
      const cities: Record<string, number> = {};
      
      data.forEach(v => {
        // Timeline
        if (!visitsByDate[v.visit_date]) {
          visitsByDate[v.visit_date] = { visits: 0, unique: new Set() };
        }
        visitsByDate[v.visit_date].visits++;
        if (v.user_id) visitsByDate[v.visit_date].unique.add(v.user_id);
        else visitsByDate[v.visit_date].unique.add(v.id); // Tratar no logueados como únicos temporalmente
        
        // Edad
        if (v.age_range) ageGroups[v.age_range] = (ageGroups[v.age_range] || 0) + 1;
        
        // Género
        if (v.gender) genderStats[v.gender] = (genderStats[v.gender] || 0) + 1;
        
        // Ciudad
        if (v.city) cities[v.city] = (cities[v.city] || 0) + 1;
      });
      
      const visits = Object.entries(visitsByDate).map(([date, stats]) => ({
        date,
        visits: stats.visits,
        unique: stats.unique.size
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      return { 
        visits,
        ageGroups: Object.entries(ageGroups).map(([age, users]) => ({ age, users })),
        genderStats: Object.entries(genderStats).map(([name, value]) => ({ name, value })),
        cities: Object.entries(cities).map(([city, visits]) => ({ city, municipality: "N/A", visits })).sort((a,b) => b.visits - a.visits).slice(0, 10)
      };
      
    } catch (error) {
      console.error("Error fetching traffic stats:", error);
      return { visits: [], ageGroups: [], genderStats: [], cities: [] };
    }
  },

  getAllRestaurantVisits: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase.from('restaurant_visits')
        .select('*, restaurants!inner(name, type)')
        .not('restaurant_id', 'is', null);
        
      if (error || !data) return [];
      
      const restStats: Record<string, any> = {};
      data.forEach(v => {
        const rId = v.restaurant_id;
        if (!restStats[rId]) {
          restStats[rId] = {
            id: rId,
            name: v.restaurants.name,
            type: v.restaurants.type,
            visits: 0
          };
        }
        restStats[rId].visits++;
      });
      
      return Object.values(restStats)
        .sort((a: any, b: any) => b.visits - a.visits)
        .map((r: any) => ({ ...r, trend: '+0%' })); // Simulación de tendencia por ahora
        
    } catch (error) {
      console.error("Error fetching all restaurant visits:", error);
      return [];
    }
  },
`;

file = file.replace(/export const db = \{/, 'export const db = {' + visitMethods);

fs.writeFileSync('src/store/db.ts', file);
