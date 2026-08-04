export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;

    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function unauthorized(message: string): HttpError {
  return new HttpError(401, message);
}

export function notFound(message: string): HttpError {
  return new HttpError(404, message);
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, message, details);
}

export function forbidden(message: string): HttpError {
  return new HttpError(403, message);
}
