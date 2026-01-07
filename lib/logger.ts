/**
 * Structured logging system
 * Provides consistent logging with different levels and formats
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Formats a log entry based on the environment
 */
function formatLog(entry: LogEntry): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, output JSON for log aggregation services
    return JSON.stringify(entry);
  } else {
    // In development, output human-readable format
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    const error = entry.error
      ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? `\n  Stack: ${entry.error.stack}` : ''}`
      : '';

    return `[${timestamp}] ${level} ${message}${metadata}${error}`;
  }
}

/**
 * Creates a log entry and outputs it
 */
function log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata }),
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        ...(error.stack && { stack: error.stack }),
      },
    }),
  };

  const formatted = formatLog(entry);

  // Output to appropriate console method
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
    default:
      console.log(formatted);
      break;
  }
}

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Log an informational message
   */
  info: (message: string, metadata?: Record<string, any>) => {
    log('info', message, metadata);
  },

  /**
   * Log a warning message
   */
  warn: (message: string, metadata?: Record<string, any>) => {
    log('warn', message, metadata);
  },

  /**
   * Log an error message
   */
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    log('error', message, metadata, error);
  },

  /**
   * Log a failed login attempt
   */
  logFailedLogin: (email: string, ipAddress?: string) => {
    logger.warn('Failed login attempt', {
      email,
      ipAddress,
      action: 'login_failed',
    });
  },

  /**
   * Log a successful login
   */
  logSuccessfulLogin: (userId: string, email: string, ipAddress?: string) => {
    logger.info('Successful login', {
      userId,
      email,
      ipAddress,
      action: 'login_success',
    });
  },

  /**
   * Log user registration
   */
  logUserRegistration: (userId: string, email: string, ipAddress?: string) => {
    logger.info('User registered', {
      userId,
      email,
      ipAddress,
      action: 'user_registered',
    });
  },

  /**
   * Log challenge creation
   */
  logChallengeCreation: (userId: string, challengeId: number, ipAddress?: string) => {
    logger.info('Challenge created', {
      userId,
      challengeId,
      ipAddress,
      action: 'challenge_created',
    });
  },

  /**
   * Log large deposit (for monitoring)
   */
  logLargeDeposit: (userId: string, challengeId: number, amount: number, ipAddress?: string) => {
    logger.warn('Large deposit detected', {
      userId,
      challengeId,
      amount,
      ipAddress,
      action: 'large_deposit',
    });
  },
};

