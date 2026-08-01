export class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}

export function badRequest(message, details = null) {
  return new AppError(400, 'bad_request', message, details);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError(401, 'unauthorized', message);
}

export function notFound(message = 'Not found') {
  return new AppError(404, 'not_found', message);
}

export function methodNotAllowed(message = 'Method not allowed') {
  return new AppError(405, 'method_not_allowed', message);
}

export function serviceUnavailable(message = 'Service unavailable') {
  return new AppError(503, 'service_unavailable', message);
}
