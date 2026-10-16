import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from 'recharts';
import { Star, Medal, Trophy, TrendingUp, Sparkles, User, Award, Crown } from 'lucide-react';

export interface TopUserItem {
  id: string;
  displayName: string;
  email: string;
  level: number;
  xp: number;
  completedTasksCount: number;
  ordersCount: number;
  reviewsCount: number;
  avgRating: number;
  goldCoins: number;
  avatarUrl?: string;
  role?: string;
}

interface TopUsersChartProps {
  users: TopUserItem[];
  onSelectUser?: (user: TopUserItem) => void;
}

export const TopUsersChart: React.FC<TopUsersChartProps> = ({ users, onSelectUser }) => {
  const [metricMode, setMetricMode] = useState<'combined' | 'rating' | 'level'>('combined');

  // Calculate Top 5 based on selected metric
  const topFiveUsers = useMemo(() => {
    if (!users || users.length === 0) return [];

    const list = [...users];

    if (metricMode === 'rating') {
      // Top 5 by Rating, tie break by reviews count and level
      list.sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
        return b.level - a.level;
      });
    } else if (metricMode === 'level') {
      // Top 5 by Level, tie break by XP and rating
      list.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return b.avgRating - a.avgRating;
      });
    } else {
      // Combined: normalized score (Rating * 20 [0-100 scale] + Level [1-100])
      list.sort((a, b) => {
        const scoreA = (a.avgRating * 20) + (a.level * 1.2);
        const scoreB = (b.avgRating * 20) + (b.level * 1.2);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return b.level - a.level;
      });
    }

    return list.slice(0, 5);
  }, [users, metricMode]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return topFiveUsers.map((u, idx) => {
      // Short name for axis label
      const shortName = u.displayName.length > 11 
        ? u.displayName.slice(0, 10) + '…' 
        : u.displayName;

      return {
        rank: idx + 1,
        id: u.id,
        fullName: u.displayName,
        shortName,
        email: u.email,
        level: u.level,
        rating: u.avgRating,
        reviewsCount: u.reviewsCount,
        xp: u.xp,
        tasks: u.completedTasksCount,
        rawUser: u
      };
    });
  }, [topFiveUsers]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 p-4 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[200px] text-white">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 font-black flex items-center justify-center text-[10px]">
              #{data.rank}
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate text-white">{data.fullName}</p>
              <p className="text-[10px] text-neutral-400 truncate">{data.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div className="bg-neutral-800/60 p-2 rounded-xl border border-neutral-700/40">
              <span className="text-[9px] uppercase tracking-wider text-purple-300 block font-sans font-bold">
                Nivel
              </span>
              <span className="text-base font-black text-purple-400">
                Nv. {data.level}
              </span>
            </div>

            <div className="bg-neutral-800/60 p-2 rounded-xl border border-neutral-700/40">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 block font-sans font-bold flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline" /> Rating
              </span>
              <span className="text-base font-black text-amber-400">
                {data.rating > 0 ? `${data.rating} ★` : 'N/A'}
              </span>
              <span className="text-[9px] text-neutral-400 block font-sans font-normal">
                ({data.reviewsCount} reseñas)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-300 pt-1">
            <span>XP: <b>{data.xp}</b></span>
            <span>Tareas: <b>{data.tasks}</b></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 1º', bg: 'bg-amber-400/15 text-amber-400 border-amber-400/30' };
    if (rank === 2) return { text: '🥈 2º', bg: 'bg-slate-300/15 text-slate-300 border-slate-300/30' };
    if (rank === 3) return { text: '🥉 3º', bg: 'bg-amber-700/15 text-amber-500 border-amber-600/30' };
    return { text: `#${rank}`, bg: 'bg-surface-base text-on-surface-muted border-outline' };
  };

  return (
    <div className="bg-surface-variant border border-outline rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-on-surface flex items-center gap-2">
              Top 5 Usuarios: Rating y Nivel Alcanzado
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Recharts Analytics
              </span>
            </h4>
            <p className="text-xs text-on-surface-muted mt-0.5">
              Comparativa visual de desempeño de los líderes de la plataforma según nivel de progreso y calificación.
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center bg-surface-base p-1 rounded-xl border border-outline self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setMetricMode('combined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'combined'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-muted hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Líderes Combinados
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('rating')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'rating'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-on-surface-muted hover:text-on-surface'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            Top Rating
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('level')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'level'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-on-surface-muted hover:text-on-surface'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            Top Nivel
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-16 text-center space-y-2 border border-dashed border-outline rounded-2xl">
          <User className="w-10 h-10 text-on-surface-muted/40 mx-auto" />
          <p className="text-xs font-bold text-on-surface">No hay datos suficientes para generar el gráfico</p>
          <p className="text-[11px] text-on-surface-muted">Los usuarios aparecerán en cuanto registren niveles o reseñas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recharts Composed Graphic */}
          <div className="h-[320px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              >
                <defs>
                  {/* Purple Gradient for Level Bars */}
                  <linearGradient id="barLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />

                {/* X Axis: User names */}
                <XAxis
                  dataKey="shortName"
                  axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'currentColor', fontWeight: 600 }}
                  dy={10}
                />

                {/* Left Y Axis: Level (0 to 100) */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.2))]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#8b5cf6', fontWeight: 700 }}
                  label={{
                    value: 'Nivel Alcanzado (1 - 100)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#8b5cf6', fontSize: 10, fontWeight: 700, textAnchor: 'middle' }
                  }}
                />

                {/* Right Y Axis: Rating (0 to 5) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#f59e0b', fontWeight: 700 }}
                  label={{
                    value: 'Rating Promedio (0 - 5 ★)',
                    angle: 90,
                    position: 'insideRight',
                    style: { fill: '#f59e0b', fontSize: 10, fontWeight: 700, textAnchor: 'middle' }
                  }}
                />

                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 700 }}
                />

                {/* Bar for Level */}
                <Bar
                  yAxisId="left"
                  name="Nivel Alcanzado"
                  dataKey="level"
                  fill="url(#barLevelGrad)"
                  radius={[8, 8, 0, 0]}
                  barSize={38}
                  cursor="pointer"
                  onClick={(entry) => onSelectUser && onSelectUser(entry.rawUser)}
                />

                {/* Line for Rating */}
                <Line
                  yAxisId="right"
                  name="Rating Promedio (★)"
                  dataKey="rating"
                  type="monotone"
                  stroke="#f59e0b"
                  strokeWidth={3.5}
                  dot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Cards for Top 5 Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {topFiveUsers.map((u, index) => {
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={u.id}
                  onClick={() => onSelectUser && onSelectUser(u)}
                  className="bg-surface-base hover:bg-surface-variant/80 border border-outline rounded-2xl p-3.5 transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between space-y-2.5 shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border font-mono ${badge.bg}`}>
                      {badge.text}
                    </span>
                    <span className="text-[10px] font-mono font-black text-purple-400">
                      Nv. {u.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.displayName}
                        className="w-8 h-8 rounded-xl object-cover border border-outline shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                        {u.displayName}
                      </p>
                      <p className="text-[10px] text-on-surface-muted truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-outline/50 text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{u.avgRating > 0 ? u.avgRating.toFixed(1) : 'S/C'}</span>
                    </div>
                    <span className="text-on-surface-muted text-[10px]">
                      {u.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
