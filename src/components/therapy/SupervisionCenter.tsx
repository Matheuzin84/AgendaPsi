import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Users, 
  MessageSquare, 
  Send, 
  History, 
  FileText, 
  HelpCircle, 
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SupervisionCenterProps {
  psychologistId: string;
}

export default function SupervisionCenter({ psychologistId }: SupervisionCenterProps) {
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const [caseSummary, setCaseSummary] = useState('');
  const [reflections, setReflections] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'supervisions'),
      where('psychologistId', '==', psychologistId),
      orderBy('date', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setSupervisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsub;
  }, [psychologistId]);

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseSummary.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'supervisions'), {
        psychologistId,
        supervisorId: 'admin_supervisor', // Placeholder for simulation
        date: format(new Date(), 'yyyy-MM-dd'),
        caseSummary,
        reflections,
        status: 'pending_feedback',
        createdAt: Timestamp.now()
      });
      setCaseSummary('');
      setReflections('');
      setIsAddingReflection(false);
    } catch (error) {
      console.error("Error submitting reflection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Centro de Supervisão</h2>
            <p className="text-xs text-slate-500">Desenvolvimento clínico e suporte profissional.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddingReflection(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
        >
          Nova Reflexão de Caso
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> Histórico & Feedbacks
          </h3>
          
          <div className="space-y-4">
            {supervisions.length > 0 ? supervisions.map(sup => (
              <div key={sup.id} className="glass-card p-5 space-y-4 border-l-4 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {format(new Date(sup.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                  <StatusBadge status={sup.status} />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText size={16} className="text-indigo-500" /> Caso: {sup.caseSummary}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {sup.reflections}
                  </p>
                </div>

                {sup.feedback && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <MessageSquare size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Feedback do Supervisor</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                      "{sup.feedback}"
                    </p>
                  </div>
                )}
              </div>
            )) : (
              <div className="py-20 text-center space-y-3 opacity-50 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200">
                <HelpCircle size={40} className="mx-auto text-slate-300" />
                <p className="text-sm italic">Nenhuma supervisão registrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl shadow-indigo-100 dark:shadow-none">
            <Lightbulb className="mb-4 text-white/50" size={32} />
            <h3 className="font-bold text-lg mb-2">Por que registrar?</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">
              O registro contínuo de dúvidas e reflexões permite um acompanhamento profundo do seu vínculo de supervisão, garantindo que nenhum detalhe do caso se perca entre os encontros.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 p-2 rounded-lg">
              <CheckCircle2 size={12} /> Vínculo automático e histórico seguro.
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Supervisão Próxima</h3>
            <div className="py-4 text-center">
              <HelpCircle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-[10px] text-slate-500 italic">Nenhum encontro agendado no momento.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for adding reflection */}
      <AnimatePresence>
        {isAddingReflection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center text-indigo-600">
                <div className="flex items-center gap-2">
                  <FileText size={20} />
                  <h2 className="text-xl font-bold">Reflexão entre Encontros</h2>
                </div>
                <button onClick={() => setIsAddingReflection(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>

              <form onSubmit={handleSubmitReflection} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Paciente / Iniciais do Caso</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Caso Maria (DP) ou Iniciais A.M."
                    value={caseSummary}
                    onChange={(e) => setCaseSummary(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sua Reflexão / Dúvidas</label>
                  <textarea 
                    rows={6}
                    required
                    placeholder="O que aconteceu no encontro? Quais são suas principais dúvidas para a próxima supervisão?"
                    value={reflections}
                    onChange={(e) => setReflections(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white resize-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddingReflection(false)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold rounded-xl"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Enviando..." : <><Send size={18} /> Submeter Reflexão</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pending_feedback: { label: 'Aguardando Feedback', class: 'bg-amber-100 text-amber-700' },
    responded: { label: 'Respondido', class: 'bg-emerald-100 text-emerald-700' },
  };
  const config = configs[status] || configs.pending_feedback;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", config.class)}>
      {config.label}
    </span>
  );
}
