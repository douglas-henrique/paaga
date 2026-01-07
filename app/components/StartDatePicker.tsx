'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StartDatePickerProps {
  onSelect: (date: string) => void;
  currentDate?: string;
}

export default function StartDatePicker({ onSelect, currentDate }: StartDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(
    currentDate || new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect(selectedDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="start-date">Data de Início do Desafio</Label>
        <Input
          type="date"
          id="start-date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full" size="lg">
        Iniciar Desafio
      </Button>
    </form>
  );
}
