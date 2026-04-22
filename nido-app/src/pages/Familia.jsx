import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Familia() {
  const { user } = useAuth();
  const { activeHousehold, members, balances, expenses } = useHousehold();

  const copyHouseholdId = () => {
    if (activeHousehold?.id) {
      navigator.clipboard.writeText(activeHousehold.id);
      alert('¡ID del Hogar copiado!');
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    if (activeHousehold?.id) {
      try {
        await updateDoc(doc(db, 'households', activeHousehold.id), {
          currency: newCurrency
        });
      } catch (err) {
        console.error("Error updating currency", err);
      }
    }
  };

  // Stats calculation
  const currentMonth = new Date().getMonth();
  const expensesThisMonth = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth;
  }).length;

  const settledMembers = members.filter(m => Math.abs(balances[m.id] || 0) < 0.01).length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-on-background tracking-tight">Directorio del Hogar</h1>
          <p className="text-on-surface-variant mt-2">Gestiona los miembros de tu grupo familiar y moneda local.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex items-center gap-2 bg-surface px-4 py-3 rounded-xl border border-outline-variant shadow-sm w-full md:w-auto justify-between">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">payments</span>
            <select 
              value={activeHousehold?.currency || 'EUR'}
              onChange={handleCurrencyChange}
              className="bg-transparent text-sm font-bold text-on-surface outline-none cursor-pointer flex-1 text-right md:text-left"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="UYU">Peso Uruguayo ($U)</option>
              <option value="MXN">Peso Mexicano ($)</option>
              <option value="ARS">Peso Argentino ($)</option>
              <option value="COP">Peso Colombiano ($)</option>
            </select>
          </div>
          <button 
            onClick={copyHouseholdId}
            className="flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-6 rounded-xl font-semibold shadow-md active:scale-95 transition-transform w-full md:w-auto"
          >
            <span className="material-symbols-outlined">link</span>
            <span>Copiar Link</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {members.map((member, index) => {
          const balance = balances[member.id] || 0;
          const isMe = member.id === user?.uid;
          const isAdmin = index === 0; // Temporary logic for admin

          return (
            <div key={member.id} className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant flex flex-col items-center text-center relative overflow-hidden group">
              {isAdmin && (
                <div className="absolute top-0 right-0 p-4">
                  <span className="inline-flex items-center rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
                    Administrador
                  </span>
                </div>
              )}
              {isMe && !isAdmin && (
                 <div className="absolute top-0 right-0 p-4">
                  <span className="inline-flex items-center rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
                    Tú
                  </span>
                </div>
              )}
              
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-low mb-6 shadow-xl transition-transform group-hover:scale-105 duration-300">
                <img 
                  alt={member.displayName} 
                  className="w-full h-full object-cover"
                  src={member.photoURL} 
                />
              </div>
              
              <h3 className="text-xl font-bold text-on-background">{member.displayName}</h3>
              <p className="text-on-surface-variant text-sm mb-2">{member.email}</p>
              
              <p className={`font-headline text-lg font-bold mb-6 ${balance >= 0 ? 'text-on-surface' : 'text-error'}`}>
                Balance: {balance >= 0 ? '+' : ''}{balance.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
              </p>

              <div className="w-full space-y-3">
                <div className={`flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant ${isMe ? '' : 'opacity-50'}`}>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">PayPal</span>
                  <span className="text-on-surface font-medium italic">{isMe ? '@' + member.displayName.replace(/\s+/g, '').toLowerCase() : 'No vinculado'}</span>
                </div>
                <div className={`flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant ${!isMe ? 'opacity-50' : ''}`}>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">Venmo</span>
                  <span className="text-on-surface font-medium italic">{!isMe ? 'No vinculado' : member.displayName.replace(/\s+/g, '-').toLowerCase()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Invite New Member Card */}
        <div 
          onClick={copyHouseholdId}
          className="border-2 border-dashed border-outline p-8 rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-surface-container-low transition-all duration-300"
        >
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-on-primary-container text-3xl">person_add</span>
          </div>
          <h3 className="text-lg font-bold text-on-background">Invitar Miembro</h3>
          <p className="text-on-surface-variant text-sm mt-2 max-w-[200px]">Copia el ID del hogar para añadir a alguien nuevo</p>
          <p className="font-mono text-xs font-bold mt-4 bg-surface-container px-3 py-1 rounded-lg text-primary">{activeHousehold?.id}</p>
        </div>
      </div>

      {/* Summary Stats Card (Asymmetric Layout) */}
      <div className="bg-gradient-to-br from-primary to-[#5A2A18] p-8 rounded-3xl shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between text-on-primary">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold mb-2">Estado del Grupo</h3>
          <p className="text-on-primary/80 mb-6">Actualmente hay {members.length} miembros activos compartiendo gastos.</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="block text-2xl font-bold">{expensesThisMonth}</span>
              <span className="text-xs uppercase tracking-tighter text-on-primary/80">Gastos este mes</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="block text-2xl font-bold">{settledMembers}/{members.length}</span>
              <span className="text-xs uppercase tracking-tighter text-on-primary/80">Pagos al día</span>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex flex-col gap-3">
          <button className="bg-surface text-primary px-6 py-3 rounded-xl font-bold hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2 shadow-lg">
            <span className="material-symbols-outlined">settings</span>
            <span>Configurar Reglas</span>
          </button>
          <button className="bg-black/20 text-on-primary border border-white/20 px-6 py-3 rounded-xl font-bold hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">history</span>
            <span>Historial de Pagos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

