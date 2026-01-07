/**
 * Audit logging system
 * Records important user actions for security and compliance
 */

import prisma from './prisma';
import { logger } from './logger';

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'user_registered'
  | 'challenge_created'
  | 'challenge_updated'
  | 'challenge_deleted'
  | 'deposit_created'
  | 'deposit_updated'
  | 'deposit_deleted'
  | 'large_deposit'
  | 'password_changed'
  | 'account_updated';

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates an audit log entry
 * This function is fire-and-forget and should not throw errors
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Check if auditLog model exists (in case Prisma client hasn't been regenerated)
    if (!prisma.auditLog) {
      logger.warn('AuditLog model not available in Prisma client. Run "npx prisma generate" to regenerate the client.', {
        action: data.action,
        userId: data.userId,
      });
      // Still log to structured logger even if DB logging fails
      logger.info(`Audit log: ${data.action}`, {
        userId: data.userId,
        ipAddress: data.ipAddress,
        metadata: data.metadata,
      });
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        ipAddress: data.ipAddress || null,
        metadata: data.metadata || undefined,
      },
    });

    // Also log to structured logger
    logger.info(`Audit log: ${data.action}`, {
      userId: data.userId,
      ipAddress: data.ipAddress,
      metadata: data.metadata,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    // But log the error so we know if there's an issue
    logger.error('Failed to create audit log', error as Error, {
      action: data.action,
      userId: data.userId,
    });
  }
}

/**
 * Helper function to get IP address from Next.js request
 */
export function getIpAddress(request: Request | { headers: Headers | { get: (key: string) => string | null } } | null | undefined): string | undefined {
  try {
    if (!request || !request.headers) {
      return undefined;
    }

    const headers = request.headers;
    
    // Check if headers has a get method (Headers object)
    if (typeof headers.get === 'function') {
      // Check for forwarded IP (from proxies/load balancers)
      const forwardedFor = headers.get('x-forwarded-for');
      if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
      }

      // Check for real IP
      const realIp = headers.get('x-real-ip');
      if (realIp) {
        return realIp.trim();
      }

      // Fallback to CF-Connecting-IP (Cloudflare)
      const cfIp = headers.get('cf-connecting-ip');
      if (cfIp) {
        return cfIp.trim();
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Convenience functions for common audit actions
 */
export const auditLog = {
  /**
   * Log a successful login
   */
  loginSuccess: async (userId: string, ipAddress?: string) => {
    await createAuditLog({
      userId,
      action: 'login_success',
      ipAddress,
    });
  },

  /**
   * Log a failed login attempt
   */
  loginFailed: async (email: string, ipAddress?: string) => {
    await createAuditLog({
      action: 'login_failed',
      ipAddress,
      metadata: { email },
    });
  },

  /**
   * Log user registration
   */
  userRegistered: async (userId: string, email: string, ipAddress?: string) => {
    await createAuditLog({
      userId,
      action: 'user_registered',
      ipAddress,
      metadata: { email },
    });
  },

  /**
   * Log challenge creation
   */
  challengeCreated: async (userId: string, challengeId: number, ipAddress?: string) => {
    await createAuditLog({
      userId,
      action: 'challenge_created',
      ipAddress,
      metadata: { challengeId },
    });
  },

  /**
   * Log challenge update
   */
  challengeUpdated: async (userId: string, challengeId: number, ipAddress?: string) => {
    await createAuditLog({
      userId,
      action: 'challenge_updated',
      ipAddress,
      metadata: { challengeId },
    });
  },

  /**
   * Log challenge deletion
   */
  challengeDeleted: async (userId: string, challengeId: number, ipAddress?: string) => {
    await createAuditLog({
      userId,
      action: 'challenge_deleted',
      ipAddress,
      metadata: { challengeId },
    });
  },

  /**
   * Log deposit creation
   */
  depositCreated: async (
    userId: string,
    challengeId: number,
    depositId: number,
    amount: number,
    ipAddress?: string
  ) => {
    await createAuditLog({
      userId,
      action: 'deposit_created',
      ipAddress,
      metadata: { challengeId, depositId, amount },
    });

    // Log large deposits separately
    if (amount >= 100) {
      await createAuditLog({
        userId,
        action: 'large_deposit',
        ipAddress,
        metadata: { challengeId, depositId, amount },
      });
    }
  },

  /**
   * Log deposit update
   */
  depositUpdated: async (
    userId: string,
    challengeId: number,
    depositId: number,
    amount: number,
    ipAddress?: string
  ) => {
    await createAuditLog({
      userId,
      action: 'deposit_updated',
      ipAddress,
      metadata: { challengeId, depositId, amount },
    });
  },

  /**
   * Log deposit deletion
   */
  depositDeleted: async (
    userId: string,
    challengeId: number,
    depositId: number,
    ipAddress?: string
  ) => {
    await createAuditLog({
      userId,
      action: 'deposit_deleted',
      ipAddress,
      metadata: { challengeId, depositId },
    });
  },
};

