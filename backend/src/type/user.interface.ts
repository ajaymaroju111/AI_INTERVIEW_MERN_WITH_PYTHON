import { Document } from "mongoose";

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    googleId? : string;
    password: string;
    role: "user" | "admin";
    preferredRole : string;
    createdAt: Date;
    updatedAt: Date;
}

export interface JWTpayload {
    id : string;
}