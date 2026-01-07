'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface DepositDayProps {
  dayNumber: number;
  amount: number;
  isDeposited: boolean;
  isToday: boolean;
  onClick: () => void;
}

export default function DepositDay({
  dayNumber,
  amount,
  isDeposited,
  isToday,
  onClick,
}: DepositDayProps) {
  return (
    <Button
      onClick={onClick}
      variant={isDeposited ? 'default' : 'outline'}
      className={`
        relative h-auto min-h-[100px] flex flex-col items-center justify-center gap-2 p-4
        ${isDeposited 
          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
          : 'hover:bg-accent'
        }
        ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold">Dia {dayNumber}</span>
        {isToday && !isDeposited && (
          <Badge variant="secondary" className="ml-1 text-xs">
            Hoje
          </Badge>
        )}
      </div>
      <span className="text-base font-bold">R$ {amount.toFixed(2)}</span>
      {isDeposited && (
        <CheckCircle2 className="h-4 w-4" />
      )}
    </Button>
  );
}
