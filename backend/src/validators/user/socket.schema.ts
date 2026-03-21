import { z } from "zod";

export const createSessionSchema = z.object({
  body : z.object({
    role: z.string().min(1),
    level: z.string().min(1),
    interviewType: z.enum(["oral-only", "coding-mix"]),
    count: z.number()
  })
}).strict();

export const sessionIdSchema = z.object({
  params : z.object({
    id : z.string().min(1)
  })
}).strict();

export const submitAnswerSchema = z.object({
  body: z.object({
    questionIndex: z.string().min(1),
    code : z.string().min(1)
  })
}).strict();

export type CreateSessionInput = z.infer<typeof createSessionSchema>["body"];
export type SessionIdInput = z.infer<typeof sessionIdSchema>["params"];
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>["body"];