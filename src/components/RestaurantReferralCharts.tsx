import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, endOfWeek, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface RestaurantReferralChartsProps {
  salesList: any[];
}

export function RestaurantReferralCharts({ salesList }: RestaurantReferralChartsProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  const chartData = useMemo(() => {
    if (!salesList || salesList.length === 0) return [];

    // Sort valid sales by date
    const sortedSales = [...salesList].filter(s => s.createdAt).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortedSales.length === 0) return [];

    const firstDate = new Date(sortedSales[0].createdAt);
    const lastDate = new Date();

    let intervals: Date[] = [];
    let formatStr = 'dd MMM';

    if (timeRange === 'day') {
      intervals = eachDayOfInterval({ start: startOfWeek(lastDate), end: lastDate });
      formatStr = 'EEE dd';
    } else if (timeRange === 'week') {
      // Last 4 weeks
      const start = new Date(lastDate);
      start.setDate(start.getDate() - 28);
      intervals = eachWeekOfInterval({ start: startOfWeek(start), end: lastDate });
      formatStr = 'dd MMM';
    } else {
      // Last 6 months
      const start = new Date(lastDate);
      start.setMonth(start.getMonth() - 5);
      intervals = eachMonthOfInterval({ start: startOfMonth(start), end: lastDate });
      formatStr = 'MMM yy';
    }

    const data = intervals.map(date => {
      let label = format(date, formatStr, { locale: es });
      
      let filterFn = (s: any) => false;
      

      if (timeRange === 'day') {
        filterFn = (s: any) => isSameDay(parseISO(s.createdAt), date);
      } else if (timeRange === 'week') {
         filterFn = (s: any) => {
           const d = parseISO(s.createdAt);
           return d >= startOfWeek(date) && d <= endOfWeek(date);
         };
         label = `Sem ${format(date, 'dd MMM', { locale: es })}`;
      } else {
         filterFn = (s: any) => {
           const d = parseISO(s.createdAt);
           return d >= startOfMonth(date) && d <= endOfMonth(date);
         };
      }

      const periodSales = sortedSales.filter(filterFn);
      
      return {
        label,
        ventas: periodSales.reduce((acc, curr) => acc + (curr.total || 0), 0),
        comisiones: periodSales.reduce((acc, curr) => acc + (curr.commission || 0), 0),
        pedidos: periodSales.length
      };
    });

    return data;
  }, [salesList, timeRange]);

  return (
    <div className="bg-surface-base border border-outline rounded-2xl p-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h4 className="font-black text-on-surface text-lg">Evolución de Referencia</h4>
           <p className="text-[10px] text-on-surface-muted font-bold uppercase tracking-widest">Análisis de ventas por comisiones</p>
        </div>
        <div className="flex bg-surface-variant rounded-lg p-1 border border-outline">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 'day' ? 'bg-orange-600 text-on-surface shadow-sm' : 'text-on-surface-muted hover:text-on-surface'}`}
          >
            Diario
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 'week' ? 'bg-orange-600 text-on-surface shadow-sm' : 'text-on-surface-muted hover:text-on-surface'}`}
          >
            Semanal
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 'month' ? 'bg-orange-600 text-on-surface shadow-sm' : 'text-on-surface-muted hover:text-on-surface'}`}
          >
            Mensual
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-outline rounded-xl">
           <p className="text-on-surface-variant font-bold text-sm">No hay suficientes datos para generar gráficos</p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorComisiones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(v) => `$${v/1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.0)" fontSize={0} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151515', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '10px', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}
                formatter={(value: number, name: string) => [
                  name === 'pedidos' ? value : `$${value.toLocaleString()}`, 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area yAxisId="left" type="monotone" dataKey="ventas" name="Ventas Generadas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              <Area yAxisId="left" type="monotone" dataKey="comisiones" name="Comisiones Embajadores" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorComisiones)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
