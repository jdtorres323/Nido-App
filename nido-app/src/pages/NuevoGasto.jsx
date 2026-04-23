import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { expenseService } from '../services/expenseService';

export default function NuevoGasto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { activeHousehold, members, expenses, currencySymbol } = useHousehold();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    concept: '',
    category: 'otros',
    paidBy: user?.uid || '',
    paymentStatus: 'Pagado',
    date: new Date().toLocaleDateString('sv'),
    participants: [] 
  });

  useEffect(() => {
    if (id && expenses.length > 0) {
      const expenseToEdit = expenses.find(e => e.id === id);
      if (expenseToEdit) {
        setFormData({
          amount: expenseToEdit.amount || '',
          concept: expenseToEdit.concept || '',
          category: expenseToEdit.category || 'otros',
          paidBy: expenseToEdit.paidBy || user?.uid || '',
          paymentStatus: expenseToEdit.paymentStatus || 'Pagado',
          date: expenseToEdit.date || (expenseToEdit.createdAt ? (expenseToEdit.createdAt.toDate ? expenseToEdit.createdAt.toDate() : new Date(expenseToEdit.createdAt)).toLocaleDateString('sv') : new Date().toLocaleDateString('sv')),
          participants: expenseToEdit.participants || []
        });
      }
    }
  }, [id, expenses, user]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount || !formData.concept || !activeHousehold) return;

    setIsSubmitting(true);
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        isPaid: formData.paymentStatus === 'Pagado',
        participants: formData.participants.length > 0 ? formData.participants : members.map(m => m.id)
      };

      if (id) {
        await expenseService.updateExpense(id, expenseData);
      } else {
        await expenseService.addExpense(activeHousehold.id, expenseData);
      }
      navigate('/');
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error al guardar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    
    setIsSubmitting(true);
    try {
      await expenseService.deleteExpense(id);
      navigate('/');
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error al eliminar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile-Friendly Container */}
      <div className="bg-surface-container-low md:bg-transparent rounded-[3rem] p-8 md:p-0">
        
        {/* Header Branding */}
        <section className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-on-surface text-surface mb-2">
            <span className="material-symbols-outlined text-3xl">{id ? 'edit_square' : 'add_shopping_cart'}</span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl text-on-surface italic">{id ? 'Editar Gasto' : 'Gasto Manual'}</h1>
          <p className="text-on-surface-variant font-medium max-w-xs mx-auto">
            {id ? 'Modifica los detalles de este gasto registrado.' : 'Registra un nuevo desembolso para que el nido esté al día.'}
          </p>
        </section>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Amount Input Section */}
          <div className="flex flex-col items-center gap-2">
             <label className="font-black text-[10px] uppercase tracking-[0.3em] text-primary">Importe Total</label>
             <div className="flex items-center justify-center group">
                <span className="text-4xl text-on-surface/20 mr-4 font-bold">{currencySymbol}</span>
                <input 
                  autoFocus
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-transparent border-none text-6xl md:text-8xl font-bold tracking-tighter text-on-surface focus:ring-0 text-center w-full max-w-[300px] placeholder:text-on-surface/10"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Concept Input */}
            <div className="space-y-4">
               <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Concepto del Gasto</label>
               <input 
                 required
                 type="text"
                 placeholder="Ej. Mercadona Semanal"
                 className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
                 value={formData.concept}
                 onChange={e => setFormData({...formData, concept: e.target.value})}
               />
            </div>

            {/* Category Select */}
            <div className="space-y-4">
               <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4">Categoría</label>
               <select 
                 className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value})}
               >
                 <option value="comida">Alimentación</option>
                 <option value="hogar">Hogar & Servicios</option>
                 <option value="ocio">Ocio & Placer</option>
                 <option value="otros">Otros</option>
               </select>
            </div>

            {/* Date Input */}
            <div className="space-y-4 md:col-span-2">
               <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant px-4 text-center block">Fecha del Gasto</label>
               <input 
                 required
                 type="date"
                 className="w-full bg-surface-container-highest border-none rounded-[2.5rem] p-6 text-xl font-bold text-on-surface focus:ring-2 focus:ring-primary text-center"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
            </div>
          </div>

          {/* Payer Selection */}
          <div className="space-y-6 pt-4">
             <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant block text-center">¿Quién pagó esta vez?</label>
             <div className="flex flex-wrap justify-center gap-6">
                {members.map(member => (
                  <button 
                    key={member.id}
                    type="button"
                    onClick={() => setFormData({...formData, paidBy: member.id})}
                    className={`flex flex-col items-center gap-3 group transition-all ${formData.paidBy === member.id ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                  >
                    <div className={`w-20 h-20 rounded-[2.5rem] p-1 border-2 transition-colors ${formData.paidBy === member.id ? 'border-primary' : 'border-outline-variant'}`}>
                       <img src={member.photoURL} alt={member.displayName} className="w-full h-full rounded-[2.2rem] object-cover" />
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-tighter ${formData.paidBy === member.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {member.id === user?.uid ? 'Tú' : member.displayName.split(' ')[0]}
                    </span>
                  </button>
                ))}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-10 flex flex-col md:flex-row gap-6">
             {id && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-rose-50 text-rose-600 rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-[0.3em] border border-rose-100 hover:bg-rose-100 transition-all disabled:opacity-30"
                >
                  Eliminar
                </button>
             )}
             <button 
               type="submit"
               disabled={isSubmitting || !formData.amount || !formData.concept}
               className="flex-[2] bg-on-surface text-surface rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
             >
               {isSubmitting ? 'Procesando...' : (id ? 'Actualizar' : 'Guardar Gasto')}
             </button>
             <button 
               type="button"
               onClick={() => navigate('/')}
               className="flex-1 bg-surface-container-high text-on-surface rounded-[2.5rem] py-6 font-black text-xs uppercase tracking-widest border border-outline-variant hover:bg-surface-container transition-all"
             >
               Cancelar
             </button>
          </div>
        </form>

        {/* AI Scanner Shortcut for Mobile */}
        <div className="mt-16 p-8 bg-primary/5 rounded-[3rem] border border-primary/10 flex items-center justify-between gap-6">
           <div className="space-y-1">
              <p className="font-bold text-on-surface">¿Tienes un ticket físico?</p>
              <p className="text-sm text-on-surface-variant font-medium">Usa la cámara para autocompletar.</p>
           </div>
           <Link to="/escaner" className="bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">qr_code_scanner</span>
           </Link>
        </div>

      </div>
    </div>
  );
}
