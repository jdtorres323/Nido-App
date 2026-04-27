import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { expenseService } from '../services/expenseService';
import ExpenseSplitter from '../components/ExpenseSplitter';

export default function NuevoGasto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { activeHousehold, members, expenses, currencySymbol, formatAmount } = useHousehold();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isItemized, setIsItemized] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    concept: '',
    category: 'otros',
    paidBy: user?.uid || '',
    paymentStatus: 'Pagado',
    date: new Date().toLocaleDateString('sv'),
    participants: [],
    splitMode: 'equal', 
    customSplits: {} 
  });

  const [lines, setLines] = useState([
    { id: Date.now(), concept: '', amount: '', splitMode: 'equal', customSplits: {} }
  ]);

  const [expandedLineId, setExpandedLineId] = useState(null);

  useEffect(() => {
    if (id && expenses.length > 0) {
      const expenseToEdit = expenses.find(e => e.id === id);
      if (expenseToEdit) {
        setIsItemized(!!(expenseToEdit.items && expenseToEdit.items.length > 0));
        setFormData({
          amount: expenseToEdit.amount || '',
          concept: expenseToEdit.concept || '',
          category: expenseToEdit.category || 'otros',
          paidBy: expenseToEdit.paidBy || user?.uid || '',
          paymentStatus: expenseToEdit.isPaid ? 'Pagado' : 'Pendiente',
          date: expenseToEdit.date || expenseToEdit.processedDate || new Date().toLocaleDateString('sv'),
          participants: expenseToEdit.participants || [],
          splitMode: expenseToEdit.splitMode || 'equal',
          customSplits: expenseToEdit.customSplits || {}
        });

        if (expenseToEdit.items && expenseToEdit.items.length > 0) {
          setLines(expenseToEdit.items.map((item, idx) => ({
            id: idx,
            concept: item.concept,
            amount: item.amount.toString(),
            splitMode: item.splitMode || 'equal',
            customSplits: item.customSplits || {}
          })));
        }
      }
    }
  }, [id, expenses, user]);

  const addLine = () => {
    setLines([...lines, { id: Date.now(), concept: '', amount: '', splitMode: 'equal', customSplits: {} }]);
  };

  const removeLine = (lineId) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== lineId));
    }
  };

  const updateLine = (lineId, updates) => {
    setLines(lines.map(l => l.id === lineId ? { ...l, ...updates } : l));
  };

  const toggleLineSplitMode = (lineId) => {
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

  const handleLineSplitChange = (lineId, userId, amount) => {
    const line = lines.find(l => l.id === lineId);
    const newSplits = { ...line.customSplits, [userId]: amount };
    updateLine(lineId, { customSplits: newSplits, splitMode: 'custom' });
  };

  const totalItemAmount = lines.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const finalAmount = isItemized ? totalItemAmount : parseFloat(formData.amount);
    if (!finalAmount || (isItemized ? lines.some(l => !l.concept) : !formData.concept) || !activeHousehold) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    // Validate manual splits if itemized
    if (isItemized) {
      const invalidLine = lines.find(l => {
        if (l.splitMode === 'custom') {
          const lAmount = parseFloat(l.amount) || 0;
          const assigned = Object.values(l.customSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
          return Math.abs(lAmount - assigned) > 0.01;
        }
        return false;
      });
      if (invalidLine) {
        alert(`El reparto manual del ítem "${invalidLine.concept}" no coincide con su monto.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        ...formData,
        amount: finalAmount,
        isPaid: formData.paymentStatus === 'Pagado',
        participants: formData.participants.length > 0 ? formData.participants : members.map(m => m.id),
        items: isItemized ? lines.map(l => ({
          concept: l.concept,
          amount: parseFloat(l.amount),
          splitMode: l.splitMode,
          customSplits: l.customSplits,
          participants: members.map(m => m.id)
        })) : []
      };

      if (id) {
        await expenseService.updateExpense(id, expenseData);
      } else {
        await expenseService.addExpense(activeHousehold.id, expenseData);
      }
      navigate('/');
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error al guardar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    
    setIsSubmitting(true);
    try {
      await expenseService.deleteExpense(id);
      navigate('/');
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error al eliminar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-surface-container-low md:bg-transparent rounded-[3rem] p-8 md:p-0">
        
        <section className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-on-surface text-surface mb-2">
            <span className="material-symbols-outlined text-3xl">{id ? 'edit_square' : 'add_shopping_cart'}</span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl text-on-surface italic">{id ? 'Editar Registro' : 'Nuevo Registro'}</h1>
          
          <div className="flex justify-center mt-6">
            <div className="bg-surface-container-highest p-1 rounded-2xl inline-flex gap-1 border border-outline-variant shadow-sm">
              <button 
                type="button"
                onClick={() => setIsItemized(false)}
                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!isItemized ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Gasto Simple
              </button>
              <button 
                type="button"
                onClick={() => setIsItemized(true)}
                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isItemized ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Desglosado
              </button>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {isItemized ? (
            /* Itemized Mode UI */
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-4">
                <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Concepto del Ticket / Compra</label>
                <input 
                  required
                  type="text"
                  placeholder="Ej. Compra Semanal Mercadona"
                  className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
                  value={formData.concept}
                  onChange={e => setFormData({...formData, concept: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Categoría</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: 'comida',       label: 'Alimentación',  icon: 'shopping_cart',  color: 'bg-amber-100 text-amber-700 border-amber-200' },
                    { value: 'servicios',    label: 'Servicios',     icon: 'electrical_services', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { value: 'suministros',  label: 'Suministros',   icon: 'lightbulb',      color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                    { value: 'transporte',   label: 'Transporte',    icon: 'directions_car', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                    { value: 'ocio',         label: 'Ocio',          icon: 'movie',          color: 'bg-purple-100 text-purple-700 border-purple-200' },
                    { value: 'hogar',        label: 'Hogar',         icon: 'home_work',      color: 'bg-rose-100 text-rose-700 border-rose-200' },
                    { value: 'salud',        label: 'Salud',         icon: 'health_and_safety', color: 'bg-red-100 text-red-700 border-red-200' },
                    { value: 'otros',        label: 'Otros',         icon: 'more_horiz',     color: 'bg-stone-100 text-stone-600 border-stone-200' },
                  ].map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat.value})}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 font-bold text-xs transition-all ${
                        formData.category === cat.value
                          ? `${cat.color} border-current scale-105 shadow-md`
                          : 'border-outline-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                  <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Desglose de Líneas</label>
                  <button type="button" onClick={addLine} className="flex items-center gap-2 text-primary font-bold text-xs hover:underline">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Añadir línea
                  </button>
                </div>
                <div className="space-y-4">
                  {lines.map((line, idx) => {
                    const isExpanded = expandedLineId === line.id;
                    const lineTotal = parseFloat(line.amount) || 0;
                    const assigned = Object.values(line.customSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const isBalanced = line.splitMode === 'equal' || Math.abs(lineTotal - assigned) < 0.01;

                    return (
                      <div key={line.id} className="bg-surface-container-lowest border border-outline-variant rounded-[2.5rem] overflow-hidden transition-all">
                        <div className="p-4 md:p-6 flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-black text-on-surface-variant">
                            {idx + 1}
                          </span>
                          <input 
                            type="text"
                            placeholder="Ítem (ej. Leche)"
                            value={line.concept}
                            onChange={e => updateLine(line.id, { concept: e.target.value })}
                            className="flex-1 bg-transparent border-none p-0 font-bold text-on-surface focus:ring-0 placeholder:text-on-surface/20"
                          />
                          <div className="flex items-center bg-surface-container-highest rounded-xl px-4 py-2 border border-outline-variant">
                            <span className="text-on-surface-variant/40 font-bold text-xs mr-1">{currencySymbol}</span>
                            <input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={line.amount}
                              onChange={e => updateLine(line.id, { amount: e.target.value })}
                              className="bg-transparent border-none p-0 w-20 text-right font-black text-on-surface focus:ring-0"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => setExpandedLineId(isExpanded ? null : line.id)}
                            className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
                          >
                            <span className="material-symbols-outlined text-sm">{isExpanded ? 'settings_suggest' : 'group'}</span>
                          </button>
                          {lines.length > 1 && (
                            <button type="button" onClick={() => removeLine(line.id)} className="p-2 text-on-surface-variant/30 hover:text-rose-500 transition-colors">
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="px-8 pb-8 pt-2 border-t border-outline-variant/30 bg-primary/5 animate-in slide-in-from-top duration-300">
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Reparto de esta línea</span>
                              <div className="flex bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant">
                                <button 
                                  type="button" 
                                  onClick={() => toggleLineSplitMode(line.id)}
                                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${line.splitMode === 'equal' ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}
                                >
                                  Equitativo
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => toggleLineSplitMode(line.id)}
                                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${line.splitMode === 'custom' ? 'bg-on-surface text-surface' : 'text-on-surface-variant'}`}
                                >
                                  Manual
                                </button>
                              </div>
                            </div>

                            {line.splitMode === 'equal' ? (
                              <p className="text-center text-xs font-bold text-on-surface-variant py-4 bg-surface-container-lowest/50 rounded-2xl border border-dashed border-outline-variant">
                                Dividido entre {members.length} miembros: <span className="text-primary">{formatAmount(lineTotal / members.length)} c/u</span>
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {members.map(member => (
                                  <div key={member.id} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <img src={member.photoURL} alt={member.displayName} className="w-8 h-8 rounded-full border border-white shadow-sm" />
                                      <span className="text-sm font-bold text-on-surface">{member.displayName.split(' ')[0]}</span>
                                    </div>
                                    <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-1.5">
                                      <span className="text-on-surface-variant/30 text-[10px] font-bold mr-2">{currencySymbol}</span>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={line.customSplits[member.id] || ''}
                                        onChange={e => handleLineSplitChange(line.id, member.id, e.target.value)}
                                        className="bg-transparent border-none p-0 w-16 text-right font-black text-sm text-on-surface focus:ring-0"
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

              <div className="bg-on-surface text-surface rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface/40 mb-1">Total Acumulado</p>
                  <h4 className="text-5xl font-black tracking-tighter">{formatAmount(totalItemAmount)}</h4>
                </div>
              </div>
            </div>
          ) : (
            /* Simple Mode UI */
            <div className="animate-in fade-in duration-500 space-y-10">
              <div className="flex flex-col items-center gap-2">
                <label className="font-black text-[10px] uppercase tracking-[0.3em] text-primary">Importe Total</label>
                <div className="flex items-center justify-center group">
                  <span className="text-4xl text-on-surface/20 mr-4 font-bold">{currencySymbol}</span>
                  <input 
                    autoFocus
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="bg-transparent border-none text-6xl md:text-8xl font-bold tracking-tighter text-on-surface focus:ring-0 text-center w-full max-w-[300px] placeholder:text-on-surface/10"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Concepto</label>
                  <input 
                    required
                    type="text"
                    placeholder="Ej. Compra Semanal"
                    className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
                    value={formData.concept}
                    onChange={e => setFormData({...formData, concept: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Categoría</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'comida',       label: 'Alimentación',  icon: 'shopping_cart',       color: 'bg-amber-100 text-amber-700 border-amber-200' },
                      { value: 'servicios',    label: 'Servicios',     icon: 'electrical_services', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                      { value: 'suministros',  label: 'Suministros',   icon: 'lightbulb',           color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
                      { value: 'transporte',   label: 'Transporte',    icon: 'directions_car',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                      { value: 'ocio',         label: 'Ocio',          icon: 'movie',               color: 'bg-purple-100 text-purple-700 border-purple-200' },
                      { value: 'hogar',        label: 'Hogar',         icon: 'home_work',           color: 'bg-rose-100 text-rose-700 border-rose-200' },
                      { value: 'salud',        label: 'Salud',         icon: 'health_and_safety',   color: 'bg-red-100 text-red-700 border-red-200' },
                      { value: 'otros',        label: 'Otros',         icon: 'more_horiz',          color: 'bg-stone-100 text-stone-600 border-stone-200' },
                    ].map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat.value})}
                        className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 font-bold text-xs transition-all ${
                          formData.category === cat.value
                            ? `${cat.color} border-current scale-105 shadow-md`
                            : 'border-outline-variant text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="font-headline text-2xl text-on-surface italic text-center">Configuración de Reparto</h3>
                <ExpenseSplitter 
                  total={parseFloat(formData.amount) || 0}
                  members={members}
                  currencySymbol={currencySymbol}
                  value={{ splitMode: formData.splitMode, customSplits: formData.customSplits }}
                  onChange={(val) => setFormData({ ...formData, ...val })}
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4 block text-center md:text-left">Fecha del Gasto</label>
              <input 
                required
                type="date"
                className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary text-center"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="space-y-4 text-center md:text-left">
              <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">¿Quién pagó?</label>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 p-2">
                {members.map(member => (
                  <button 
                    key={member.id}
                    type="button"
                    onClick={() => setFormData({...formData, paidBy: member.id})}
                    className={`w-14 h-14 rounded-2xl border-2 transition-all p-1 ${formData.paidBy === member.id ? 'border-primary shadow-lg scale-110' : 'border-outline-variant opacity-40 grayscale hover:opacity-100'}`}
                  >
                    <img src={member.photoURL} alt={member.displayName} className="w-full h-full rounded-xl object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row gap-6">
            {id && (
              <button type="button" onClick={handleDelete} disabled={isSubmitting} className="flex-1 bg-rose-50 text-rose-600 rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-[0.3em] border border-rose-100 hover:bg-rose-100 transition-all disabled:opacity-30">
                Eliminar
              </button>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting || (isItemized ? totalItemAmount <= 0 : !formData.amount)} 
              className="flex-[2] bg-on-surface text-surface rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
            >
              {isSubmitting ? 'Guardando...' : (id ? 'Actualizar' : 'Registrar Gasto')}
            </button>
            <button type="button" onClick={() => navigate('/')} className="flex-1 bg-surface-container-high text-on-surface rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-widest border border-outline-variant hover:bg-surface-container transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
