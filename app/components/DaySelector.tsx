'use client';

import { useMemo } from 'react';
import { addDays, format, startOfWeek, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface DaySelectorProps {
  startDate: string;
  currentDay: number;
  selectedDay: number;
  depositedDays: number[];
  loadingDay: number | null;
  onSelectDay: (day: number) => void;
  onToggleDeposit: (day: number) => void;
}

export default function DaySelector({
  startDate,
  currentDay,
  selectedDay,
  depositedDays,
  loadingDay,
  onSelectDay,
  onToggleDeposit,
}: DaySelectorProps) {
  // Calcular informações do mês atual e meses restantes
  const monthInfo = useMemo(() => {
    const start = new Date(startDate);
    const selectedDate = addDays(start, selectedDay - 1);
    const endDate = addDays(start, 199); // Dia 200
    
    const currentMonth = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
    const totalMonths = differenceInMonths(endDate, start) + 1;
    const currentMonthNumber = differenceInMonths(selectedDate, start) + 1;
    const remainingMonths = totalMonths - currentMonthNumber;
    
    return {
      currentMonth,
      currentMonthNumber,
      totalMonths,
      remainingMonths,
    };
  }, [startDate, selectedDay]);

  // Gerar os 7 dias da semana atual (domingo a sábado) - SEMPRE 7 dias
  const weekDays = useMemo(() => {
    const start = new Date(startDate);
    // Normalizar a data de início para comparar apenas o dia
    const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const selectedDate = addDays(startNormalized, selectedDay - 1);
    
    // Encontrar o início da semana (domingo)
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0, locale: ptBR });
    const daysArray = [];
    
    // SEMPRE gerar 7 dias, mesmo que alguns estejam fora do range
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      const dayDateNormalized = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const dayNumber = Math.floor((dayDateNormalized.getTime() - startNormalized.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Verificar se é hoje comparando datas normalizadas
      const isTodayDate = dayDateNormalized.getTime() === todayNormalized.getTime();
      const isInRange = dayNumber >= 1 && dayNumber <= 200;
      
      daysArray.push({
        dayNumber: isInRange ? dayNumber : null,
        date: dayDate,
        dayName: format(dayDate, 'EEE', { locale: ptBR }),
        dayOfMonth: format(dayDate, 'd'),
        isToday: isTodayDate && isInRange,
        isSelected: dayNumber === selectedDay,
        isDeposited: isInRange && depositedDays.includes(dayNumber),
        isInRange,
      });
    }
    
    return daysArray;
  }, [startDate, selectedDay, depositedDays]);

  const handleDayClick = (dayNumber: number | null) => {
    if (dayNumber === null) return;
    // Primeiro seleciona o dia
    onSelectDay(dayNumber);
    // Depois marca/desmarca o depósito
    onToggleDeposit(dayNumber);
  };

  return (
    <div className="space-y-4">
      {/* Indicador de mês */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold capitalize">
            {monthInfo.currentMonth}
          </h3>
          <p className="text-sm text-muted-foreground">
            Mês {monthInfo.currentMonthNumber} de {monthInfo.totalMonths}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {monthInfo.remainingMonths} {monthInfo.remainingMonths === 1 ? 'mês' : 'meses'} restantes
        </Badge>
      </div>

      {/* Dias da semana com scroll horizontal invisível */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2 -mx-1 px-1">
        {weekDays.map((day, index) => {
          const isDeposited = day.isDeposited;
          const isSelected = day.isSelected;
          const isInRange = day.isInRange;
          const isLoading = day.dayNumber !== null && loadingDay === day.dayNumber;
          
          return (
            <Button
              key={`${day.date.getTime()}-${index}`}
              variant="ghost"
              disabled={!isInRange || isLoading}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center min-h-[100px] min-w-[80px] rounded-xl relative border-2 transition-all',
                // Se depositado, preenche com cor primária
                isDeposited && 'bg-primary text-primary-foreground border-primary',
                // Se não depositado, apenas outline (sem preenchimento)
                !isDeposited && isInRange && 'border-border bg-transparent hover:border-primary/50',
                // Se selecionado mas não depositado, destaca a borda
                isSelected && !isDeposited && 'border-primary',
                // Se fora do range, desabilitado
                !isInRange && 'opacity-30 cursor-not-allowed',
                // Loading state
                isLoading && 'opacity-70 cursor-wait'
              )}
              onClick={() => handleDayClick(day.dayNumber)}
            >
              <span className={cn(
                'text-xs mb-1',
                isDeposited ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {day.dayName}
              </span>
              <span className={cn(
                'text-2xl font-bold mb-1',
                isDeposited ? 'text-primary-foreground' : 'text-foreground'
              )}>
                {day.dayOfMonth}
              </span>
              {isInRange && (
                <span className={cn(
                  'text-xs',
                  isDeposited ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}>
                  R$ {day.dayNumber!.toFixed(2)}
                </span>
              )}
              {/* Loading indicator */}
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              ) : null}
              {/* Check ou bolinha no mesmo lugar */}
              {isDeposited && !isLoading ? (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              ) : day.isToday && !isLoading ? (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
