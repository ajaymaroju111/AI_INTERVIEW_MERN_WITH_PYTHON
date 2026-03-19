import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import type { AnyZodObject } from "zod/v3";



export const validate = (Schema : AnyZodObject | ZodTypeAny) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const result = Schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.format(),
      });
    }
    req.body = result.data;
    next();
}