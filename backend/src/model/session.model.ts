import mongoose, { Model, Schema } from "mongoose";
import type { Iquestion, Isession } from "../types/user.interface.js";

const questionSchema : Schema<Iquestion> = new mongoose.Schema({
    questionText : {
        type: String,
        required: true,
    },
    questionType : {
        type: String,
        required: true,
        enum: ["oral", "coding"]
    },
    idealAnswer : {
        type: String,
        default: "pending"
    },
    userAnswerText : {
        type: String,
        default: ""
    },
    userSubmittedCode : {
        type: String,
        default: ""
    },
    isSubmitted : {
        type: Boolean,
        default: false
    },
    isEvaluated : {
        type: Boolean,
        default: false
    },
    technicalScore : {
        type: Number,
        default: 0
    },
    confidenceScore : {
        type: Number,
        default: 0
    },
    aiFeedback : {
        type: String,
        default: "Not yet submitted or evaluated"
    }

})

const sessionSchema : Schema<Isession> = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index : true
    },
    role: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    interviewType : {
        type: String,
        required: true,
        enum: ["oral-only", "coding-mix"]
    },
    status : {
        type: String,
        required: true,
        enum: ["pending", "in-progress", "completed", "failed"],
        default: "pending"
    },
    overallScore : {
        type: Number,
        default: 0
    },
    avgTechnical : {
        type: Number,
        default: 0
    },
    avgConfidence : {
        type: Number,
        default: 0
    },
    questions : [questionSchema],
    startTime : {
        type: Date,
    },
    endTime : {
        type: Date,
    }

}, {timestamps: true});


export const Session : Model<Isession> = mongoose.model<Isession>("Session", sessionSchema);
