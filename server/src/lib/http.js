export class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Wraps async route handlers so thrown errors reach the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Validates req.body with a zod schema and replaces it with the parsed value.
export const validate = (schema) => (req, res, next) => {
  const r = schema.safeParse(req.body ?? {});
  if (!r.success) {
    const issue = r.error.issues[0];
    return next(new HttpError(400, issue?.message || "Invalid input", "VALIDATION", { field: issue?.path?.join(".") }));
  }
  req.body = r.data;
  next();
};
