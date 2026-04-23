import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { invitationService } from '../services/invitationService';

export default function InvitationManager() {
  const { userProfile } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (userProfile?.email) {
      const fetchInvites = async () => {
        try {
          const invites = await invitationService.getInvitationsForEmail(userProfile.email);
          setPendingInvites(invites);
          if (invites.length > 0) {
            setShowModal(true);
          }
        } catch (error) {
          console.error("Error fetching invitations:", error);
        }
      };
      fetchInvites();
    }
  }, [userProfile]);

  const handleAccept = async (invite) => {
    setIsProcessing(true);
    try {
      await invitationService.acceptInvitation(invite.id, userProfile.uid, invite.householdId);
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
      if (pendingInvites.length <= 1) setShowModal(false);
      window.location.reload(); // Reload to refresh HouseholdContext
    } catch (error) {
      alert("Error al aceptar la invitación");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await invitationService.rejectInvitation(inviteId);
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
      if (pendingInvites.length <= 1) setShowModal(false);
    } catch (error) {
      console.error("Error rejecting invitation:", error);
    }
  };

  if (!showModal || pendingInvites.length === 0) return null;

  const currentInvite = pendingInvites[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-outline-variant relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-primary text-on-primary shadow-xl">
            <span className="material-symbols-outlined text-4xl">home_pin</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter text-on-surface">¡Te han invitado!</h2>
            <p className="text-on-surface-variant font-medium">
              <span className="text-primary font-bold">{currentInvite.inviterName}</span> te invita a formar parte del hogar <span className="text-on-surface font-black">"{currentInvite.householdName}"</span>.
            </p>
          </div>

          <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/50">
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              Al aceptar, compartirás gastos, servicios y analíticas en tiempo real con este nido.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button 
              onClick={() => handleAccept(currentInvite)}
              disabled={isProcessing}
              className="w-full bg-on-surface text-surface py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Procesando...' : 'Aceptar Invitación'}
            </button>
            <button 
              onClick={() => handleReject(currentInvite.id)}
              disabled={isProcessing}
              className="w-full bg-surface-container-highest text-on-surface-variant py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container-high transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
