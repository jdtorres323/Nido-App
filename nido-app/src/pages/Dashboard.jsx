import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import Layout from '../components/Layout';
import MultiLineSplitter from '../components/MultiLineSplitter';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeHousehold, members, expenses, balances, loading, formatAmount } = useHousehold();

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

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('sv');
  });

  const dailyStats = last7Days.map(date => {
    const dayExpenses = expenses.filter(exp => {
      let rawDate = exp.date;
      if (!rawDate && exp.createdAt) {
        const d = exp.createdAt.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt);
        rawDate = d.toLocaleDateString('sv');
      }
      if (!rawDate) return false;
      const expDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      return expDate === date;
    });
    return dayExpenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
  });

  const maxDaily = Math.max(...dailyStats, 100);

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
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-headline text-2xl font-bold text-stone-900 dark:text-white mb-1">Tendencia Semanal</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">Gasto acumulado en los últimos 7 días</p>
            </div>
            <Link to="/analisis" className="bg-orange-50 dark:bg-stone-800 p-3 rounded-2xl text-orange-600 hover:bg-orange-100 transition-colors">
              <span className="material-symbols-outlined">open_in_new</span>
            </Link>
          </div>

          <div className="flex items-end justify-between h-40 gap-3 md:gap-6">
            {dailyStats.map((amount, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4">
                <div 
                  className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-2xl transition-all hover:scale-105 hover:shadow-lg relative group/bar" 
                  style={{ height: `${(amount / maxDaily) * 100}%`, minHeight: '8px' }}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    {formatAmount(amount)}
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                  {(() => {
                    const [y, m, d] = last7Days[i].split('-').map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][dateObj.getDay()];
                  })()}
                </span>
              </div>
            ))}
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
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSettled ? 'text-stone-400' : (balance >= 0 ? 'text-emerald-600' : 'text-rose-500')}`}>
                      {isSettled ? 'Al día' : (balance >= 0 ? 'Te debe' : 'Le debes')}
                    </p>
                  </div>
                </div>
                <p className={`font-headline text-2xl font-bold ${isSettled ? 'text-stone-300' : (balance >= 0 ? 'text-stone-900 dark:text-white' : 'text-rose-600')}`}>
                  {formatAmount(Math.abs(balance))}
                </p>
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

