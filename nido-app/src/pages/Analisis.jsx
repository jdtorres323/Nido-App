import { useHousehold } from '../context/HouseholdContext';

export default function Analisis() {
  const { expenses, activeHousehold } = useHousehold();

  const totalAmount = expenses.reduce((acc, exp) => acc + (parseFloat(exp.amount) || 0), 0);
  
  const categories = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'otros';
    acc[cat] = (acc[cat] || 0) + (parseFloat(exp.amount) || 0);
    return acc;
  }, {});

  const categoryLabels = {
    comida: 'Alimentación',
    hogar: 'Hogar & Suministros',
    ocio: 'Ocio & Placer',
    otros: 'Otros',
    servicios: 'Servicios'
  };

  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Page Header */}
      <section className="space-y-2">
        <h1 className="font-headline text-4xl md:text-5xl text-on-background">Análisis de Nido</h1>
        <p className="text-on-surface-variant font-medium">Visualiza los flujos de dinero y descubre patrones de gasto.</p>
      </section>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Trend Chart Card */}
        <div className="md:col-span-8 bg-surface-container-low p-8 rounded-[3rem] border border-outline-variant shadow-sm flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-2xl text-on-surface">Tendencia Semanal</h3>
            <div className="text-right">
                <p className="font-label text-[10px] uppercase font-black tracking-widest text-primary">Inversión Total</p>
                <p className="text-3xl font-bold text-on-surface tracking-tighter">
                  {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                </p>
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-around gap-2 px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl pointer-events-none"></div>
            {[40, 55, 45, 75, 85, 65, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                 <div className="w-full bg-primary/20 rounded-2xl transition-all hover:bg-primary group relative" style={{height: `${h}%`}}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       {Math.round(totalAmount * (h / 100))}€
                    </div>
                 </div>
                 <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                 </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="md:col-span-4 bg-surface-container-highest p-8 rounded-[3rem] border border-outline-variant flex flex-col items-center">
          <h3 className="font-headline text-2xl text-on-surface w-full mb-8">Categorías</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" fill="transparent" r="80" stroke="rgba(154,68,45,0.1)" strokeWidth="20"></circle>
              <circle cx="96" cy="96" fill="transparent" r="80" stroke="#9a442d" strokeDasharray="502" strokeDashoffset={502 - (502 * 0.75)} strokeLinecap="round" strokeWidth="20"></circle>
            </svg>
            <div className="absolute text-center">
              <p className="font-headline text-3xl font-bold text-on-surface">75%</p>
              <p className="font-label text-[10px] text-on-surface-variant uppercase font-black">Hogar</p>
            </div>
          </div>
          <div className="w-full mt-10 space-y-4">
            {sortedCategories.slice(0, 4).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between items-center group">
                <span className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${cat === 'comida' ? 'bg-primary' : (cat === 'ocio' ? 'bg-secondary' : 'bg-outline')}`}></span> 
                  <span className="text-sm font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">
                    {categoryLabels[cat] || cat}
                  </span>
                </span>
                <span className="font-headline font-bold text-on-surface">
                  {((amount / (totalAmount || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="bg-on-surface text-surface p-10 rounded-[3rem] shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-primary opacity-20 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-8xl">auto_awesome</span>
             </div>
             <div className="relative z-10 space-y-4">
                <h4 className="font-headline text-2xl italic">Insight Inteligente</h4>
                <p className="text-surface/70 leading-relaxed text-lg">
                  Hemos notado que los domingos por la noche suelen concentrar el 40% de los gastos en "Ocio". Podrías ahorrar hasta un 15% planificando con antelación.
                </p>
                <button className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity">
                  Ver Detalles
                </button>
             </div>
          </div>

          <div className="bg-surface-container-high p-10 rounded-[3rem] border border-outline-variant space-y-6">
             <h4 className="font-headline text-2xl text-on-surface">Distribución de Responsables</h4>
             <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                   {expenses.slice(0, 3).map((e, i) => (
                     <div key={i} className="w-12 h-12 rounded-full border-4 border-surface shadow-sm bg-primary-container"></div>
                   ))}
                </div>
                <p className="text-on-surface-variant font-medium text-sm">
                   Este mes, <span className="text-on-surface font-bold">Tú</span> has gestionado el 60% de los tickets registrados.
                </p>
             </div>
             <div className="h-4 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant flex">
                <div className="h-full bg-primary" style={{width: '60%'}}></div>
                <div className="h-full bg-secondary" style={{width: '40%'}}></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
