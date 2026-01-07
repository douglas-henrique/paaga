import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyOwnership, validationErrorResponse, serverErrorResponse, notFoundResponse } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const challengeId = searchParams.get('challenge_id');

    if (!challengeId) {
      return validationErrorResponse('challenge_id is required');
    }

    const challengeIdNum = parseInt(challengeId, 10);
    if (isNaN(challengeIdNum)) {
      return validationErrorResponse('Invalid challenge_id');
    }

    // Verify if the challenge exists and belongs to the user
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeIdNum },
    });

    if (!challenge) {
      return notFoundResponse('Challenge not found');
    }

    if (!(await verifyOwnership(challenge.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deposits = await prisma.deposit.findMany({
      where: { challengeId: challengeIdNum },
      orderBy: { dayNumber: 'asc' },
    });

    // Transform to frontend expected format (snake_case)
    const formattedDeposits = deposits.map(deposit => ({
      id: deposit.id,
      challenge_id: deposit.challengeId,
      day_number: deposit.dayNumber,
      amount: deposit.amount,
      deposited_at: deposit.depositedAt.toISOString(),
      created_at: deposit.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedDeposits);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return serverErrorResponse('Error fetching deposits');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const body = await request.json();
    const { challenge_id, day_number, deposited_at } = body;

    if (!challenge_id || day_number === undefined) {
      return validationErrorResponse('challenge_id and day_number are required');
    }

    // Validate day_number
    const dayNumber = typeof day_number === 'string' ? parseInt(day_number, 10) : day_number;
    if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 200) {
      return validationErrorResponse('day_number must be between 1 and 200');
    }

    const challengeId = typeof challenge_id === 'string' ? parseInt(challenge_id, 10) : challenge_id;
    if (isNaN(challengeId)) {
      return validationErrorResponse('Invalid challenge_id');
    }

    // Verify if the challenge exists and belongs to the user
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return notFoundResponse('Challenge not found');
    }

    if (!(await verifyOwnership(challenge.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Calculate deposit amount (day 1 = R$1, day 2 = R$2, etc.)
    const amount = dayNumber;

    // Use current date if not provided
    const depositDate = deposited_at ? new Date(deposited_at) : new Date();
    if (isNaN(depositDate.getTime())) {
      return validationErrorResponse('Invalid deposit date');
    }

    // Check if deposit already exists for this day and update or create
    const deposit = await prisma.deposit.upsert({
      where: {
        challengeId_dayNumber: {
          challengeId,
          dayNumber,
        },
      },
      update: {
        amount,
        depositedAt: depositDate,
      },
      create: {
        challengeId,
        dayNumber,
        amount,
        depositedAt: depositDate,
      },
    });

    // Transform to frontend expected format (snake_case)
    const formattedDeposit = {
      id: deposit.id,
      challenge_id: deposit.challengeId,
      day_number: deposit.dayNumber,
      amount: deposit.amount,
      deposited_at: deposit.depositedAt.toISOString(),
      created_at: deposit.createdAt.toISOString(),
    };

    return NextResponse.json(formattedDeposit, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if it's a Prisma constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return validationErrorResponse('Deposit already exists for this day');
    }
    
    return serverErrorResponse('Error creating deposit');
  }
}

