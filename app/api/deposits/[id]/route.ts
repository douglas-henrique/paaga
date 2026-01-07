import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, verifyOwnership, notFoundResponse, serverErrorResponse } from '@/lib/auth-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authenticatedUserId = await requireAuth();
    
    const { id } = await params;
    const depositId = parseInt(id, 10);
    
    if (isNaN(depositId)) {
      return notFoundResponse('Invalid ID');
    }

    // Find the deposit and verify if it belongs to the user
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { challenge: true },
    });

    if (!deposit) {
      return notFoundResponse('Deposit not found');
    }

    // Verify if the challenge belongs to the authenticated user
    if (!(await verifyOwnership(deposit.challenge.userId))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.deposit.delete({
      where: { id: depositId },
    });
    
      return NextResponse.json({ message: 'Deposit removed successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return notFoundResponse('Deposit not found');
    }
    
    return serverErrorResponse('Error removing deposit');
  }
}

