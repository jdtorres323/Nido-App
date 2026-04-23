import { useState, useEffect } from 'react';

export default function ExpenseSplitter({ total, members, currencySymbol, value, onChange }) {
  // value: { splitMode: 'equal' | 'custom', customSplits: { userId: amount } }
  const { splitMode, customSplits } = value;

  const handleModeChange = (mode) => {
    if (mode === 'custom' && Object.keys(customSplits).length === 0) {
      // Initialize custom splits with equal parts if empty
      const initialSplits = {};
      const share = (total / members.length).toFixed(2);
      members.forEach(m => initialSplits[m.id] = share);
      onChange({ splitMode: mode, customSplits: initialSplits });
    } else {
      onChange({ ...value, splitMode: mode });
    }
  };

  const handleCustomAmountChange = (userId, amount) => {
    const newSplits = { ...customSplits, [userId]: amount };
    onChange({ ...value, customSplits: newSplits });
  };

  const totalAssigned = Object.values(customSplits).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const difference = total - totalAssigned;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <label className="font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Modo de Reparto</label>
        <div className="flex bg-surface-container-highest p-1.5 rounded-[2rem] border border-outline-variant shadow-sm">
          <button 
            type="button"
            onClick={() => handleModeChange('equal')}
            className={`px-8 py-3 rounded-[1.5rem] font-bold text-sm transition-all ${splitMode === 'equal' ? 'bg-on-surface text-surface shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Equitativo
          </button>
          <button 
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`px-8 py-3 rounded-[1.5rem] font-bold text-sm transition-all ${splitMode === 'custom' ? 'bg-on-surface text-surface shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Asignación Manual
          </button>
        </div>
      </div>

      {splitMode === 'equal' ? (
        <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 text-center space-y-2">
          <p className="text-on-surface-variant text-sm font-medium">Cada uno de los {members.length} miembros pagará:</p>
          <p className="text-4xl font-black text-primary tracking-tighter">
            {currencySymbol} {(total / members.length).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {members.map(member => (
              <div key={member.id} className="bg-surface-container-low border border-outline-variant rounded-[2rem] p-6 flex items-center justify-between group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <img src={member.photoURL} alt={member.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  <span className="font-bold text-on-surface">{member.displayName}</span>
                </div>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-2 focus-within:border-primary transition-colors">
                  <span className="text-on-surface-variant/40 font-bold mr-2 text-sm">{currencySymbol}</span>
                  <input 
                    type="number"
                    step="0.01"
                    className="bg-transparent border-none p-0 w-24 text-right font-black text-lg text-on-surface focus:ring-0"
                    value={customSplits[member.id] || ''}
                    onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${isBalanced ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">
                {isBalanced ? 'check_circle' : 'info'}
              </span>
              <span className="text-xs font-black uppercase tracking-widest">
                {isBalanced ? 'Asignación Correcta' : 'Pendiente de asignar'}
              </span>
            </div>
            <p className="font-black text-xl tracking-tighter">
              {isBalanced ? '¡Listo!' : `${currencySymbol} ${difference.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
