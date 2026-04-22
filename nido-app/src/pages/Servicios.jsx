import { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';

export default function Servicios() {
  const { activeHousehold, expenses, loading, members } = useHousehold();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // Get month name in Spanish
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Filter expenses that are services for the current month
  const servicesExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentDate.getMonth() && 
           expDate.getFullYear() === currentDate.getFullYear() &&
           (exp.category === 'hogar' || exp.category === 'servicios' || 
            ['luz', 'agua', 'gas', 'internet', 'alquiler', 'netflix', 'spotify'].some(s => exp.concept.toLowerCase().includes(s)));
  });

  const totalServicesAmount = servicesExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const paidAmount = servicesExpenses.length * 45; // Mock data for "paid" vs "pending" logic if not in DB
  const pendingAmount = totalServicesAmount - paidAmount > 0 ? totalServicesAmount - paidAmount : 0;

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getServiceIcon = (concept) => {
    const c = concept.toLowerCase();
    if (c.includes('luz') || c.includes('electricidad')) return 'bolt';
    if (c.includes('agua')) return 'water_drop';
    if (c.includes('internet') || c.includes('wifi')) return 'wifi';
    if (c.includes('alquiler') || c.includes('casa')) return 'home';
    if (c.includes('gas')) return 'mode_heat';
    return 'receipt_long';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Page Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-headline text-4xl md:text-5xl text-on-background italic tracking-tight">Gestión de Servicios</h1>
          <p className="text-on-surface-variant font-medium">Administra y proyecta los pagos mensuales de tu hogar.</p>
        </div>
        
        <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-3xl p-1.5 shadow-sm">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-3 hover:bg-surface-container-high rounded-2xl text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="px-6 py-1 text-center min-w-[160px]">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-black mb-0.5">Mes seleccionado</span>
            <span className="text-lg font-bold text-on-surface capitalize">{monthName}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-3 hover:bg-surface-container-high rounded-2xl text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Services Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="font-headline text-2xl text-on-background uppercase tracking-widest font-black">Mis Facturas</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full">
              {servicesExpenses.length} Registros
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicesExpenses.map((service) => {
              const responsible = members.find(m => m.uid === service.createdBy) || { displayName: 'Desconocido' };
              const isPaid = true;

              return (
                <div key={service.id} className="bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant flex flex-col justify-between hover:shadow-xl hover:border-primary/20 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-3xl">
                        {getServiceIcon(service.concept)}
                      </span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">{service.concept}</h3>
                      <p className="text-xs text-on-surface-variant font-medium opacity-70">
                        {service.category === 'servicios' ? 'Gasto recurrente' : 'Suministro Hogar'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <label className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest ml-1">Monto</label>
                        <div className="flex items-end border-b-2 border-outline-variant focus-within:border-primary transition-colors py-2">
                          <span className="text-on-surface-variant mr-2 font-bold text-xl">{activeHousehold?.currency || '€'}</span>
                          <span className="text-3xl font-black text-on-surface tracking-tighter">
                            {service.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant">
                          {responsible.photoURL ? (
                            <img src={responsible.photoURL} alt={responsible.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold">
                              {responsible.displayName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="text-[11px]">
                          <span className="font-bold text-on-surface">{responsible.uid === user?.uid ? 'Tú' : responsible.displayName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Service Button Card */}
            <button className="bg-surface-container-low border-2 border-dashed border-outline-variant rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/40 transition-all text-on-surface-variant group min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-outline-variant group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <span className="material-symbols-outlined text-4xl">add_circle</span>
              </div>
              <div className="text-center">
                <span className="block font-headline text-xl text-on-surface group-hover:text-primary transition-colors">Añadir Servicio</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: AI Projections & Tips */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-primary-container rounded-[2.5rem] p-10 space-y-8 shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-on-primary-container/5 rounded-full blur-2xl"></div>
            <h3 className="font-headline text-2xl text-on-primary-container italic">Smart Projections</h3>
            <div className="space-y-8">
                {[
                  { name: 'Electricidad', amount: '~ 45€', status: 'Cerca del promedio' },
                  { name: 'Sumi. Agua', amount: '~ 22€', status: 'Bajo consumo' }
                ].map((proj, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-on-primary-container/10 pb-4 last:border-0">
                    <div>
                      <p className="font-bold text-on-primary-container text-lg leading-none mb-1">{proj.name}</p>
                      <p className="text-[10px] text-on-primary-container/60 uppercase font-black tracking-widest">{proj.status}</p>
                    </div>
                    <p className="font-headline text-xl font-bold text-on-primary-container">{proj.amount}</p>
                  </div>
                ))}
            </div>
            <button className="w-full bg-on-primary-container text-primary-container py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity shadow-lg active:scale-95">
              Optimizar Gastos
            </button>
          </div>

          <div className="p-10 border border-outline-variant rounded-[3rem] space-y-6 bg-surface-container-low relative group">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl">lightbulb</span>
            </div>
            <h4 className="font-headline text-xl text-on-surface">Nido Tip</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
              El gasto de luz ha subido un <span className="text-primary font-bold">12%</span> respecto al mes pasado. Considera revisar tus electrodomésticos en modo espera.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section - Asymmetric Premium Design */}
      <section className="bg-on-surface text-surface rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 mt-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="flex-1 relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="font-headline text-3xl md:text-4xl italic tracking-tight">Resumen de {currentDate.toLocaleString('es-ES', { month: 'long' })}</h2>
            <p className="text-surface/60 max-w-lg font-medium leading-relaxed">
              {servicesExpenses.length > 0 
                ? `Faltan 2 servicios por pagar. El compromiso total proyectado es de ${totalServicesAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}.`
                : 'No hay servicios registrados para este periodo aún.'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary text-on-primary px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg active:scale-95">
              Ver Reporte Mensual
            </button>
            <button className="bg-white/10 backdrop-blur-md border border-white/20 text-surface px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all active:scale-95">
              Notificar Familia
            </button>
          </div>
        </div>

        <div className="flex gap-6 w-full lg:w-auto relative z-10">
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 min-w-[180px] flex-1 lg:flex-none">
            <span className="text-primary text-[10px] uppercase font-black tracking-widest mb-2 block">Pagado</span>
            <p className="text-3xl font-black tracking-tighter">
              {paidAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 min-w-[180px] flex-1 lg:flex-none">
            <span className="text-white/40 text-[10px] uppercase font-black tracking-widest mb-2 block">Pendiente</span>
            <p className="text-3xl font-black tracking-tighter opacity-50">
              {pendingAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
