import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import type { AnyZodObject } from "zod/v3";



export const validate = (Schema : AnyZodObject | ZodTypeAny) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const result = Schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.format(),
      });
    }
    const data = result.data as any;

    if (data.body) req.body = data.body;
    if (data.query) req.query = data.query;
    if (data.params) req.params = data.params;
    next();
}