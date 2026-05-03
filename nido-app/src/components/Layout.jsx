import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { householdService } from '../services/householdService';

export default function Layout({ children, title }) {
  const location = useLocation();
  const path = location.pathname;
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { activeHousehold, members, expenses, formatAmount, loading: householdLoading } = useHousehold();

  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [lastSeenExpenseCount, setLastSeenExpenseCount] = useState(() => {
    return parseInt(localStorage.getItem('nido_last_expense_count') || '0');
  });

  const hasNewNotifications = (expenses?.length || 0) > lastSeenExpenseCount;

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) {
      const count = expenses?.length || 0;
      setLastSeenExpenseCount(count);
      localStorage.setItem('nido_last_expense_count', count.toString());
    }
  };

  const handleCreateFirstHousehold = async () => {
    if (user) {
      await householdService.createHousehold(user.uid, "Mi Hogar");
    }
  };

  const handleJoinHousehold = async (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const household = await householdService.getHousehold(joinId.trim());
      if (household) {
        await householdService.joinHousehold(user.uid, joinId.trim());
        window.location.reload();
      } else {
        setError('ID de hogar no encontrado. Verifica e intenta de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al intentar unirse al hogar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const navItems = [
    { name: 'Inicio', path: '/', icon: 'home' },
    { name: 'Gastos', path: '/servicios', icon: 'receipt_long' },
    { name: 'Escáner', path: '/escaner', icon: 'document_scanner' },
    { name: 'Análisis', path: '/analisis', icon: 'analytics' },
    { name: 'Familia', path: '/familia', icon: 'family_restroom' },
  ];

  if (authLoading || (user && householdLoading)) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center font-body">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant animate-pulse">Cargando tu Nido...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center font-body">
        <h1 className="font-headline italic text-5xl text-primary mb-4">Nido Organic</h1>
        <p className="text-on-surface-variant mb-8 max-w-sm">Gestiona los gastos de tu hogar de forma sencilla, inteligente y compartida.</p>
        <button 
          onClick={loginWithGoogle}
          className="bg-surface-container-lowest border border-outline-variant px-8 py-4 rounded-full shadow-sm flex items-center gap-3 font-bold text-on-surface hover:bg-surface-container-low transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          Continuar con Google
        </button>
      </div>
    );
  }

  if (user && !activeHousehold) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center font-body">
        <h1 className="font-headline text-3xl text-on-background mb-4">¡Bienvenido, {user.displayName}!</h1>
        <p className="text-on-surface-variant mb-8">Parece que aún no perteneces a ningún hogar.</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={handleCreateFirstHousehold}
            className="bg-primary text-on-primary px-6 py-4 rounded-full font-bold shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            Crear mi primer Hogar
          </button>
          {!showJoinInput ? (
            <button 
              onClick={() => setShowJoinInput(true)}
              className="bg-surface-container-lowest border border-outline text-primary px-6 py-4 rounded-full font-bold shadow-sm hover:bg-surface-container-low transition-all"
            >
              Unirme con un ID
            </button>
          ) : (
            <form onSubmit={handleJoinHousehold} className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <input 
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Introduce el ID del hogar"
                className="w-full px-6 py-4 rounded-2xl bg-surface-container-highest border border-outline focus:border-primary outline-none text-center font-bold"
                disabled={isProcessing}
                autoFocus
              />
              {error && <p className="text-error text-xs font-bold">{error}</p>}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowJoinInput(false)}
                  className="flex-1 bg-surface-container-low text-on-surface-variant px-4 py-3 rounded-xl font-bold text-sm"
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-primary text-on-primary px-4 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                  disabled={isProcessing || !joinId.trim()}
                >
                  {isProcessing ? 'Validando...' : 'Confirmar ID'}
                </button>
              </div>
            </form>
          )}
          <button onClick={logout} className="text-on-surface-variant text-sm hover:underline mt-4">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col py-8 bg-surface-container-low border-r border-outline-variant w-72 z-50">
        <div className="px-8 mb-10">
          <h1 className="font-headline italic text-3xl text-primary">Nido</h1>
          <div className="mt-8 bg-surface-container-high/50 p-4 rounded-3xl flex items-center gap-4 border border-outline-variant/30">
            <img 
              src="/household.png" 
              alt="Hogar" 
              className="w-14 h-14 rounded-2xl object-cover shadow-ambient border-2 border-surface" 
            />
            <div className="overflow-hidden">
              <p className="font-headline font-bold text-on-surface truncate text-lg tracking-tight">{activeHousehold?.name || 'Mi Hogar'}</p>
              <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {members.length} miembros
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${path === item.path ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined" style={path === item.path ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
              <span className="text-base">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="px-6 mt-auto">
          <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant flex items-center gap-3 mb-4">
            <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border border-primary-container" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{user.displayName}</p>
              <button onClick={logout} className="text-[10px] uppercase tracking-widest font-black text-primary hover:underline">Salir</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Header (Top Nav) */}
      <header className="md:ml-72 flex justify-between items-center px-6 py-6 w-full bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h2 className="font-headline text-3xl font-bold text-on-background tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={handleNotificationClick}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative group"
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">notifications</span>
              {hasNewNotifications && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-surface"></span>
              )}
            </button>
            
            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-surface-container-highest border border-outline-variant rounded-[2rem] shadow-2xl p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-headline font-bold text-on-surface">Notificaciones</h3>
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recientes</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(!expenses || expenses.length === 0) ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">notifications_off</span>
                      <p className="text-xs text-on-surface-variant font-medium">No hay actividad reciente</p>
                    </div>
                  ) : (
                    expenses?.slice(0, 5).map(exp => (
                      <div key={exp.id} className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">receipt_long</span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-on-surface truncate">{exp.concept || 'Gasto nuevo'}</p>
                          <p className="text-[10px] text-on-surface-variant line-clamp-1">
                            {members.find(m => m.id === exp.paidBy)?.displayName || 'Alguien'} registró {formatAmount(exp.totalAmount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant">
                  <button 
                    onClick={() => {
                      if ("Notification" in window) {
                        Notification.requestPermission().then(permission => {
                          alert(permission === "granted" ? "¡Genial! Notificaciones habilitadas." : "Notificaciones denegadas.");
                        });
                      }
                    }}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">settings</span>
                    Configurar alertas push
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-outline-variant relative">
            <img 
              alt={user.displayName} 
              className="w-10 h-10 rounded-full border-2 border-primary-container shadow-sm object-cover cursor-pointer" 
              src={user.photoURL}
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            />
            {isProfileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-highest border border-outline-variant rounded-2xl shadow-xl p-2 z-[60] animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error/10 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
          <div className="md:hidden relative">
            <img 
              alt={user.displayName} 
              className="w-10 h-10 rounded-full border-2 border-primary-container shadow-sm object-cover cursor-pointer active:scale-90 transition-transform" 
              src={user.photoURL}
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            />
            {isProfileMenuOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" onClick={() => setIsProfileMenuOpen(false)}>
                <div className="bg-surface w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-outline-variant animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <img src={user.photoURL} alt={user.displayName} className="w-20 h-20 rounded-full border-4 border-primary-container" />
                    <div className="text-center">
                      <p className="font-headline text-xl font-bold text-on-surface">{user.displayName}</p>
                      <p className="text-sm text-on-surface-variant">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 bg-error text-on-error py-4 rounded-2xl font-bold shadow-lg shadow-error/20 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Cerrar sesión
                  </button>
                  <button 
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="w-full mt-3 py-3 text-on-surface-variant font-bold text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 space-y-12 pb-40 md:pb-10 max-w-screen-2xl">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container/95 backdrop-blur-xl border-t border-outline-variant px-2 pt-2 pb-safe grid grid-cols-5 items-center justify-items-center z-50 rounded-t-[2.5rem] shadow-[0_-4px_40px_rgba(0,0,0,0.1)]">
        {/* Slot 1: Inicio */}
        <Link to="/" className={`flex flex-col items-center gap-1 w-full transition-all ${path === '/' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl" style={path === '/' ? {fontVariationSettings: "'FILL' 1"} : {}}>home</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-tighter">Inicio</span>
        </Link>

        {/* Slot 2: Gastos */}
        <Link to="/servicios" className={`flex flex-col items-center gap-1 w-full transition-all ${path === '/servicios' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl" style={path === '/servicios' ? {fontVariationSettings: "'FILL' 1"} : {}}>receipt_long</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-tighter">Gastos</span>
        </Link>

        {/* Slot 3: Elevated FAB (The middle one, smaller but higher) */}
        <div className="relative flex items-center justify-center w-full">
          <Link 
            to="/nuevo-gasto" 
            className="absolute -top-12 w-12 h-12 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(154,68,45,0.4)] border-4 border-surface active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl font-black">add</span>
          </Link>
        </div>

        {/* Slot 4: Escáner */}
        <Link to="/escaner" className={`flex flex-col items-center gap-1 w-full transition-all ${path === '/escaner' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl" style={path === '/escaner' ? {fontVariationSettings: "'FILL' 1"} : {}}>document_scanner</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-tighter">Escáner</span>
        </Link>

        {/* Slot 5: Análisis */}
        <Link to="/analisis" className={`flex flex-col items-center gap-1 w-full transition-all ${path === '/analisis' ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-2xl" style={path === '/analisis' ? {fontVariationSettings: "'FILL' 1"} : {}}>analytics</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-tighter">Análisis</span>
        </Link>
      </nav>
    </div>
  );
}
