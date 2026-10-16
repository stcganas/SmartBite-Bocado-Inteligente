import React from 'react';

interface DateSelectorProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export const DateSelector: React.FC<DateSelectorProps> = ({ value, onChange, className = "", variant = "light" }) => {
  const dateObj = value ? new Date(value) : new Date();
  const year = dateObj.getFullYear().toString();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(parseInt(year), parseInt(month)) }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const handleChange = (newYear: string, newMonth: string, newDay: string) => {
    // Validate day for the selected month/year
    const maxDays = getDaysInMonth(parseInt(newYear), parseInt(newMonth));
    const validatedDay = parseInt(newDay) > maxDays ? maxDays.toString().padStart(2, '0') : newDay;
    onChange(`${newYear}-${newMonth}-${validatedDay}`);
  };

  const selectClasses = variant === 'dark'
    ? "w-full px-3 py-2.5 bg-black/40 backdrop-blur-md border border-[#D4AF37]/40 rounded-xl text-white focus:outline-none focus:border-[#FFDF00] transition-all text-sm cursor-pointer"
    : "w-full px-2 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:border-orange-500 transition-all text-sm cursor-pointer";

  return (
    <div className={`flex gap-2 ${className}`}>
      <select 
        value={day} 
        onChange={(e) => handleChange(year, month, e.target.value)} 
        className={selectClasses}
      >
        {days.map(d => <option key={d} value={d} className={variant === 'dark' ? 'bg-neutral-900 text-white' : ''}>{d}</option>)}
      </select>
      <select 
        value={month} 
        onChange={(e) => handleChange(year, e.target.value, day)} 
        className={selectClasses}
      >
        {monthNames.map((name, i) => (
          <option key={i + 1} value={(i + 1).toString().padStart(2, '0')} className={variant === 'dark' ? 'bg-neutral-900 text-white' : ''}>
            {name}
          </option>
        ))}
      </select>
      <select 
        value={year} 
        onChange={(e) => handleChange(e.target.value, month, day)} 
        className={selectClasses}
      >
        {years.map(y => <option key={y} value={y.toString()} className={variant === 'dark' ? 'bg-neutral-900 text-white' : ''}>{y}</option>)}
      </select>
    </div>
  );
};
