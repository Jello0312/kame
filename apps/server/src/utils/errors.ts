export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message = 'Validation failed', fieldErrors: Record<string, string[]> = {}) {
    super(message, 400);
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
