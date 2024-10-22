import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'http-errors';
import { ZodError } from 'zod';

export function handleError(
  err: HttpError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'fail',
      message: 'Validation Error',
      errors: err.errors.map(
        (data) => `${data.path.toString()} is ${data.message}`,
      ),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      status: 'fail',
      message: err.message,
    });
    return;
  }

  res.status(400).json(err);
}
