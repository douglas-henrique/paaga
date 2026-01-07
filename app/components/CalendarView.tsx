'use client';

import { useMemo } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import DepositDay from './DepositDay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CalendarViewProps {
  startDate: string;
  depositedDays: number[];
  currentDay: number;
  onToggleDeposit: (dayNumber: number) => void;
}

export default function CalendarView({
  startDate,
  depositedDays,
  currentDay,
  onToggleDeposit,
}: CalendarViewProps) {
  const days = useMemo(() => {
    const start = new Date(startDate);
    const daysArray = [];
    
    for (let i = 1; i <= 200; i++) {
      const dayDate = addDays(start, i - 1);
      daysArray.push({
        dayNumber: i,
        date: dayDate,
        amount: i, // Dia 1 = R$1, Dia 2 = R$2, etc.
        isDeposited: depositedDays.includes(i),
        isToday: i === currentDay,
      });
    }
    
    return daysArray;
  }, [startDate, depositedDays, currentDay]);

  // Agrupar dias por mês para melhor visualização
  const daysByMonth = useMemo(() => {
    const grouped: { [key: string]: typeof days } = {};
    
    days.forEach((day) => {
      const monthKey = format(day.date, 'MMMM yyyy', { locale: ptBR });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(day);
    });
    
    return grouped;
  }, [days]);

  return (
    <div className="space-y-6">
      {Object.entries(daysByMonth).map(([month, monthDays]) => (
        <Card key={month}>
          <CardHeader>
            <CardTitle className="text-lg">
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {monthDays.map((day) => (
                <DepositDay
                  key={day.dayNumber}
                  dayNumber={day.dayNumber}
                  amount={day.amount}
                  isDeposited={day.isDeposited}
                  isToday={day.isToday}
                  onClick={() => onToggleDeposit(day.dayNumber)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
