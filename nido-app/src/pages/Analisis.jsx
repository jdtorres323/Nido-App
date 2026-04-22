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
    hogar: 'Vivienda',
    ocio: 'Ocio',
    otros: 'Otros',
    servicios: 'Servicios'
  };

  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold text-on-background tracking-tight">Análisis de Gastos</h1>
          <p className="text-on-surface-variant mt-1">Reporte detallado de los últimos 30 días para tu hogar.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-surface px-4 py-2 border border-outline-variant rounded-xl text-sm font-medium hover:bg-surface-container transition-colors">Mes actual</button>
          <button className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">Descargar PDF</button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-[2rem] border border-outline-variant shadow-sm flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl text-primary/40 mb-4">analytics</span>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">Aún no hay datos para analizar</h3>
          <p className="text-on-surface-variant max-w-md">Comienza a registrar tus gastos y servicios para que nuestra IA pueda generar reportes detallados y sugerencias de ahorro para tu hogar.</p>
        </div>
      ) : (
        <>
          {/* Bento Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Main Trend Chart (Bento Large) */}
            <div className="md:col-span-8 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-bold text-on-surface">Tendencia Mensual</h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Gasto</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-surface-container-highest"></span> Presupuesto</span>
                </div>
              </div>
              
              <div className="relative h-64 w-full mt-auto flex items-end gap-2 px-2">
                {[40, 55, 45, 70, 85, 65, 95].map((h, i) => (
                  <div key={i} className="w-full bg-primary rounded-t-xl transition-all hover:opacity-80" style={{height: `${h}%`, opacity: 0.5 + (h / 200)}}></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-on-surface-variant px-2 font-medium">
                <span>Lunes</span><span>Martes</span><span>Miércoles</span><span>Jueves</span><span>Viernes</span><span>Sábado</span><span>Domingo</span>
              </div>
            </div>

            {/* Category Breakdown (Bento Medium) */}
            <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant shadow-sm flex flex-col items-center">
              <h3 className="font-headline font-bold text-on-surface w-full mb-6">Categorías</h3>
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" fill="transparent" r="80" stroke="var(--color-primary-container, #fef3c7)" strokeWidth="24"></circle>
                  <circle cx="96" cy="96" fill="transparent" r="80" stroke="var(--color-primary, #ea580c)" strokeDasharray="502" strokeDashoffset="150" strokeLinecap="round" strokeWidth="24"></circle>
                  <circle cx="96" cy="96" fill="transparent" r="80" stroke="var(--color-secondary, #fb923c)" strokeDasharray="502" strokeDashoffset="400" strokeLinecap="round" strokeWidth="24"></circle>
                </svg>
                <div className="absolute text-center">
                  <span className="block text-2xl font-extrabold text-on-surface">
                    {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                  </span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total</span>
                </div>
              </div>
              <div className="w-full mt-8 space-y-3">
                {sortedCategories.slice(0, 3).map(([cat, amount], i) => (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-surface-container-highest'}`}></span> 
                      <span className="font-semibold text-on-surface-variant">{categoryLabels[cat] || cat}</span>
                    </span>
                    <span className="font-semibold text-on-surface">
                      {((amount / (totalAmount || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestions (Asymmetric Grid) */}
            <div className="md:col-span-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>lightbulb</span>
                <h3 className="font-headline text-xl font-bold text-on-surface">Sugerencias de IA</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Suggestion Card 1 */}
                <div className="bg-primary text-on-primary p-6 rounded-[2rem] shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 duration-300">
                    <span className="material-symbols-outlined text-9xl">bolt</span>
                  </div>
                  <div className="relative z-10">
                    <div className="bg-on-primary/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined">electric_bolt</span>
                    </div>
                    <h4 className="font-headline font-bold text-lg mb-2">Ahorro en Energía</h4>
                    <p className="text-on-primary/90 text-sm leading-relaxed font-medium">Gastaste un 15% más en luz este mes comparado con el promedio del vecindario. Considera revisar el aislamiento térmico.</p>
                    <button className="mt-4 text-[10px] font-black uppercase tracking-wider bg-surface text-primary px-4 py-2 rounded-lg hover:bg-surface-container transition-colors">Ver detalles</button>
                  </div>
                </div>

                {/* Suggestion Card 2 */}
                <div className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary-container w-10 h-10 rounded-xl flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">subscriptions</span>
                    </div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Suscripciones</span>
                  </div>
                  <h4 className="font-headline font-bold text-on-surface mb-2">Cargos Duplicados</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed font-medium">Hemos detectado dos cobros similares de "Streaming Service". Podrías ahorrar $12.99 mensuales cancelando uno.</p>
                  <div className="mt-4 flex items-center gap-2 text-primary font-bold text-sm cursor-pointer hover:underline">
                    <span>Solucionar ahora</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>

                {/* Suggestion Card 3 */}
                <div className="bg-on-surface text-surface p-6 rounded-[2rem] shadow-lg border border-outline-variant">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-surface/10 w-10 h-10 rounded-xl flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">savings</span>
                    </div>
                    <span className="text-[10px] font-black text-surface/60 uppercase tracking-wider">Metas</span>
                  </div>
                  <h4 className="font-headline font-bold text-secondary mb-2">Fondo de Emergencia</h4>
                  <p className="text-surface/80 text-sm leading-relaxed font-medium">Si mantienes este ritmo de ahorro, completarás tu meta de vacaciones 2 meses antes de lo previsto.</p>
                  <div className="mt-4 w-full bg-surface/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full w-[78%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Anomalies / Activity (Glassmorphism inspired) */}
            <div className="md:col-span-12 bg-surface-container-lowest/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-outline-variant/60 shadow-lg overflow-hidden mt-2">
              <h3 className="font-headline font-bold text-on-surface mb-6 text-xl">Mayores Gastos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[11px] font-black text-on-surface-variant uppercase border-b border-outline-variant">
                    <tr>
                      <th className="pb-4 font-medium tracking-wider">Concepto</th>
                      <th className="pb-4 font-medium tracking-wider">Fecha</th>
                      <th className="pb-4 font-medium tracking-wider">Monto</th>
                      <th className="pb-4 font-medium tracking-wider">Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {expenses.slice().sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)).slice(0, 5).map((exp, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-sm">{exp.category === 'comida' ? 'shopping_cart' : exp.category === 'hogar' ? 'home' : exp.category === 'servicios' ? 'water_drop' : exp.category === 'ocio' ? 'sports_esports' : 'receipt_long'}</span>
                          </div>
                          <span className="font-bold text-on-surface">{exp.title}</span>
                        </td>
                        <td className="py-4 text-sm font-medium text-on-surface-variant">
                          {exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 text-sm font-black text-on-surface">
                          {parseFloat(exp.amount).toLocaleString('es-ES', { style: 'currency', currency: activeHousehold?.currency || 'EUR' })}
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full bg-primary-container text-primary text-[10px] font-black uppercase tracking-wider">{categoryLabels[exp.category] || exp.category}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

