import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  setDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Award, Zap, BookOpen, ShieldCheck, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CompetencyMapProps {
  psychologistId: string;
}

const defaultCompetencies = [
  { skill: 'Escuta Clínica', level: 3 },
  { skill: 'Ética Profissional', level: 4 },
  { skill: 'Manejo Técnico', level: 2 },
  { skill: 'Teoria Base', level: 3 },
  { skill: 'Empatia', level: 4 },
  { skill: 'Autocuidado', level: 3 }
];

export default function CompetencyMap({ psychologistId }: CompetencyMapProps) {
  const [competencies, setCompetencies] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'competencies'),
      where('psychologistId', '==', psychologistId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCompetencies(defaultCompetencies);
      } else {
        setCompetencies(snapshot.docs.map(doc => ({
          ...doc.data()
        })));
      }
    });

    return unsub;
  }, [psychologistId]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Award className="text-amber-500" size={20} />
        <h3 className="font-bold text-slate-800 dark:text-white">Mapa de Competências</h3>
      </div>
      
      <p className="text-xs text-slate-500">
        Sua evolução baseada em feedbacks de supervisão e autoavaliação continuada.
      </p>

      <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencies}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 5]} 
              tick={false} 
              axisLine={false} 
            />
            <Radar
              name="Proficiência"
              dataKey="level"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {competencies.map((comp) => (
          <div key={comp.skill} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{comp.skill}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <div 
                  key={star} 
                  className={cn(
                    "w-2 h-2 rounded-full",
                    star <= comp.level ? "bg-amber-400" : "bg-slate-200 dark:bg-slate-700"
                  )} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
