import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { aiService } from '../services/aiService';
import MultiLineSplitter from '../components/MultiLineSplitter';

export default function Escaner() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles || selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setPreviews(selectedFiles.map(file => URL.createObjectURL(file)));
    setResult(null);
    setAnalyzing(true);

    try {
      const data = await aiService.analyzeReceipt(selectedFiles);
      setResult(data);
    } catch (error) {
      console.error("AI Analysis error:", error);
      alert("Error al analizar la imagen. Por favor, intenta de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <section className="text-center md:text-left space-y-2">
        <h1 className="font-headline text-4xl md:text-5xl text-on-background">Scanner IA</h1>
        <p className="text-on-surface-variant font-medium">Digitaliza tus tickets y deja que Nido se encargue de la contabilidad.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Col: Upload / Preview */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
           {previews.length === 0 ? (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="bg-surface-container-low rounded-[3rem] border-4 border-dashed border-outline-variant p-12 flex flex-col items-center justify-center min-h-[400px] gap-6 cursor-pointer hover:border-primary/40 hover:bg-surface-container transition-all group"
             >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                </div>
                <div className="text-center">
                   <p className="text-xl font-headline text-on-surface">Subir o Capturar Tickets</p>
                   <p className="text-sm text-on-surface-variant font-medium">Puedes seleccionar varias fotos para facturas largas</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                  onChange={handleFileSelect} 
                />
             </div>
           ) : (
             <div className="bg-surface-container-lowest rounded-[3rem] overflow-hidden border border-outline-variant shadow-xl relative max-h-[600px] mx-auto flex flex-col">
                <div className="flex overflow-x-auto snap-x snap-mandatory">
                  {previews.map((preview, idx) => (
                    <img key={idx} src={preview} alt={`Vista previa ${idx + 1}`} className="w-full h-[500px] object-cover snap-center flex-shrink-0" />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                <button 
                  onClick={() => { setPreviews([]); setFiles([]); setResult(null); }}
                  className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white p-3 rounded-full hover:bg-rose-500 transition-colors z-10"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>
           )}

           {/* IA Status Card */}
           <div className={`p-8 rounded-[2.5rem] border transition-all ${analyzing ? 'bg-primary/5 border-primary/20 animate-pulse' : 'bg-surface-container-low border-outline-variant'}`}>
              <div className="flex items-center gap-4 mb-4">
                 <div className={`w-3 h-3 rounded-full ${analyzing ? 'bg-primary' : 'bg-emerald-400'}`}></div>
                 <p className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">
                   {analyzing ? 'Procesando con Gemini IA...' : 'Motor de IA Listo'}
                 </p>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Nuestra IA detecta conceptos, ítems y fechas automáticamente. Revisa los datos y asigna costos antes de confirmar.
              </p>
           </div>
        </div>

        {/* Right Col: Extracted Data */}
        <div className="lg:col-span-12 xl:col-span-7">
           {!result ? (
             <div className="bg-on-surface text-surface rounded-[3rem] p-8 md:p-12 shadow-2xl h-full flex flex-col min-h-[500px]">
                <div className="flex justify-between items-start mb-10 border-b border-surface/10 pb-8">
                   <h3 className="font-headline text-3xl italic">Datos Extraídos</h3>
                   <div className="text-right">
                      <p className="font-headline text-4xl font-bold text-primary">---</p>
                      <p className="text-surface/50 text-[10px] uppercase font-black tracking-widest leading-none mt-1">Gasto Estimado</p>
                   </div>
                </div>

                {!analyzing && (
                  <div className="flex-grow flex flex-col items-center justify-center text-surface/30 gap-4">
                     <span className="material-symbols-outlined text-6xl">list_alt</span>
                     <p className="font-medium">Sube tickets para ver el detalle línea por línea</p>
                  </div>
                )}

                {analyzing && (
                  <div className="flex-grow space-y-6 py-6">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-16 bg-surface/5 rounded-2xl animate-pulse"></div>
                     ))}
                  </div>
                )}
             </div>
           ) : (
             <div className="h-full">
               <MultiLineSplitter initialData={result} onSaveSuccess={() => navigate('/')} />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
