import { useState } from 'react';

export default function ServiceCalculator({ total, membersCount, currencySymbol, monthName, formatAmount }) {
  const [splitCount, setSplitCount] = useState(membersCount || 2);
  const perPerson = total / splitCount;

  const handleCopy = () => {
    const text = `🏠 *Resumen de Servicios - ${monthName}*\n\nTotal acumulado: ${formatAmount(total)}\nDividido entre: ${splitCount} personas\n\n👉 *Cada uno paga: ${formatAmount(perPerson)}*`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Resumen de Servicios Nido',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('¡Resumen copiado al portapapeles!');
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-[2.5rem] p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-headline text-xl text-on-surface">Calculadora de Cuotas</h3>
          <p className="text-xs text-on-surface-variant font-medium">Divide el total entre los miembros</p>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">calculate</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Total Monthly Amount (Read Only) */}
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Total a dividir</span>
          <p className="text-2xl font-black text-on-surface">{formatAmount(total)}</p>
        </div>

        {/* Split Counter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Dividir entre</span>
            <span className="text-sm font-bold text-primary">{splitCount} personas</span>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-lowest p-2 rounded-3xl border border-outline-variant/50">
            <button 
              onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
              className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-30"
              disabled={splitCount <= 1}
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="flex-1 text-center font-black text-xl">
              {splitCount}
            </div>
            <button 
              onClick={() => setSplitCount(splitCount + 1)}
              className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-primary text-on-primary p-6 rounded-[2rem] shadow-lg shadow-primary/20 flex flex-col items-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Monto por persona</span>
          <p className="text-4xl font-black tracking-tighter">
            {formatAmount(perPerson)}
          </p>
        </div>

        <button 
          onClick={handleCopy}
          className="w-full bg-on-surface text-surface py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-xl active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">share</span>
          Informar Familia
        </button>
      </div>
    </div>
  );
}
