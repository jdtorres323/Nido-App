import { useState, useEffect } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';

export default function MultiLineSplitter({ onSaveSuccess, initialData = null }) {
  const { user } = useAuth();
  const { members, activeHousehold, currencySymbol, formatAmount } = useHousehold();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lines, setLines] = useState(
    initialData?.items?.length > 0 
      ? initialData.items.map((item, idx) => ({
          id: Date.now() + idx,
          concept: item.concept || '',
          amount: item.amount || '',
          splitMode: 'equal',
          customSplits: {}
        }))
      : [{ id: Date.now(), concept: '', amount: '', splitMode: 'equal', customSplits: {} }]
  );
  const [paidBy, setPaidBy] = useState(user?.uid || '');
  const [date, setDate] = useState(initialData?.date || new Date().toLocaleDateString('sv'));
  const [globalConcept, setGlobalConcept] = useState(initialData?.concept || 'Compra Conjunta');
  const [expandedLineId, setExpandedLineId] = useState(null);

  useEffect(() => {
    if (initialData) {
      setGlobalConcept(initialData.concept || 'Compra Conjunta');
      if (initialData.date) setDate(initialData.date);
      if (initialData.items && initialData.items.length > 0) {
        setLines(initialData.items.map((item, idx) => ({
          id: Date.now() + idx,
          concept: item.concept || '',
          amount: item.amount || '',
          splitMode: 'equal',
          customSplits: {}
        })));
      }
    }
  }, [initialData]);

  const totalAmount = lines.reduce((acc, line) => acc + (parseFloat(line.amount) || 0), 0);

  const addLine = () => {
    setLines([...lines, { id: Date.now(), concept: '', amount: '', splitMode: 'equal', customSplits: {} }]);
  };

  const removeLine = (id) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const updateLine = (id, updates) => {
    setLines(lines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleLineSplitChange = (lineId, userId, amount) => {
    const line = lines.find(l => l.id === lineId);
    const newSplits = { ...line.customSplits, [userId]: amount };
    updateLine(lineId, { customSplits: newSplits, splitMode: 'custom' });
  };

  const toggleSplitMode = (lineId) => {
    const line = lines.find(l => l.id === lineId);
    const newMode = line.splitMode === 'equal' ? 'custom' : 'equal';
    
    if (newMode === 'custom' && Object.keys(line.customSplits).length === 0) {
      const initialSplits = {};
      const share = ((parseFloat(line.amount) || 0) / members.length).toFixed(2);
      members.forEach(m => initialSplits[m.id] = share);
      updateLine(lineId, { splitMode: newMode, customSplits: initialSplits });
    } else {
      updateLine(lineId, { splitMode: newMode });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalAmount <= 0 || !activeHousehold) return;

    // Validate manual splits
    const invalidLines = lines.filter(line => {
      if (line.splitMode === 'custom') {
        const lineTotal = parseFloat(line.amount) || 0;
        const assigned = Object.values(line.customSplits).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
        return Math.abs(lineTotal - assigned) > 0.01;
      }
      return false;
    });

    if (invalidLines.length > 0) {
      alert("Algunas líneas tienen repartos manuales que no coinciden con el total.");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        concept: globalConcept,
        amount: totalAmount,
        category: 'otros',
        paidBy,
        date,
        isPaid: true,
        items: lines.map(l => ({
          concept: l.concept || 'Sin concepto',
          amount: parseFloat(l.amount) || 0,
          splitMode: l.splitMode,
          customSplits: l.customSplits,
          participants: members.map(m => m.id)
        }))
      };

      await expenseService.addExpense(activeHousehold.id, expenseData);
      setLines([{ id: Date.now(), concept: '', amount: '', splitMode: 'equal', customSplits: {} }]);
      setGlobalConcept('Compra Conjunta');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error("Error saving multi-line expense:", error);
      alert("Error al guardar los gastos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-8 border border-orange-100 dark:border-stone-800 shadow-xl space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-orange-50 dark:border-stone-800 pb-6">
        <div>
          <h3 className="font-headline text-3xl font-bold text-stone-900 dark:text-white mb-1">Repartidor de Gastos</h3>
          <p className="text-stone-500 text-sm">Añade ítems y asigna quién paga cada parte.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="bg-stone-100 dark:bg-stone-800 rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-stone-400">calendar_today</span>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="bg-transparent border-none p-0 text-xs font-bold text-stone-600 dark:text-stone-300 focus:ring-0"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Concepto General</label>
          <input 
            type="text"
            placeholder="Ej. Supermercado Semanal"
            value={globalConcept}
            onChange={e => setGlobalConcept(e.target.value)}
            className="w-full bg-orange-50/50 dark:bg-stone-800/50 border-none rounded-[2rem] p-5 text-lg font-bold text-stone-800 dark:text-white focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Líneas de Gasto</label>
            <button 
              type="button" 
              onClick={addLine}
              className="flex items-center gap-2 text-primary font-bold text-xs hover:underline"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Añadir línea
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const isExpanded = expandedLineId === line.id;
              const lineTotal = parseFloat(line.amount) || 0;
              const assigned = Object.values(line.customSplits).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
              const isBalanced = line.splitMode === 'equal' || Math.abs(lineTotal - assigned) < 0.01;

              return (
                <div key={line.id} className="bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-800 rounded-[2rem] overflow-hidden transition-all hover:border-orange-200 dark:hover:border-stone-700 shadow-sm">
                  <div className="p-4 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-black text-stone-400">
                      {idx + 1}
                    </span>
                    <input 
                      type="text"
                      placeholder="Ítem..."
                      value={line.concept}
                      onChange={e => updateLine(line.id, { concept: e.target.value })}
                      className="flex-1 bg-transparent border-none p-0 font-bold text-stone-800 dark:text-stone-200 focus:ring-0 placeholder:text-stone-300"
                    />
                    <div className="flex items-center bg-orange-50/50 dark:bg-stone-800/50 rounded-xl px-3 py-2 border border-orange-100 dark:border-stone-800 focus-within:border-primary transition-colors">
                      <span className="text-stone-400 font-bold text-xs mr-1">{currencySymbol}</span>
                      <input 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={line.amount}
                        onChange={e => updateLine(line.id, { amount: e.target.value })}
                        className="bg-transparent border-none p-0 w-20 text-right font-black text-stone-900 dark:text-white focus:ring-0"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setExpandedLineId(isExpanded ? null : line.id)}
                      className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-primary text-white shadow-lg' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-primary'}`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isExpanded ? 'settings_suggest' : 'group'}
                      </span>
                    </button>
                    {lines.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-orange-50 dark:border-stone-800 bg-orange-50/20 dark:bg-stone-800/20 animate-in slide-in-from-top duration-300">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reparto de esta línea</span>
                        <div className="flex bg-white dark:bg-stone-900 p-1 rounded-xl shadow-sm border border-orange-100 dark:border-stone-800">
                          <button 
                            type="button"
                            onClick={() => toggleSplitMode(line.id)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${line.splitMode === 'equal' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
                          >
                            Equitativo
                          </button>
                          <button 
                            type="button"
                            onClick={() => toggleSplitMode(line.id)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${line.splitMode === 'custom' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
                          >
                            Manual
                          </button>
                        </div>
                      </div>

                      {line.splitMode === 'equal' ? (
                        <p className="text-center text-xs font-bold text-stone-500 py-4 bg-white/50 dark:bg-stone-900/50 rounded-2xl border border-dashed border-orange-100 dark:border-stone-800">
                          Dividido entre {members.length} miembros: <span className="text-primary">{formatAmount(lineTotal / members.length)} c/u</span>
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <img src={member.photoURL} alt={member.displayName} className="w-8 h-8 rounded-full border border-white shadow-sm" />
                                <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{member.displayName.split(' ')[0]}</span>
                              </div>
                              <div className="flex items-center bg-white dark:bg-stone-900 border border-orange-100 dark:border-stone-800 rounded-xl px-3 py-1.5">
                                <span className="text-stone-300 text-[10px] font-bold mr-2">{currencySymbol}</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={line.customSplits[member.id] || ''}
                                  onChange={e => handleLineSplitChange(line.id, member.id, e.target.value)}
                                  className="bg-transparent border-none p-0 w-16 text-right font-black text-sm text-stone-900 dark:text-white focus:ring-0"
                                />
                              </div>
                            </div>
                          ))}
                          {!isBalanced && (
                            <p className="text-[10px] font-black text-rose-500 text-center uppercase tracking-widest pt-2">
                              Faltan {formatAmount(lineTotal - assigned)} por asignar
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-orange-50 dark:border-stone-800 space-y-6">
          <div className="flex justify-between items-center px-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">¿Quién pagó el total?</label>
             <div className="flex gap-2">
               {members.map(member => (
                 <button 
                  key={member.id}
                  type="button"
                  onClick={() => setPaidBy(member.id)}
                  className={`w-10 h-10 rounded-full border-2 transition-all p-0.5 ${paidBy === member.id ? 'border-primary shadow-lg scale-110' : 'border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                 >
                   <img src={member.photoURL} alt={member.displayName} className="w-full h-full rounded-full object-cover" />
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-stone-900 text-white rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Total a Registrar</p>
              <h4 className="text-4xl font-black tracking-tighter">{formatAmount(totalAmount)}</h4>
            </div>

            <button 
              disabled={isSubmitting || totalAmount <= 0}
              className="w-full md:w-auto bg-primary text-on-primary px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
