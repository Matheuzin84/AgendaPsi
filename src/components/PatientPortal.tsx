import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  Timestamp, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  Plus, 
  User as UserIcon,
  LogOut,
  ChevronRight,
  Package,
  History,
  CheckCircle2,
  CalendarCheck,
  Bell,
  MessageSquare,
  TrendingUp,
  Info,
  Send,
  Loader2
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import PatientProgress from './therapy/PatientProgress';

interface PatientPortalProps {
  user: any;
  profile: any;
  onLogout: () => void;
}

export default function PatientPortal({ user, profile, onLogout }: PatientPortalProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const [psychologist, setPsychologist] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'progress' | 'messages' | 'profile'>('appointments');
  const [loading, setLoading] = useState(true);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.patientId || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: profile.patientId,
        psychologistId: profile.psychologistId || 'admin',
        text: newMessage,
        senderId: user.uid,
        createdAt: Timestamp.now()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!profile.patientId) {
      setLoading(false);
      return;
    }

    const qSessions = query(
      collection(db, 'sessions'), 
      where('patientId', '==', profile.patientId),
      orderBy('date', 'desc')
    );

    const qMessages = query(
      collection(db, 'messages'),
      where('patientId', '==', profile.patientId),
      orderBy('createdAt', 'desc')
    );

    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch psychologist info
    if (profile.psychologistId) {
      getDoc(doc(db, 'userProfiles', profile.psychologistId)).then(snap => {
        if (snap.exists()) {
          setPsychologist(snap.data());
        }
      });
    }

    return () => {
      unsubSessions();
      unsubMessages();
    };
  }, [profile.patientId]);

  if (!profile.patientId) {
    return <PatientRegistration user={user} profile={profile} />;
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcomingSessions = sessions.filter(s => 
    isAfter(parseISO(s.date), new Date()) || 
    (s.date === today && s.status !== 'cancelled' && s.status !== 'completed')
  );
  
  // Alert for sessions today or tomorrow
  const tomorrow = format(addHours(new Date(), 24), 'yyyy-MM-dd');
  const urgentAlerts = upcomingSessions.filter(s => s.date === today || s.date === tomorrow);

  const pastSessions = sessions.filter(s => 
    isBefore(parseISO(s.date), new Date()) || 
    s.status === 'completed' || s.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold italic">
              P
            </div>
            <span className="font-bold text-slate-800 dark:text-white hidden sm:inline text-sm uppercase tracking-tighter">Fluxo do Paciente</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell size={20} />
              {urgentAlerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Urgent Alerts Section */}
        {urgentAlerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-primary">Consulta se Aproximando</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Você tem uma sessão agendada para {urgentAlerts[0].date === today ? 'hoje' : 'amanhã'} às {urgentAlerts[0].time}.
              </p>
            </div>
            {urgentAlerts[0].meetingLink && (
              <a 
                href={urgentAlerts[0].meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-wider"
              >
                Acessar
              </a>
            )}
          </motion.div>
        )}

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Olá, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Seu acompanhamento com {psychologist?.name || 'seu psicólogo'}.
          </p>
        </header>

        {/* Content Tabs */}
        <div className="space-y-6">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <TabButton 
              active={activeTab === 'appointments'} 
              onClick={() => setActiveTab('appointments')}
              icon={<CalendarIcon size={16} />}
              label="Consultas"
            />
            <TabButton 
              active={activeTab === 'progress'} 
              onClick={() => setActiveTab('progress')}
              icon={<TrendingUp size={16} />}
              label="Progresso"
            />
            <TabButton 
              active={activeTab === 'messages'} 
              onClick={() => setActiveTab('messages')}
              icon={<MessageSquare size={16} />}
              label="Mensagens"
            />
            <TabButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')}
              icon={<UserIcon size={16} />}
              label="Perfil"
            />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'appointments' && (
              <motion.div 
                key="appointments"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-primary/30 hover:border-primary text-primary hover:bg-primary/5 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={20} />
                  Solicitar Nova Consulta
                </button>

                <section className="space-y-3">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock size={12} /> Próximas Sessões
                  </h2>
                  <div className="grid gap-3">
                    {upcomingSessions.length > 0 ? upcomingSessions.map(session => (
                      <AppointmentCard key={session.id} session={session} isUpcoming />
                    )) : (
                      <EmptyState message="Você não tem sessões agendadas." />
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={12} /> Histórico Recente
                  </h2>
                  <div className="grid gap-3">
                    {pastSessions.slice(0, 3).map(session => (
                      <AppointmentCard key={session.id} session={session} />
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div 
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Seu Histórico de Evolução</h3>
                      <p className="text-xs text-slate-500">Acompanhe seus indicadores ao longo do tempo.</p>
                    </div>
                  </div>
                  <PatientProgress patientId={profile.patientId} psychologistId={profile.psychologistId || 'admin'} />
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div 
                key="messages"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex flex-col h-[60vh]"
              >
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <MessageSquare size={20} className="text-primary" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mensagens</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 p-2">
                  {messages.length > 0 ? messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                        msg.senderId === user.uid 
                          ? "ml-auto bg-primary text-white rounded-tr-none" 
                          : "mr-auto bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 rounded-tl-none"
                      )}
                    >
                      <div className={cn(
                        "text-[9px] font-black uppercase tracking-widest mb-1 opacity-50",
                        msg.senderId === user.uid ? "text-white" : "text-slate-400"
                      )}>
                        {msg.senderId === user.uid ? 'Você' : 'Psicólogo(a)'}
                      </div>
                      <p>{msg.text}</p>
                      <p className={cn("text-[9px] mt-2 opacity-70 text-right", msg.senderId === user.uid ? "text-white" : "text-slate-500")}>
                        {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                      </p>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                      <MessageSquare size={48} className="mb-2" />
                      <p>Sem mensagens por enquanto.</p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 p-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Envie uma mensagem..."
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={sendingMessage || !newMessage.trim()} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
                    {sendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="glass-card p-6 space-y-6"
              >
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <UserIcon size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                    <p className="text-xs text-slate-500">{profile.email}</p>
                    <span className="mt-1 inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">Paciente</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InfoCard icon={<CalendarIcon size={16} />} label="Início do Acompanhamento" value={profile.createdAt?.toDate ? format(profile.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'} />
                  <InfoCard icon={<Video size={16} />} label="Preferência" value="Online" />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                    <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      Seus dados são protegidos por criptografia e apenas seu psicólogo responsável tem acesso ao seu histórico clínico e evoluções.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal 
          isOpen={isBookingModalOpen} 
          onClose={() => setIsBookingModalOpen(false)} 
          profile={profile}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all",
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

interface AppointmentCardProps {
  key?: any;
  session: any;
  isUpcoming?: boolean;
}

function AppointmentCard({ session, isUpcoming }: AppointmentCardProps) {
  return (
    <div className={cn(
      "glass-card p-4 flex items-center justify-between gap-4 border-l-4 transition-all hover:translate-x-1",
      isUpcoming ? "border-l-primary" : "border-l-slate-300 dark:border-l-slate-700"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center",
          isUpcoming ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
        )}>
          <span className="text-[10px] font-bold uppercase">{format(parseISO(session.date), 'MMM', { locale: ptBR })}</span>
          <span className="text-lg font-bold leading-none">{format(parseISO(session.date), 'dd')}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white">{session.time}</h3>
            {session.type === 'online' ? (
              <Video size={14} className="text-emerald-500" />
            ) : (
              <MapPin size={14} className="text-amber-500" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {format(parseISO(session.date), 'EEEE', { locale: ptBR })} • {session.type === 'online' ? 'Online' : 'Presencial'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={session.status} />
        {isUpcoming && session.meetingLink && session.status === 'confirmed' && (
          <a 
            href={session.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary font-bold hover:underline"
          >
            Acessar Link
          </a>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pending: { label: 'Pendente', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    confirmed: { label: 'Confirmado', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    completed: { label: 'Realizado', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", config.class)}>
      {config.label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-white/30 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
        <History size={24} />
      </div>
      <p className="text-sm text-slate-500 italic px-6">{message}</p>
    </div>
  );
}

function BookingModal({ isOpen, onClose, profile }: any) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'online' | 'physical'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'sessions'), {
        patientId: profile.patientId,
        patientName: profile.name,
        date,
        time,
        type,
        status: 'pending',
        psychologistId: profile.psychologistId || 'admin', // Need to handle this better
        createdAt: Timestamp.now()
      });
      onClose();
    } catch (error) {
      console.error("Error booking session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Agendamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data</label>
            <input 
              type="date" 
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Horário</label>
            <input 
              type="time" 
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modalidade</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setType('online')}
                className={cn(
                  "p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all",
                  type === 'online' ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                )}
              >
                <Video size={18} /> Online
              </button>
              <button 
                type="button"
                onClick={() => setType('physical')}
                className={cn(
                  "p-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all",
                  type === 'physical' ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                )}
              >
                <MapPin size={18} /> Presencial
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center">
            * O agendamento ficará pendente de aprovação pelo psicólogo.
          </p>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Solicitando..." : "Confirmar Solicitação"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PatientRegistration({ user, profile }: any) {
  const [name, setName] = useState(user.displayName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Find psychologist (for simplicity, we assume the first one or a default)
      const psychs = await getDocs(query(collection(db, 'userProfiles'), where('role', '==', 'psychologist')));
      const psychId = psychs.empty ? 'admin' : psychs.docs[0].id;

      // Create Patient doc
      const patientRef = await addDoc(collection(db, 'patients'), {
        name,
        phone,
        email,
        userId: user.uid,
        psychologistId: psychId,
        createdAt: Timestamp.now(),
        notes: "Cadastro realizado pelo próprio paciente."
      });

      // Update Profile
      await updateDoc(doc(db, 'userProfiles', user.uid), {
        name,
        email,
        patientId: patientRef.id,
        psychologistId: psychId
      });

    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
            <Plus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Finalizar Cadastro</h2>
          <p className="text-sm text-slate-500">Complete seus dados para acessar o portal.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp / Telefone</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
            <input 
              type="email" 
              readOnly
              value={email}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-500 cursor-not-allowed outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={18} />}
            Confirmar Cadastro
          </button>
        </form>
      </motion.div>
    </div>
  );
}

