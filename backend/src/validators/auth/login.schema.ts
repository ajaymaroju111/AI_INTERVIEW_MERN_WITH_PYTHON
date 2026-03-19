import z, { email } from "zod";

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100)
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;