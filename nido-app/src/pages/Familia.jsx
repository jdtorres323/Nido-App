import { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { invitationService } from '../services/invitationService';

export default function Familia() {
  const { user } = useAuth();
  const { activeHousehold, members, balances, expenses, formatAmount } = useHousehold();

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

  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !activeHousehold) return;
    
    setIsSending(true);
    try {
      await invitationService.sendInvitation(
        inviteEmail, 
        activeHousehold.id, 
        activeHousehold.name || 'Hogar Sin Nombre',
        user?.displayName || 'Un miembro de tu familia'
      );
      alert(`Invitación enviada a ${inviteEmail}. Cuando inicien sesión con Google, verán la invitación.`);
      setInviteEmail('');
    } catch (err) {
      alert(err.message || "Error al enviar la invitación");
    } finally {
      setIsSending(false);
    }
  };

  const copyInviteLink = () => {
    const link = `https://nido-organic-app-jd.web.app/?invite=${activeHousehold?.id}`;
    navigator.clipboard.writeText(link);
    alert('Link de invitación copiado. Compártelo con tu familia.');
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-background tracking-tighter italic">Tu Nido</h1>
          <p className="text-on-surface-variant mt-2 font-medium">Gestiona los miembros y la configuración de tu hogar.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex items-center gap-3 bg-surface-container-high px-5 py-4 rounded-2xl border border-outline-variant shadow-sm w-full md:w-auto">
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Moneda del Hogar</span>
              <select 
                value={activeHousehold?.currency || 'EUR'}
                onChange={handleCurrencyChange}
                className="bg-transparent text-sm font-bold text-on-surface outline-none cursor-pointer"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar (US$)</option>
                <option value="UYU">Peso Uruguayo ($U)</option>
                <option value="MXN">Peso Mexicano ($)</option>
                <option value="ARS">Peso Argentino ($)</option>
                <option value="COP">Peso Colombiano ($)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {members.map((member, index) => {
          const balance = balances[member.id] || 0;
          const isMe = member.id === user?.uid;
          const isAdmin = index === 0;

          return (
            <div key={member.id} className="bg-surface p-8 rounded-[3rem] shadow-sm border border-outline-variant flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-6 right-6">
                <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'bg-primary text-on-primary' : (isMe ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-on-surface-variant')}`}>
                  {isAdmin ? 'Admin' : (isMe ? 'Tú' : 'Miembro')}
                </span>
              </div>
              
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-surface-container-low mb-6 shadow-2xl transition-transform group-hover:rotate-3 duration-300">
                <img 
                  alt={member.displayName} 
                  className="w-full h-full object-cover"
                  src={member.photoURL} 
                />
              </div>
              
              <h3 className="text-xl font-black text-on-background">{member.displayName}</h3>
              <p className="text-on-surface-variant text-xs mb-4 font-medium">{member.email}</p>
              
              <div className={`px-6 py-3 rounded-2xl mb-6 w-full ${balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Balance Actual</p>
                <p className="font-black text-2xl tracking-tighter">
                  {balance >= 0 ? '+' : ''}{formatAmount(balance)}
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Aportes</span>
                  <span className="text-on-surface font-bold text-xs">85%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Gastos</span>
                  <span className="text-on-surface font-bold text-xs">12</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Invite New Member Card */}
        <div className="bg-on-surface text-surface p-8 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="w-16 h-16 rounded-[1.5rem] bg-surface text-on-surface flex items-center justify-center mb-6 shadow-lg">
            <span className="material-symbols-outlined text-3xl">mail_lock</span>
          </div>
          
          <h3 className="text-xl font-black italic tracking-tighter mb-2">Invitar a unirte</h3>
          <p className="text-surface/60 text-xs mb-8 font-medium">Envía una invitación directa al Gmail de la persona.</p>
          
          <form onSubmit={handleSendInvite} className="w-full space-y-4">
            <input 
              required
              type="email"
              placeholder="ejemplo@gmail.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full bg-surface/10 border border-surface/20 rounded-2xl py-4 px-6 text-sm font-bold text-surface placeholder:text-surface/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button 
              type="submit"
              disabled={isSending || !inviteEmail}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSending ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </form>
          
          <button 
            onClick={copyInviteLink}
            className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-surface/40 hover:text-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Copiar Link Directo
          </button>
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

