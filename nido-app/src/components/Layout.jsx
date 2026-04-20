import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { householdService } from '../services/householdService';

export default function Layout({ children, title }) {
  const location = useLocation();
  const path = location.pathname;
  const { user, loginWithGoogle, logout } = useAuth();
  const { activeHousehold, members } = useHousehold();

  const handleCreateFirstHousehold = async () => {
    if (user) {
      await householdService.createHousehold(user.uid, "Mi Hogar");
    }
  };

  const navItems = [
    { name: 'Inicio', path: '/', icon: 'home' },
    { name: 'Gastos', path: '/servicios', icon: 'receipt_long' },
    { name: 'Escáner', path: '/escaner', icon: 'document_scanner' },
    { name: 'Análisis', path: '/analisis', icon: 'analytics' },
    { name: 'Familia', path: '/familia', icon: 'family_restroom' },
  ];

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
          <button className="bg-surface-container-lowest border border-outline text-primary px-6 py-4 rounded-full font-bold shadow-sm hover:bg-surface-container-low transition-all">
            Unirme con un ID
          </button>
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
          <div className="mt-8 bg-surface-container p-4 rounded-2xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black shadow-inner overflow-hidden uppercase">
              {activeHousehold?.name?.charAt(0) || 'H'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-on-surface truncate whitespace-nowrap">{activeHousehold?.name || 'Hogar'}</p>
              <p className="text-xs text-on-surface-variant">{members.length} miembros</p>
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
      <header className="md:ml-72 flex justify-between items-center px-6 py-6 w-full bg-surface dark:bg-stone-950 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h2 className="font-headline text-3xl text-on-background">{title}</h2>
        </div>
        <div className="flex items-center gap-4 md:hidden">
          <img 
            alt={user.displayName} 
            className="w-10 h-10 rounded-full border-2 border-primary-container shadow-sm object-cover" 
            src={user.photoURL} 
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 space-y-12 pb-40 md:pb-10 max-w-screen-2xl">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container/90 backdrop-blur-xl border-t border-outline-variant px-2 pt-3 pb-safe flex justify-around items-end z-50 rounded-t-[2.5rem] shadow-[0_-4px_40px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 2).map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 pb-2 px-4 transition-all ${path === item.path ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-2xl" style={path === item.path ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
            <span className="font-label text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}

        {/* FAB in the middle */}
        <div className="relative -top-8">
          <Link 
            to="/nuevo-gasto" 
            className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(154,68,45,0.4)] border-4 border-surface"
          >
            <span className="material-symbols-outlined text-3xl font-black">add</span>
          </Link>
        </div>

        {navItems.slice(3).map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 pb-2 px-4 transition-all ${path === item.path ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-2xl" style={path === item.path ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
            <span className="font-label text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
