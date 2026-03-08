import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;
      const result = (schema as z.ZodType).safeParse(req[source as keyof typeof schemas]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path.length > 0
            ? `${source}.${issue.path.join('.')}`
            : source;
          if (!errors[field]) errors[field] = [];
          errors[field].push(issue.message);
        }
      } else {
        (req as unknown as Record<string, unknown>)[source] = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError('Validation failed', errors));
      return;
    }

    next();
  };
}
