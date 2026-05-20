import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, Plus, Target, Brain, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PatientProgressProps {
  patientId: string;
  psychologistId: string;
}

export default function PatientProgress({ patientId, psychologistId }: PatientProgressProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [category, setCategory] = useState('Humor');
  const [value, setValue] = useState(50);

  useEffect(() => {
    const q = query(
      collection(db, 'progressMetrics'),
      where('patientId', '==', patientId),
      orderBy('date', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMetrics(data);
    });

    return unsub;
  }, [patientId]);

  const categories = ['Humor', 'Ansiedade', 'Autonomia', 'Relacionamentos', 'Metas'];

  const handleAddMetric = async () => {
    try {
      await addDoc(collection(db, 'progressMetrics'), {
        patientId,
        psychologistId,
        category,
        value: Number(value),
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding progress metric:", error);
    }
  };

  // Group metrics by category for multiple lines or filter single category
  const chartData = metrics.reduce((acc: any[], current) => {
    const existingDate = acc.find(item => item.date === current.date);
    if (existingDate) {
      existingDate[current.category] = current.value;
    } else {
      acc.push({
        date: current.date,
        formattedDate: format(parseISO(current.date), 'dd/MM'),
        [current.category]: current.value
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-primary" size={20} />
          <h3 className="font-bold text-slate-800 dark:text-white">Progresso do Paciente</h3>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={14} /> Registrar Evolução
        </button>
      </div>

      <div className="glass-card p-6 h-[300px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '10px'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              {categories.map((cat, idx) => (
                <Line 
                  key={cat}
                  type="monotone" 
                  dataKey={cat} 
                  stroke={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][idx]} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <TrendingUp size={40} className="opacity-20" />
            <p className="text-sm italic">Nenhum dado de progresso registrado ainda.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4 border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Novo Registro Métrico</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 ml-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 ml-1">Valor (0-100): {value}</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-md"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddMetric}
                  className="px-3 py-1 text-xs font-bold bg-primary text-white rounded-md shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
