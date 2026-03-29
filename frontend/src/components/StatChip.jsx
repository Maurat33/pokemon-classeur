import React from 'react';

export const Pokeball = ({ size = 'normal' }) => (
  <div className={size === 'small' ? 'pokeball pokeball-small' : 'pokeball'} />
);

export function StatChip({ icon, label, value, highlight, isDark = true }) {
  return (
    <div className={`stat-chip ${highlight ? 'stat-chip-gold' : ''}`}>
      <span className="text-xl">{typeof icon === 'string' ? icon : icon}</span>
      <div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</div>
        <div 
          className={`font-bold text-lg ${highlight ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-800'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
