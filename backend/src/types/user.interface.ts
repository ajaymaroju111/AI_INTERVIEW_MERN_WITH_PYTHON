import mongoose, { Document } from "mongoose";

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
    comparePassword(password: string): Promise<boolean>;
}

export interface JWTpayload {
    id : string;
}

export interface Iquestion extends Document {
    questionText : string;
    questionType : "oral" | "coding";
    isEvaluated: boolean;
    idealAnswer : string;
    userAnswerText : string;
    userSubmittedCode : string;
    isSubmitted : boolean;
    technicalScore : number;
    confidenceScore : number;
    aiFeedback : string;
}

export interface Isession extends Document {
    userId : mongoose.Types.ObjectId;
    role: string;
    level: string;
    interviewType : "oral-only" | "coding-mix";
    status : "pending" | "in-progress" | "completed" | "failed";
    overallScore : number;
    avgTechnical: number;
    avgConfidence: number;
    questions : Iquestion[];
    startTime? : Date;
    endTime? : Date;
}