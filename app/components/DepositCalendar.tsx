'use client';

import { useMemo } from 'react';
import { addDays, isSameDay, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import Calendar from 'react-calendar';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepositCalendarProps {
  startDate: string;
  depositedDays: number[];
  currentDay: number;
  loadingDay: number | null;
  onToggleDeposit: (dayNumber: number) => void;
}

export default function DepositCalendar({
  startDate,
  depositedDays,
  loadingDay,
  onToggleDeposit,
}: DepositCalendarProps) {
  const start = useMemo(() => startOfDay(new Date(startDate)), [startDate]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const end = useMemo(() => addDays(start, 199), [start]);

  // Criar um Set com as datas depositadas para busca rápida
  const depositedDates = useMemo(() => {
    const dates = new Set<string>();
    depositedDays.forEach(dayNumber => {
      const date = addDays(start, dayNumber - 1);
      dates.add(format(startOfDay(date), 'yyyy-MM-dd'));
    });
    return dates;
  }, [depositedDays, start]);

  // Função para verificar se uma data está dentro do desafio
  const isDateInChallenge = (date: Date) => {
    const normalizedDate = startOfDay(date);
    return normalizedDate >= start && normalizedDate <= end;
  };

  // Função para obter o número do dia a partir de uma data
  const getDayNumber = (date: Date) => {
    const normalizedDate = startOfDay(date);
    const diff = Math.floor((normalizedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff >= 1 && diff <= 200 ? diff : null;
  };

  // Função para verificar se uma data está depositada
  const isDeposited = (date: Date) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    return depositedDates.has(dateStr);
  };

  // Função para verificar se é hoje
  const isToday = (date: Date) => {
    return isSameDay(startOfDay(date), today);
  };

  // Tile content customizado
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const dayNumber = getDayNumber(date);
    if (dayNumber === null) return null;
    
    const deposited = isDeposited(date);
    const today = isToday(date);
    const isLoading = loadingDay === dayNumber;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin z-10" />
        ) : (
          <>
            {deposited && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center z-10">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
            {!deposited && today && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full z-10" />
            )}
          </>
        )}
      </div>
    );
  };

  // Tile className customizado
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const dayNumber = getDayNumber(date);
    if (dayNumber === null) return 'opacity-30 cursor-not-allowed';
    
    const deposited = isDeposited(date);
    const today = isToday(date);
    const inChallenge = isDateInChallenge(date);
    const isLoading = loadingDay === dayNumber;
    
    return cn(
      'relative rounded-lg transition-all',
      deposited && 'bg-black text-primary-foreground',
      !deposited && inChallenge && 'bg-background border-2 border-border hover:border-primary/50',
      today && !deposited && 'ring-2 ring-primary',
      !inChallenge && 'opacity-30 cursor-not-allowed',
      isLoading && 'opacity-70 cursor-wait'
    );
  };

  const handleDateChange = (value: any) => {
    if (!value || loadingDay !== null) return;
    
    // Handle both single date and date range
    const date = Array.isArray(value) ? value[0] : value;
    if (!date || !(date instanceof Date)) return;
    
    const dayNumber = getDayNumber(date);
    if (dayNumber !== null && isDateInChallenge(date)) {
      onToggleDeposit(dayNumber);
    }
  };

  return (
    <Calendar

    onChange={handleDateChange}
    value={null}
    locale="pt-BR"
    minDate={start}
    maxDate={end}
    tileContent={tileContent}
    tileClassName={tileClassName}
    navigationLabel={({ date, label, locale, view }) => {
      return (
        <span className="text-base font-semibold">
          {format(date, 'MMMM yyyy', { locale: ptBR })}
        </span>
      );
    }}
    prevLabel={<ChevronLeft className="h-4 w-4" />}
    nextLabel={<ChevronRight className="h-4 w-4" />}
  />
  );
}
