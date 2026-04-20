import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { activeHousehold, members, expenses, balances, loading } = useHousehold();

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const totalBalance = expenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
  const myNetBalance = balances[user?.uid] || 0;

  return (
    <>
      {/* Hero Section - Home Balance */}
      <section className="space-y-6">
        <div className="bg-primary rounded-[3rem] p-10 text-on-primary shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="font-label text-xs uppercase tracking-[0.2em] opacity-80 mb-2">Gasto Total del Hogar</p>
              <h3 className="font-headline text-5xl md:text-7xl font-bold leading-none tracking-tighter">
                {totalBalance.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
              </h3>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${myNetBalance >= 0 ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'}`}>
                <span className="material-symbols-outlined font-black">
                  {myNetBalance >= 0 ? 'trending_up' : 'trending_down'}
                </span>
              </div>
              <div>
                <p className="font-label text-[10px] uppercase font-bold opacity-80">Tu Balance Neto</p>
                <p className="font-headline text-2xl font-bold">
                  {Math.abs(myNetBalance).toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Member Balances Scrollable (Mobile) / Grid (Desktop) */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h4 className="font-headline text-2xl text-on-background">Balances Familiares</h4>
            <Link to="/familia" className="text-primary font-bold text-sm hover:underline">Ver familia</Link>
          </div>
          
          <div className="flex overflow-x-auto pb-4 -mx-6 px-6 md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible gap-4 scrollbar-hide">
            {members.map(member => {
              const balance = balances[member.id] || 0;
              const isSettled = Math.abs(balance) < 0.01;
              const isMe = member.id === user?.uid;
              
              if (isMe) return null;

              return (
                <div key={member.id} className="min-w-[200px] bg-surface-container-low p-5 rounded-[2rem] border border-outline-variant flex flex-col items-center text-center gap-3 group transition-all hover:bg-surface-container-high">
                  <div className="relative">
                    <img className="w-16 h-16 rounded-full object-cover border-2 border-primary-container shadow-sm" alt={member.displayName} src={member.photoURL} />
                    {!isSettled && (
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-surface ${balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <span className="material-symbols-outlined text-[12px] text-white font-black">
                          {balance >= 0 ? 'check' : 'remove'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm truncate w-32">{member.displayName}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSettled ? 'text-on-surface-variant' : (balance >= 0 ? 'text-emerald-600' : 'text-rose-500')}`}>
                      {isSettled ? 'Al día' : (balance >= 0 ? 'Te debe' : 'Le debes')}
                    </p>
                  </div>
                  {!isSettled && (
                    <p className="font-headline text-lg font-bold text-on-surface">
                      {Math.abs(balance).toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                    </p>
                  )}
                  {isSettled && <p className="font-headline text-lg font-bold text-outline-variant italic">Pagado</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Activity Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h4 className="font-headline text-2xl text-on-background">Flujo de Gastos</h4>
          <button className="bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors">Historial Completo</button>
        </div>

        <div className="space-y-3">
          {expenses.slice(0, 8).map(exp => {
            const payer = members.find(m => m.id === exp.paidBy);
            const isMe = exp.paidBy === user?.uid;
            
            return (
              <div key={exp.id} className="bg-surface-container-lowest p-5 rounded-[2rem] border border-outline-variant flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>
                      {exp.category === 'ocio' ? 'movie' : (exp.category === 'comida' ? 'shopping_cart' : (exp.category === 'hogar' ? 'home_work' : 'payments'))}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-lg leading-tight mb-1">{exp.concept}</p>
                    <div className="flex items-center gap-2">
                       <div className="flex -space-x-1">
                        <img className="w-4 h-4 rounded-full ring-1 ring-surface" alt={payer?.displayName} src={payer?.photoURL} />
                       </div>
                      <span className="font-label text-[10px] text-on-surface-variant font-medium">
                        {isMe ? 'Tú pagaste' : `${payer?.displayName} pagó`} • {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline text-xl font-bold text-on-surface">
                    {exp.amount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-container px-2 py-0.5 rounded-md bg-on-primary-container/10">
                    {exp.category}
                  </span>
                </div>
              </div>
            );
          })}
          {expenses.length === 0 && (
            <div className="py-20 text-center space-y-4 bg-surface-container-low rounded-[3rem] border-2 border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-6xl text-outline-variant">receipt_long</span>
              <p className="font-label text-on-surface-variant italic">No hay registros aún en este nido.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

