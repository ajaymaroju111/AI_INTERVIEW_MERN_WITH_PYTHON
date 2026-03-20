import z, { email } from "zod";

export const getUserProfileSchema = z.object({
    params : z.object({
        userId : z.string().uuid().nonempty("User ID is required"),
    })
});

export const updateUserProfileSchema = z.object({
    body : z.object({
        firstName : z.string().optional(),
        lastName : z.string().optional(),
        email : z.string().email().optional(),
        password : z.string().min(6).max(100)
        .regex(/[A-Z]/, "Must include an uppercase letter")
        .regex(/[0-9]/, "Must include a number")
        .regex(/[@$!%*?&]/, "Must include a special character")
        .optional(),
        preferredRole : z.string().optional(),
    })
})

// type GetProfileParams = z.infer<typeof getUserProfileSchema>["params"];
export type GetUserProfileInput = z.infer<typeof getUserProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>["body"];