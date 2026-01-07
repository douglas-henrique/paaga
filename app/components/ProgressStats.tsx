'use client';

import CircularProgress from './CircularProgress';
import { Calendar, Target, TrendingUp } from 'lucide-react';

interface ProgressStatsProps {
  totalDeposited: number;
  daysCompleted: number;
  daysRemaining: number;
  progressPercent: number;
  amountProgressPercent: number;
  finalExpectedTotal: number;
}

export default function ProgressStats({
  totalDeposited,
  daysCompleted,
  daysRemaining,
  progressPercent,
  amountProgressPercent,
  finalExpectedTotal,
}: ProgressStatsProps) {
  return (
    <div className="space-y-8">
      {/* Círculo central com total guardado */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <CircularProgress
          value={totalDeposited}
          max={finalExpectedTotal}
          size={220}
          strokeWidth={16}
        />
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">Total Guardado</p>
          <p className="text-5xl font-bold text-primary">
            R$ {totalDeposited.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            de R$ {finalExpectedTotal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Resumo embaixo - sem cards, apenas elementos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <p className="text-2xl font-bold">{daysCompleted}</p>
          <p className="text-xs text-muted-foreground">Dias</p>
          <span className="text-xs text-muted-foreground">
            {progressPercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <p className="text-2xl font-bold">{daysRemaining}</p>
          <p className="text-xs text-muted-foreground">Restantes</p>
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <p className="text-2xl font-bold text-primary">
            {amountProgressPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">Progresso</p>
        </div>
      </div>
    </div>
  );
}
