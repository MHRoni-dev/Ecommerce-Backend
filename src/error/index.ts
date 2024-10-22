import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'http-errors';
import { ZodError } from 'zod';
import { JsonParseError } from '@error/Error';

export function handleError(
  err: HttpError | ZodError | JsonParseError,
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

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      stauts: 'fail',
      message: 'Input is in Invalid JSON format',
    });
    return;
  }

  // log error in server and send a common error response as fallback
  console.log(err);
  res.status(500).json({
    status: 'fail',
    message: 'something went wrong!',
  });
}
