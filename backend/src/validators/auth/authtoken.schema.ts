import mongoose from "mongoose";
import z from "zod";


export const authTokenSchema = z.object({
    id : z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ID"
    })
})

export type AuthUser = z.infer<typeof authTokenSchema>;