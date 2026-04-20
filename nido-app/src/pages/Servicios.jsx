import { useHousehold } from '../context/HouseholdContext';

export default function Servicios() {
  const { activeHousehold, expenses, loading } = useHousehold();

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // Filter expenses that are likely services (simplified for now)
  const servicesExpenses = expenses.filter(exp => 
    exp.category === 'hogar' || exp.category === 'servicios' || 
    ['luz', 'agua', 'gas', 'internet', 'alquiler', 'netflix', 'spotify'].some(s => exp.concept.toLowerCase().includes(s))
  );

  const totalServicesAmount = servicesExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Services Hero Summary */}
      <section className="bg-on-surface text-surface rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="font-headline text-4xl md:text-5xl leading-tight italic">Resumen de Suministros</h1>
            <p className="text-surface/60 max-w-md font-medium">Gestiona y proyecta los gastos fijos de tu hogar para evitar sorpresas a fin de mes.</p>
          </div>
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/10 min-w-[240px]">
            <p className="font-label text-[10px] uppercase font-black tracking-widest opacity-60 mb-2">Compromiso Mensual</p>
            <p className="font-headline text-4xl font-bold">
              {totalServicesAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Statistics & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Active Services List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-end">
            <h2 className="font-headline text-3xl text-on-background uppercase tracking-tighter">Historial de Facturas</h2>
            <span className="text-xs font-black uppercase tracking-widest text-primary-container px-4 py-2 bg-on-primary-container/10 rounded-full">
              {servicesExpenses.length} Registros
            </span>
          </div>
          
          <div className="space-y-4">
            {servicesExpenses.map(service => (
              <div key={service.id} className="bg-surface-container-lowest p-6 rounded-[2.5rem] border border-outline-variant flex items-center justify-between group hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-3xl">
                      {service.concept.toLowerCase().includes('luz') ? 'bolt' : 
                       (service.concept.toLowerCase().includes('agua') ? 'water_drop' : 
                       (service.concept.toLowerCase().includes('internet') ? 'wifi' : 'receipt_long'))}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-xl">{service.concept}</h4>
                    <p className="text-on-surface-variant text-xs font-medium">{new Date(service.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline text-2xl font-bold text-on-surface tracking-tighter">
                    {service.amount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Registrado
                  </span>
                </div>
              </div>
            ))}
            {servicesExpenses.length === 0 && (
              <div className="py-24 text-center space-y-4 bg-surface-container-low rounded-[3rem] border-2 border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-6xl text-outline-variant">receipt_long</span>
                <p className="font-label text-on-surface-variant italic">No hay facturas registradas este mes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Predictions / Smart Tips */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-primary-container rounded-[2.5rem] p-10 space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-on-primary-container/5 rounded-full blur-2xl"></div>
              <h3 className="font-headline text-2xl text-on-primary-container italic">Smart Projections</h3>
              <div className="space-y-8">
                 {[
                   { name: 'Electricidad', amount: '~ 45€', status: 'Cerca del promedio' },
                   { name: 'Sumi. Agua', amount: '~ 22€', status: 'Bajo consumo' }
                 ].map((proj, idx) => (
                   <div key={idx} className="flex justify-between items-start">
                     <div>
                       <p className="font-bold text-on-primary-container text-lg leading-none mb-1">{proj.name}</p>
                       <p className="text-[10px] text-on-primary-container/60 uppercase font-black tracking-widest">{proj.status}</p>
                     </div>
                     <p className="font-headline text-xl font-bold text-on-primary-container">{proj.amount}</p>
                   </div>
                 ))}
              </div>
              <button className="w-full bg-on-primary-container text-primary-container py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity shadow-lg">
                Optimizar Gastos
              </button>
           </div>

           <div className="p-10 border border-outline-variant rounded-[3rem] space-y-6 bg-surface-container-low">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">lightbulb</span>
              </div>
              <h4 className="font-headline text-xl text-on-surface">Nido Tip</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                El gasto de luz ha subido un <span className="text-primary font-bold">12%</span> respecto al mes pasado. Considera revisar tus electrodomésticos en modo espera.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
