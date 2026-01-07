import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { differenceInDays, addDays, isBefore, format } from 'date-fns';
import { requireAuth, verifyOwnership, notFoundResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const { challengeId } = await params;
    const challengeIdNum = parseInt(challengeId, 10);
    
    if (isNaN(challengeIdNum)) {
      return notFoundResponse('Invalid ID');
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeIdNum },
      include: { deposits: true },
    });

    if (!challenge) {
      return notFoundResponse('Challenge not found');
    }

    // Verify if the challenge belongs to the authenticated user
    if (!(await verifyOwnership(challenge.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deposits = challenge.deposits;

    const startDate = challenge.startDate;
    // Normalize dates to compare only the day (without time)
    const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = addDays(startDateNormalized, 199); // 200 days total (0-199 = 200 days)

    // Calculate current day of the challenge (1-200)
    // differenceInDays returns the difference in complete days
    // If today is the same day as startDate, the difference is 0, so currentDay = 1
    const daysSinceStart = differenceInDays(todayNormalized, startDateNormalized);
    const currentDay = Math.max(1, Math.min(200, daysSinceStart + 1));

    // Calculate statistics
    const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
    const daysCompleted = deposits.length;
    const daysRemaining = 200 - daysCompleted;

    // Calculate expected total up to current day
    // Sum from 1 to currentDay: n * (n + 1) / 2
    const expectedTotal = (currentDay * (currentDay + 1)) / 2;

    // Calculate expected total at the end (sum from 1 to 200)
    const finalExpectedTotal = (200 * 201) / 2; // 20,100

    // Check which days are deposited
    const depositedDays = new Set(deposits.map((d) => d.dayNumber));

    // Calculate percentage progress
    const progressPercent = (daysCompleted / 200) * 100;
    const amountProgressPercent = (totalDeposited / finalExpectedTotal) * 100;

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        start_date: challenge.startDate.toISOString(),
        user_id: challenge.userId,
        created_at: challenge.createdAt.toISOString(),
      },
      currentDay,
      startDate: challenge.startDate.toISOString(),
      endDate: endDate.toISOString().split('T')[0],
      totalDeposited,
      daysCompleted,
      daysRemaining,
      expectedTotal,
      finalExpectedTotal,
      progressPercent: Math.round(progressPercent * 100) / 100,
      amountProgressPercent: Math.round(amountProgressPercent * 100) / 100,
      depositedDays: Array.from(depositedDays),
      isActive: isBefore(today, endDate) || format(today, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd'),
      isCompleted: daysCompleted === 200,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return serverErrorResponse('Error calculating progress');
  }
}

