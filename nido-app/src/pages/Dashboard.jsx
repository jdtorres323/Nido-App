import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Layout from '../components/Layout';
import MultiLineSplitter from '../components/MultiLineSplitter';
import { expenseService } from '../services/expenseService';

export default function Dashboard() {
  const navigate = useNavigate();
  const [trendView, setTrendView] = useState('weekly'); // 'weekly' | 'monthly'
  const { user } = useAuth();
  const { activeHousehold, members, expenses, balances, loading, formatAmount } = useHousehold();

  const handleSettle = async (memberId, amount, isUserDebtor) => {
    if (!window.confirm(`¿Quieres marcar esta deuda de ${formatAmount(Math.abs(amount))} como saldada? Se registrará un pago automático.`)) return;

    try {
      const settlementData = {
        concept: `Liquidación: ${members.find(m => m.id === memberId)?.displayName}`,
        amount: Math.abs(amount),
        category: 'otros',
        // Si YO debo, YO pago. Si ÉL debe, ÉL paga.
        paidBy: isUserDebtor ? user.uid : memberId,
        // El beneficiario es el que recibía el dinero
        participants: [isUserDebtor ? memberId : user.uid],
        date: new Date().toLocaleDateString('sv'),
        paymentStatus: 'Pagado',
        splitMode: 'custom',
        customSplits: {
          [isUserDebtor ? memberId : user.uid]: Math.abs(amount)
        }
      };

      await expenseService.addExpense(activeHousehold.id, settlementData);
    } catch (error) {
      console.error("Error al liquidar:", error);
      alert("No se pudo registrar la liquidación");
    }
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    </Layout>
  );

  const totalSpent = expenses.reduce((acc, exp) => acc + (parseFloat(exp.totalAmount || exp.amount) || 0), 0);
  
  // Calculate specific "Te deben" and "Debes" for the current user
  const myNetBalance = balances[user?.uid] || 0;
  const youAreOwed = myNetBalance > 0 ? myNetBalance : 0;
  const youOwe = myNetBalance < 0 ? Math.abs(myNetBalance) : 0;

  // --- Daily trend: last 30 days ---
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString('sv'); // YYYY-MM-DD
  });

  const dailyStats = last30Days.map(date => {
    const dayExpenses = expenses.filter(exp => {
      const expDate = (exp.processedDate || '').substring(0, 10);
      return expDate === date;
    });
    const total = dayExpenses.reduce((acc, exp) => acc + (parseFloat(exp.totalAmount) || 0), 0);
    return { total, items: dayExpenses };
  });

  const maxDaily = Math.max(...dailyStats.map(d => d.total), 1);

  // Colors per category for stacked bars
  const CAT_BAR_COLOR = {
    comida:          'bg-amber-400',
    servicios:       'bg-blue-400',
    suministros:     'bg-cyan-400',
    transporte:      'bg-emerald-400',
    ocio:            'bg-purple-400',
    hogar:           'bg-rose-400',
    salud:           'bg-red-400',
    liquidacion:     'bg-teal-400',
    otros:           'bg-stone-400',
  };
  const catColor = (cat) => CAT_BAR_COLOR[cat] || 'bg-orange-400';

  // --- Monthly trend: last 6 months ---
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString('sv').substring(0, 7); // YYYY-MM
  });

  const monthlyStats = last6Months.map(month => {
    const monthExpenses = expenses.filter(exp => {
      const expDate = (exp.processedDate || '').substring(0, 7); // YYYY-MM
      return expDate === month;
    });
    return monthExpenses.reduce((acc, exp) => acc + (parseFloat(exp.totalAmount) || 0), 0);
  });

  const maxMonthly = Math.max(...monthlyStats, 1);

  const monthLabels = last6Months.map(m => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('es-ES', { month: 'short' });
  });

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'comida': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
      case 'suministros': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'ocio': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
      case 'hogar': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'servicios': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400';
      case 'otros': return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400';
      default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'comida': return 'shopping_cart';
      case 'suministros': return 'lightbulb';
      case 'ocio': return 'movie';
      case 'hogar': return 'home_work';
      case 'servicios': return 'room_service';
      case 'otros': return 'payments';
      default: return 'receipt';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Balance Bento Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Balance Card */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-sm border border-orange-100 dark:border-stone-800 relative overflow-hidden group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-100 dark:bg-orange-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
          
          <div className="relative z-10">
            <p className="text-stone-500 dark:text-stone-400 font-medium mb-1">Balance total del hogar</p>
            <h3 className="font-headline text-5xl font-extrabold text-stone-900 dark:text-white mb-8 tracking-tighter">
              {formatAmount(totalSpent)}
            </h3>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-orange-50 dark:bg-stone-800/50 px-6 py-4 rounded-3xl border border-orange-100 dark:border-stone-700 flex items-center gap-4 transition-all hover:bg-orange-100 dark:hover:bg-stone-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined font-black" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-stone-400">Te deben</p>
                  <p className="font-headline text-2xl font-bold text-emerald-600">
                    {formatAmount(youAreOwed)}
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-stone-800/50 px-6 py-4 rounded-3xl border border-orange-100 dark:border-stone-700 flex items-center gap-4 transition-all hover:bg-orange-100 dark:hover:bg-stone-800">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                  <span className="material-symbols-outlined font-black" style={{fontVariationSettings: "'FILL' 1"}}>arrow_downward</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-stone-400">Debes</p>
                  <p className="font-headline text-2xl font-bold text-rose-600">
                    {formatAmount(youOwe)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Expense CTA Card */}
        <Link 
          to="/nuevo-gasto"
          className="bg-primary p-8 rounded-[3rem] shadow-xl shadow-primary/20 flex flex-col justify-between text-white relative overflow-hidden group transition-all hover:scale-[1.02] hover:-rotate-1 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <h4 className="font-headline text-3xl font-bold mb-3 tracking-tight">Nuevo Gasto</h4>
            <p className="text-orange-50 text-sm leading-relaxed">Añade rápidamente un ticket o factura al fondo común del nido.</p>
          </div>
          <div className="relative z-10 mt-8 self-end">
            <div className="w-16 h-16 bg-white text-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-90 transition-transform duration-500">
              <span className="material-symbols-outlined text-4xl font-black">add</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Quick Entry Multi-line Splitter */}
      <MultiLineSplitter />

      {/* Mini Trend Section */}
      <section className="bg-white dark:bg-stone-900 p-10 rounded-[3.5rem] border border-orange-100 dark:border-stone-800 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-10 text-orange-600/5 group-hover:scale-110 transition-transform duration-700">
          <span className="material-symbols-outlined text-9xl font-black">analytics</span>
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
            <div>
              <h3 className="font-headline text-2xl font-bold text-stone-900 dark:text-white mb-1">
                {trendView === 'weekly' ? 'Últimos 30 Días' : 'Tendencia Mensual'}
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                {trendView === 'weekly' ? 'Gasto diario en los últimos 30 días' : 'Gasto acumulado por mes (últimos 6 meses)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <div className="bg-orange-50 dark:bg-stone-800 p-1 rounded-2xl inline-flex gap-1 border border-orange-100 dark:border-stone-700">
                <button
                  onClick={() => setTrendView('weekly')}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    trendView === 'weekly'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  Últimos 30d
                </button>
                <button
                  onClick={() => setTrendView('monthly')}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    trendView === 'monthly'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  Últimos 6m
                </button>
              </div>
              <Link to="/analisis" className="bg-orange-50 dark:bg-stone-800 p-3 rounded-2xl text-orange-600 hover:bg-orange-100 transition-colors">
                <span className="material-symbols-outlined">open_in_new</span>
              </Link>
            </div>
          </div>

          {trendView === 'weekly' ? (
            <div className="flex items-end gap-1 sm:gap-2 pt-4">
              {dailyStats.map(({ total, items }, i) => {
                const barPx = total > 0 ? Math.max((total / maxDaily) * 130, 8) : 4;
                const isEmpty = total === 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                    {/* Rich tooltip */}
                    {!isEmpty && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-3 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-30 pointer-events-none min-w-max">
                        {items.map((exp, j) => (
                          <div key={j} className="flex justify-between gap-3">
                            <span className="text-stone-300 truncate max-w-[120px]">{exp.concept}</span>
                            <span className="font-bold text-white">{formatAmount(parseFloat(exp.totalAmount) || 0)}</span>
                          </div>
                        ))}
                        {items.length > 1 && (
                          <div className="border-t border-stone-700 mt-1 pt-1 flex justify-between gap-3">
                            <span className="text-stone-400">Total</span>
                            <span className="font-bold text-orange-400">{formatAmount(total)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Stacked bar */}
                    <div
                      className="w-full rounded-t-xl overflow-hidden flex flex-col-reverse"
                      style={{ height: `${barPx}px` }}
                    >
                      {isEmpty ? (
                        <div className="w-full h-full bg-orange-100 dark:bg-stone-800" />
                      ) : (
                        items.map((exp, j) => {
                          const segPx = (parseFloat(exp.totalAmount) / total) * barPx;
                          return (
                            <div
                              key={j}
                              className={`w-full ${catColor(exp.category)} transition-all`}
                              style={{ height: `${segPx}px`, minHeight: items.length > 1 ? '3px' : undefined }}
                            />
                          );
                        })
                      )}
                    </div>
                    <span className="text-[8px] font-black text-stone-400 text-center leading-tight">
                      {(() => {
                        const [y, m, d] = last30Days[i].split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        if (i % 5 !== 0 && i !== 29) return '';
                        return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                      })()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 pt-4">
              {monthlyStats.map((amount, i) => {
                const barPx = amount > 0 ? Math.max((amount / maxMonthly) * 130, 8) : 4;
                const isEmpty = amount === 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none font-bold">
                      {amount > 0 ? formatAmount(amount) : ''}
                    </div>
                    <div
                      className={`w-full rounded-t-xl transition-all ${
                        isEmpty ? 'bg-orange-100 dark:bg-stone-800' : 'bg-gradient-to-t from-orange-600 to-orange-400 hover:opacity-80'
                      }`}
                      style={{ height: `${barPx}px` }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                      {monthLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Color legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-orange-50 dark:border-stone-800">
            {trendView === 'weekly' ? (() => {
              const seen = new Map();
              dailyStats.forEach(({ items }) =>
                items.forEach(exp => {
                  if (!seen.has(exp.category)) seen.set(exp.category, catColor(exp.category));
                })
              );
              const CAT_LABELS = {
                comida: 'Comida', servicios: 'Servicios', suministros: 'Suministros',
                transporte: 'Transporte', ocio: 'Ocio', hogar: 'Hogar',
                salud: 'Salud', liquidacion: 'Liquidación', otros: 'Otros',
              };
              return seen.size === 0
                ? <span className="text-[11px] text-stone-400 italic">Sin gastos en este período</span>
                : Array.from(seen.entries()).map(([cat, color]) => (
                  <span key={cat} className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                    {CAT_LABELS[cat] || cat}
                  </span>
                ));
            })() : (
              <span className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-orange-400" />
                Gasto mensual total
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Debts Breakdown Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-headline text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-600 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl">group</span>
            Quién debe a quién
          </h3>
          <Link to="/familia" className="text-orange-600 font-bold text-sm hover:underline flex items-center gap-1">
            Gestionar familia
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => {
            const balance = balances[member.id] || 0;
            const isSettled = Math.abs(balance) < 0.01;
            const isMe = member.id === user?.uid;
            
            if (isMe) return null;

            return (
              <div key={member.id} className={`bg-white dark:bg-stone-900 p-6 rounded-[2.5rem] border border-orange-100 dark:border-stone-800 flex items-center justify-between group hover:border-orange-300 dark:hover:border-stone-600 transition-all shadow-sm ${isSettled ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img className="w-14 h-14 rounded-full object-cover border-2 border-orange-50 dark:border-stone-800 shadow-sm transition-transform group-hover:scale-110" alt={member.displayName} src={member.photoURL} />
                    {!isSettled && (
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 ${balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <span className="material-symbols-outlined text-[10px] text-white font-black">
                          {balance >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">{member.displayName}</p>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSettled ? 'text-stone-400' : (balance > 0 ? 'text-rose-500' : 'text-emerald-600')}`}>
                      {isSettled ? 'Al día' : (balance > 0 ? 'Le debes' : 'Te debe')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className={`font-headline text-2xl font-bold ${isSettled ? 'text-stone-300' : (balance > 0 ? 'text-rose-600' : 'text-stone-900 dark:text-white')}`}>
                    {formatAmount(Math.abs(balance))}
                  </p>
                  {!isSettled && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSettle(member.id, balance, balance > 0);
                      }}
                      className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 dark:border-emerald-800/50"
                    >
                      Liquidar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="space-y-8 pb-10">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-headline text-2xl font-bold text-stone-800 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-600 bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl">history</span>
            Actividad reciente
          </h3>
          <Link to="/servicios" className="text-orange-600 font-bold text-sm hover:underline flex items-center gap-1">
            Ver historial completo
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-[3rem] border border-orange-100 dark:border-stone-800 overflow-hidden divide-y divide-orange-50 dark:divide-stone-800 shadow-sm">
          {expenses.slice(0, 5).map(exp => {
            const payer = members.find(m => m.id === exp.paidBy);
            const isMe = exp.paidBy === user?.uid;
            const categoryStyle = getCategoryStyles(exp.category);
            const categoryIcon = getCategoryIcon(exp.category);
            
            return (
              <div 
                key={exp.id} 
                onClick={() => {
                  if (exp.category === 'servicios') {
                    navigate(`/editar-servicio/${exp.id}`);
                  } else {
                    navigate(`/editar-gasto/${exp.id}`);
                  }
                }}
                className="p-6 flex items-center justify-between hover:bg-orange-50/50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 ${categoryStyle.split(' ')[0]} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <span className={`material-symbols-outlined text-3xl ${categoryStyle.split(' ')[1]}`} style={{fontVariationSettings: "'FILL' 1"}}>
                      {categoryIcon}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100 text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{exp.concept}</p>
                    <div className="flex items-center gap-2">
                      <img className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-stone-700 shadow-sm" alt={payer?.displayName} src={payer?.photoURL} />
                      <span className="text-xs text-stone-500 font-medium">
                        Pagado por {isMe ? 'Ti' : payer?.displayName} • {new Date(exp.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline text-2xl font-bold text-stone-900 dark:text-white">
                    {formatAmount(exp.amount)}
                  </p>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${categoryStyle} px-3 py-1 rounded-full`}>
                    {exp.category}
                  </span>
                </div>
              </div>
            );
          })}
          {expenses.length === 0 && (
            <div className="py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-orange-200">receipt_long</span>
              </div>
              <div>
                <p className="font-headline text-xl font-bold text-stone-400 italic">Tu nido está muy tranquilo...</p>
                <p className="text-stone-300 text-sm mt-1">Añade tu primer gasto para empezar a gestionar.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

