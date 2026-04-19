import { HttpError } from "../utils/httpError.js";

export function validateMiddleware(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next(
        new HttpError(422, "VALIDATION_ERROR", "Проверьте введённые данные: некоторые поля неверны или пусты.", parsed.error.issues)
      );
    }

    req.validatedBody = parsed.data;
    return next();
  };
}
