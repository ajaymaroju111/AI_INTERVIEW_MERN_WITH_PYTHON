import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(6).max(100)
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[@$!%*?&]/, "Must include a special character"),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;