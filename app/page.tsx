'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DepositCalendar from './components/DepositCalendar';
import StartDatePicker from './components/StartDatePicker';
import ProgressStats from './components/ProgressStats';
import DaySelector from './components/DaySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Challenge {
  id: number;
  start_date: string;
  user_id: string;
  created_at: string;
}

interface Progress {
  challenge: Challenge;
  currentDay: number;
  startDate: string;
  endDate: string;
  totalDeposited: number;
  daysCompleted: number;
  daysRemaining: number;
  expectedTotal: number;
  finalExpectedTotal: number;
  progressPercent: number;
  amountProgressPercent: number;
  depositedDays: number[];
  isActive: boolean;
  isCompleted: boolean;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const hasLoadedRef = useRef<string | null>(null);

  const userId = session?.user?.id || '';

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
      return;
    }
  }, [loading, session, router]);

  const loadProgress = useCallback(async (challengeId: number) => {
    try {
      // Add cache busting to ensure we get the latest data
      const response = await fetch(`/api/progress/${challengeId}?t=${Date.now()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error loading progress: ${errorText}`);
      }
      
      const progressData = await response.json();
      setProgress(progressData);
      // Set selected day as current day
      setSelectedDay(progressData.currentDay);
    } catch {
      // Silent error - error state is already managed by the component
      setError('Error loading progress');
    }
  }, []);

  const loadChallenge = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingState(true);
      const response = await fetch(`/api/challenges?user_id=${userId}`);
      if (!response.ok) throw new Error('Error loading challenge');
      
      const challenges = await response.json();
      if (challenges.length > 0) {
        setChallenge(challenges[0]);
        await loadProgress(challenges[0].id);
      } else {
        setChallenge(null);
        setProgress(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingState(false);
    }
  }, [userId, loadProgress]);

  // Load challenge only once when userId is available
  useEffect(() => {
    // Reset ref when there's no session (logout)
    if (!session || !userId) {
      hasLoadedRef.current = null;
      setChallenge(null);
      setProgress(null);
      return;
    }
    
    // Load only if userId exists and hasn't loaded for this userId yet
    if (!loading && session && userId && hasLoadedRef.current !== userId) {
      hasLoadedRef.current = userId;
      loadChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, userId]);

  const handleStartChallenge = async (startDate: string) => {
    if (!userId) return;
    
    try {
      setLoadingState(true);
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating challenge');
      }

      const newChallenge = await response.json();
      setChallenge(newChallenge);
      await loadProgress(newChallenge.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar desafio');
    } finally {
      setLoadingState(false);
    }
  };

  const handleToggleDeposit = async (dayNumber: number) => {
    if (!challenge || !userId) return;

    // Set loading state
    setLoadingDay(dayNumber);

    const isDeposited = progress?.depositedDays.includes(dayNumber) || false;

    // Optimistic update
    if (progress) {
      const newDepositedDays = isDeposited
        ? progress.depositedDays.filter(d => d !== dayNumber)
        : [...progress.depositedDays, dayNumber];

      const dayAmount = dayNumber;
      const newTotalDeposited = isDeposited
        ? progress.totalDeposited - dayAmount
        : progress.totalDeposited + dayAmount;

      setProgress({
        ...progress,
        depositedDays: newDepositedDays,
        totalDeposited: newTotalDeposited,
        daysCompleted: newDepositedDays.length,
        daysRemaining: 200 - newDepositedDays.length,
        amountProgressPercent: (newTotalDeposited / progress.finalExpectedTotal) * 100,
        progressPercent: (newDepositedDays.length / 200) * 100,
      });
    }

    try {
      if (isDeposited) {
        // Remove deposit
        const deposit = progress?.depositedDays
          .map((d) => ({ dayNumber: d }))
          .find(d => d.dayNumber === dayNumber);

        if (deposit) {
          // Find the deposit ID
          const depositsResponse = await fetch(`/api/deposits?challenge_id=${challenge.id}`);
          const deposits = await depositsResponse.json();
          const depositToDelete = deposits.find((d: { day_number: number; id: number }) => d.day_number === dayNumber);

          if (depositToDelete) {
            await fetch(`/api/deposits/${depositToDelete.id}`, {
              method: 'DELETE',
            });
          }
        }
      } else {
        // Add deposit
        await fetch('/api/deposits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challenge_id: challenge.id,
            day_number: dayNumber,
            deposited_at: new Date().toISOString(),
          }),
        });
      }

      // Reload progress after a small delay to ensure the database was updated
      setTimeout(() => {
        if (challenge) {
          loadProgress(challenge.id);
        }
        // Clear loading state
        setLoadingDay(null);
      }, 300);
    } catch {
      // Revert optimistic update on error
      if (challenge) {
        loadProgress(challenge.id);
      }
      setError('Error updating deposit. Please try again.');
      // Clear loading state on error
      setLoadingDay(null);
    }
  };

  if (loading || loadingState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              setError(null);
              loadChallenge();
            }}
            className="w-full"
            variant="outline"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">Paaga</CardTitle>
            <CardDescription className="text-lg">
              Desafio de 200 dias para guardar dinheiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartDatePicker onSelect={handleStartChallenge} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header simples */}
        <div className="text-center space-y-1 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h1 className="text-3xl font-bold flex-1">Paaga</h1>
            <div className="flex-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    type="button"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Desafio de 200 dias</p>
        </div>

        {progress && (
          <>
            {/* Seletor de dias - sem card */}
            <div className="space-y-4">
              <DaySelector
                startDate={progress.startDate}
                currentDay={progress.currentDay}
                selectedDay={selectedDay}
                depositedDays={progress.depositedDays}
                loadingDay={loadingDay}
                onSelectDay={setSelectedDay}
                onToggleDeposit={handleToggleDeposit}
              />
            </div>

            {/* Círculo central e resumo - sem cards */}
            <ProgressStats
              totalDeposited={progress.totalDeposited}
              daysCompleted={progress.daysCompleted}
              daysRemaining={progress.daysRemaining}
              progressPercent={progress.progressPercent}
              amountProgressPercent={progress.amountProgressPercent}
              finalExpectedTotal={progress.finalExpectedTotal}
            />

            {/* Botão para ver calendário completo */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              {showCalendar ? 'Ocultar' : 'Ver'} Calendário Completo
            </Button>

            {/* Calendário completo (opcional) */}
            {showCalendar && (
              <div className="space-y-4">
                <DepositCalendar
                  startDate={progress.startDate}
                  depositedDays={progress.depositedDays}
                  currentDay={progress.currentDay}
                  loadingDay={loadingDay}
                  onToggleDeposit={handleToggleDeposit}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

