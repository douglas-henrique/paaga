import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyOwnership, notFoundResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const { id } = await params;
    const challengeId = parseInt(id, 10);
    
    if (isNaN(challengeId)) {
      return notFoundResponse('Invalid ID');
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
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

    // Transform to frontend expected format (snake_case)
    const formattedChallenge = {
      id: challenge.id,
      start_date: challenge.startDate.toISOString(),
      user_id: challenge.userId,
      created_at: challenge.createdAt.toISOString(),
    };

    return NextResponse.json(formattedChallenge);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    return serverErrorResponse('Error fetching challenge');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const { id } = await params;
    const challengeId = parseInt(id, 10);
    
    if (isNaN(challengeId)) {
      return notFoundResponse('Invalid ID');
    }

    // Verify if the challenge exists and belongs to the user
    const existingChallenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!existingChallenge) {
      return notFoundResponse('Challenge not found');
    }

    if (!(await verifyOwnership(existingChallenge.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { start_date } = body;

    if (!start_date) {
      return NextResponse.json(
        { error: 'start_date is required' },
        { status: 400 }
      );
    }

    // Validate date format
    const date = new Date(start_date);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: { startDate: date },
    });

    // Transform to frontend expected format (snake_case)
    const formattedChallenge = {
      id: challenge.id,
      start_date: challenge.startDate.toISOString(),
      user_id: challenge.userId,
      created_at: challenge.createdAt.toISOString(),
    };

    return NextResponse.json(formattedChallenge);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if it's a record not found error
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return notFoundResponse('Challenge not found');
    }
    
    return serverErrorResponse('Error updating challenge');
  }
}

