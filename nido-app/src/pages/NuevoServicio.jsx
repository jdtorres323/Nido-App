import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { expenseService } from '../services/expenseService';

export default function NuevoServicio() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { activeHousehold, members, expenses, currencySymbol } = useHousehold();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    concept: '',
    category: 'Energía', // Represents subcategory or label in this context
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    paidBy: user?.uid || '',
    isPaid: false,
  });

  useEffect(() => {
    if (id && expenses.length > 0) {
      const serviceToEdit = expenses.find(e => e.id === id);
      if (serviceToEdit) {
        setFormData({
          concept: serviceToEdit.concept || '',
          category: serviceToEdit.serviceType || 'Energía',
          amount: serviceToEdit.amount || '',
          dueDate: serviceToEdit.date ? serviceToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0],
          paidBy: serviceToEdit.paidBy || user?.uid || '',
          isPaid: !!serviceToEdit.isPaid,
        });
      }
    }
  }, [id, expenses, user]);

  const categories = [
    { id: 'Energía', icon: 'bolt', label: 'Energía' },
    { id: 'Internet', icon: 'wifi', label: 'Internet' },
    { id: 'Agua', icon: 'water_drop', label: 'Agua' },
    { id: 'Renta', icon: 'home_work', label: 'Renta' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount || !formData.concept || !activeHousehold) return;

    setIsSubmitting(true);
    try {
      const expenseData = {
        concept: formData.concept,
        amount: parseFloat(formData.amount),
        category: 'servicios', 
        paidBy: formData.paidBy,
        paymentStatus: formData.isPaid ? 'Pagado' : 'Pendiente',
        isPaid: formData.isPaid,
        date: formData.dueDate, // using due date as the expense date for now
        serviceType: formData.category, // store the specific service type
        participants: members.map(m => m.id) // Default split among everyone
      };

      if (id) {
        await expenseService.updateExpense(id, expenseData);
      } else {
        await expenseService.addExpense(activeHousehold.id, expenseData);
      }
      navigate('/servicios');
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    
    setIsSubmitting(true);
    try {
      await expenseService.deleteExpense(id);
      navigate('/servicios');
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error al eliminar el servicio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-4 pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full">
      {/* Main Card */}
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant overflow-hidden relative">
        {/* Decorative Header Accent */}
        <div className="h-2 w-full bg-primary"></div>
        <div className="p-8 sm:p-12 flex flex-col gap-10">
          
          {/* Title Area */}
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              {id ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}
            </h1>
            <p className="text-on-surface-variant font-medium text-base sm:text-lg">
              {id ? 'Modifica los detalles del servicio seleccionado.' : 'Registra un nuevo gasto recurrente o servicio para el hogar.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* 1. Nombre del Servicio */}
            <div className="flex flex-col gap-2 relative">
              <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Nombre del Servicio</label>
              <input 
                required
                type="text" 
                placeholder="Ej. Electricidad, Netflix, Internet" 
                className="w-full bg-surface-container-highest/30 border-0 border-b-2 border-outline-variant px-4 py-4 rounded-t-lg font-bold text-on-surface text-lg focus:ring-0 focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
                value={formData.concept}
                onChange={e => setFormData({...formData, concept: e.target.value})}
              />
            </div>

            {/* 2. Categoría (Bento Grid Style) */}
            <div className="flex flex-col gap-4">
              <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Categoría</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    type="button" 
                    onClick={() => setFormData({...formData, category: cat.id})}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] border-2 transition-all group ${formData.category === cat.id ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-transparent hover:bg-surface-container'}`}
                  >
                    <span className={`material-symbols-outlined text-3xl transition-colors ${formData.category === cat.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`} style={formData.category === cat.id ? {fontVariationSettings: "'FILL' 1"} : {}}>{cat.icon}</span>
                    <span className={`font-black text-[10px] uppercase tracking-wider transition-colors ${formData.category === cat.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 3. Monto Estimado */}
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Monto Estimado</label>
                <div className="flex items-center bg-surface-container-highest/30 border-b-2 border-outline-variant rounded-t-lg px-4 py-2 transition-colors focus-within:border-primary relative overflow-hidden group">
                  <span className="font-headline text-3xl text-primary font-bold mr-2 group-focus-within:text-primary transition-colors">
                     {currencySymbol}
                  </span>
                  <input 
                    required
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full bg-transparent border-0 px-0 py-2 font-headline font-bold text-3xl text-on-surface focus:ring-0 placeholder:text-on-surface-variant/30"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              {/* 4. Fecha de Vencimiento */}
              <div className="flex flex-col gap-2">
                <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Próximo Vencimiento</label>
                <div className="flex items-center bg-surface-container-highest/30 border-b-2 border-outline-variant rounded-t-lg px-4 py-2 transition-colors focus-within:border-primary">
                  <span className="material-symbols-outlined text-on-surface-variant mr-3">calendar_month</span>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-transparent border-0 px-0 py-3 font-bold text-lg text-on-surface focus:ring-0"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 5. Responsable del Pago */}
            <div className="flex flex-col gap-4 pt-4">
              <label className="font-black text-[10px] uppercase tracking-widest text-on-surface-variant">Responsable del Pago</label>
              <div className="flex flex-wrap items-center gap-4">
                 {members.map(member => (
                    <button 
                      key={member.id}
                      type="button" 
                      onClick={() => setFormData({...formData, paidBy: member.id})}
                      className="flex flex-col items-center gap-2 relative group"
                    >
                      <div className={`w-16 h-16 rounded-full p-1 border-2 transition-all ${formData.paidBy === member.id ? 'border-primary bg-surface-container-lowest shadow-sm scale-110' : 'border-transparent hover:border-outline-variant bg-surface-container-low group-active:scale-95'}`}>
                        <img 
                          src={member.photoURL} 
                          alt={member.displayName} 
                          className={`w-full h-full rounded-full object-cover transition-opacity ${formData.paidBy === member.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} 
                        />
                      </div>
                      <span className={`text-sm font-bold transition-colors ${formData.paidBy === member.id ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                        {member.id === user?.uid ? 'Tú' : member.displayName.split(' ')[0]}
                      </span>
                      {formData.paidBy === member.id && (
                        <div className="absolute top-0 right-0 w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </div>
                      )}
                    </button>
                 ))}
              </div>
            </div>

            {/* 6. Estado de Pago */}
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant">
                <div>
                  <h3 className="font-bold text-on-surface">Estado del Pago</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Marca si este servicio ya fue pagado</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, isPaid: !formData.isPaid})}
                  className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${formData.isPaid ? 'bg-primary' : 'bg-surface-container-highest'}`}
                >
                  <div className={`w-6 h-6 bg-surface rounded-full shadow-md transition-transform ${formData.isPaid ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex flex-col-reverse sm:flex-row items-center gap-4 mt-8 pt-8 border-t border-outline-variant/30 ${id ? 'justify-between' : 'justify-end'}`}>
              {id && (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 font-black text-[10px] uppercase tracking-widest text-error hover:bg-error/10 transition-all rounded-[1.5rem] disabled:opacity-50"
                >
                  Eliminar
                </button>
              )}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={() => navigate('/servicios')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-4 font-black text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all rounded-[1.5rem]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.amount || !formData.concept}
                  className="w-full sm:w-auto px-10 py-4 font-black text-[10px] uppercase tracking-widest text-on-primary bg-primary rounded-[1.5rem] shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : (id ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
