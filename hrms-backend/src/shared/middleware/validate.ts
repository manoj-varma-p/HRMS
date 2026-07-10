import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { ApiError } from "../errors/ApiError";

type RequestSchema = ZodType<{
  body?: unknown;
  query?: unknown;
  params?: unknown;
}>;

export function validate(schema: RequestSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      next(new ApiError(422, "Validation failed", errors));
      return;
    }

    const parsed = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };

    // Express 5 makes req.query a read-only getter, so coerced/defaulted
    // query values (numbers, booleans, defaults) can't be written back onto
    // it. Controllers that need the parsed/typed query or params read them
    // from req.validated instead of req.query/req.params directly.
    if (parsed.body !== undefined) req.body = parsed.body;
    req.validated = {
      query: parsed.query,
      params: parsed.params,
    };

    next();
  };
}
