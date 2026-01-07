import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyOwnership, validationErrorResponse, serverErrorResponse } from '@/lib/auth-helpers';
import { createChallengeSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    // If userId is not provided, use the authenticated user
    const targetUserId = userId || authenticatedUserId;

    // Verify if the user is trying to access their own data
    if (!(await verifyOwnership(targetUserId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const challenges = await prisma.challenge.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to frontend expected format (snake_case)
    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      start_date: challenge.startDate.toISOString(),
      user_id: challenge.userId,
      created_at: challenge.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedChallenges);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return serverErrorResponse('Error fetching challenges');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();

    const body = await request.json();
    
    // Validate data with Zod
    const validationResult = createChallengeSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(
        validationResult.error.issues.map((issue) => issue.message).join(', ')
      );
    }

    const { start_date, user_id } = validationResult.data;

    // Verify if the user is trying to create a challenge for themselves
    if (!(await verifyOwnership(user_id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate date format
    const date = new Date(start_date);
    if (isNaN(date.getTime())) {
      return validationErrorResponse('Invalid date');
    }

    // Check if the user already has an active challenge
    const existingChallenge = await prisma.challenge.findFirst({
      where: { userId: authenticatedUserId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingChallenge) {
      // Check if the existing challenge is still active (within 200 days)
      const endDate = new Date(existingChallenge.startDate);
      endDate.setDate(endDate.getDate() + 199);
      
      if (new Date() <= endDate) {
        return validationErrorResponse('You already have an active challenge');
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        startDate: date,
        userId: authenticatedUserId,
      },
    });

    // Transform to frontend expected format (snake_case)
    const formattedChallenge = {
      id: challenge.id,
      start_date: challenge.startDate.toISOString(),
      user_id: challenge.userId,
      created_at: challenge.createdAt.toISOString(),
    };

    return NextResponse.json(formattedChallenge, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if it's a Prisma constraint error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return validationErrorResponse('Challenge already exists');
    }
    
    return serverErrorResponse('Error creating challenge');
  }
}

