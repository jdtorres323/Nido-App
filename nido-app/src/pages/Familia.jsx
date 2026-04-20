import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';

export default function Familia() {
  const { user } = useAuth();
  const { activeHousehold, members, balances } = useHousehold();

  const copyHouseholdId = () => {
    if (activeHousehold?.id) {
      navigator.clipboard.writeText(activeHousehold.id);
      alert('¡ID del Hogar copiado!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Invite & Info Card */}
      <section className="bg-surface-container-high rounded-[3rem] p-8 md:p-12 border border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left space-y-2">
            <h1 className="font-headline text-4xl md:text-5xl text-on-background">Tu Nido Familiar</h1>
            <p className="text-on-surface-variant font-medium">Gestiona quiénes forman parte de este espacio y comparte los gastos.</p>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white flex flex-col items-center gap-4 shadow-sm">
            <p className="font-label text-[10px] uppercase font-black text-primary tracking-widest">Código de Invitación</p>
            <div className="flex items-center gap-3 bg-surface-container-lowest px-6 py-3 rounded-2xl border border-outline-variant font-mono font-bold text-on-surface text-lg">
              {activeHousehold?.id?.slice(0, 8)}...
              <button 
                onClick={copyHouseholdId}
                className="material-symbols-outlined text-primary hover:scale-110 transition-transform"
              >
                content_copy
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <h2 className="font-headline text-3xl text-on-background">Miembros del Hogar</h2>
          <span className="bg-primary-container text-on-primary-container px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            {members.length} Total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map(member => {
            const balance = balances[member.id] || 0;
            const isMe = member.id === user?.uid;
            const isSettled = Math.abs(balance) < 0.01;

            return (
              <div key={member.id} className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-outline-variant flex items-center justify-between group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-container shadow-inner" 
                      alt={member.displayName} 
                      src={member.photoURL} 
                    />
                    {isMe && (
                      <div className="absolute -top-1 -right-1 bg-primary text-on-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-surface shadow-sm">
                        Tú
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-xl">{member.displayName}</h3>
                    <p className="text-on-surface-variant text-xs mb-2">{member.email}</p>
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${isSettled ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                       <span className="text-[10px] font-black uppercase tracking-tighter text-on-surface-variant">
                         {isSettled ? 'Al día' : 'Pagos pendientes'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <p className={`font-headline text-xl font-bold ${balance >= 0 ? 'text-on-surface' : 'text-rose-500'}`}>
                    {Math.abs(balance).toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                  </p>
                  <p className="font-label text-[10px] uppercase font-bold text-outline-variant">
                     Balance Neto
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* House Rules Shortcut */}
      <section className="bg-on-surface text-surface rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="font-headline text-2xl">Reglas de Convivencia</h3>
          <p className="text-surface/60 max-w-sm">Define cómo se dividen los gastos, las fechas de corte y quién es el administrador principal.</p>
        </div>
        <button className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center gap-3">
          <span className="material-symbols-outlined">settings</span>
          Configurar Hogar
        </button>
      </section>
    </div>
  );
}

