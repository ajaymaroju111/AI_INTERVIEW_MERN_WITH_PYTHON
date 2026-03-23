import { Session } from "../model/session.model.ts";
import fetch from "node-fetch";
import fs from "fs";
import dotEnv from "dotenv";
import type mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";
import type {
  CreateSessionInput,
  SessionIdInput,
  SubmitAnswerInput,
} from "../validators/user/socket.schema.ts";
import { caluclateScoreSummary, createQuestion, evaluateAnswer } from "../helper/helperFunction.ts";
import type { Iquestion } from "../types/user.interface.ts";
import path from "path";
dotEnv.config();

export const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000";

export const pushSocketUpdate = async (
  io: any,
  userId: mongoose.Types.ObjectId,
  sessionId: string,
  status: string,
  message: string,
  sessionData: any = null,
) => {
  io.to(userId.toString()).emit("sessionUpdate", {
    sessionId,
    status,
    message,
    sessionData,
  });
};

export const createSessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userID = (req as any).user?._id;
    const inputData: CreateSessionInput = req.body;
    const { role, level, interviewType, count } = inputData;
    if (!userID) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    let session = await Session.create({
      userId: userID,
      role,
      level,
      interviewType,
      status: "pending",
    });

    const io = req.app.get("io");
    res.status(201).json({
      message: "Session created successfully",
      sessionId: session._id,
      status: "pending",
    });
    //IIFE immediately invoke the function to avoid blocking the response
    (async () => {
      try {
        await pushSocketUpdate(
          io,
          userID,
          session._id.toString(),
          "generating",
          `Generating ${count} questions for ${role} at ${level} level...`,
        );

        const AIresponse = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role, level, count, interviewType }),
        });

        if (!AIresponse.ok) {
          throw new Error(`AI error: ${AIresponse.status}`);
        }

        const AIdata = (await AIresponse.json()) as { questions: string[] };

        const codingCount =
          interviewType === "coding-mix" ? Math.floor(count * 0.2) : 0;

        const questions: Iquestion[] = AIdata.questions.map(
          (qText: string, index: number) =>
            createQuestion(qText, index < codingCount ? "coding" : "oral"),
        );

        session.questions = questions;
        session.status = "in-progress";
        await session.save();

        await pushSocketUpdate(
          io,
          userID,
          session._id.toString(),
          "ready",
          "Starting Interview...",
        );
      } catch (error: any) {
        console.error("Error in async function:", error);

        session.status = "failed";
        await session.save();

        await pushSocketUpdate(
          io,
          userID,
          session._id.toString(),
          "failed",
          error.message,
        );
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const getSessionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userID = (req as any).user?._id;
    const sesssions = await Session.find({ userId: userID }).select(
      "-questions",
    );
    res.status(200).json(sesssions);
  } catch (error) {
    next(error);
  }
};

export const getSessionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userID = (req as any).user?._id;
    const { id: sessionId } = req.params as SessionIdInput;
    const session = await Session.findOne({ userId: userID, _id: sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};

export const deleteSessionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userID = (req as any).user?._id;
    const { id: sessionId } = req.params as SessionIdInput;
    const result = await Session.deleteOne({ userId: userID, _id: sessionId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const submitAnswerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?._id;
    const { id: sessionId } = req.params as SessionIdInput;
    // const { id: questionId } = req.params as SessionIdInput;
    const bodyData: SubmitAnswerInput = req.body;
    const { questionIndex, code } = bodyData;
    const session = await Session.findOne({ userId: userId, _id: sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const questionIdx = parseInt(questionIndex, 10);
    const question = session.questions[questionIdx];
    if (!question) {
      return res
        .status(404)
        .json({
          message: `Session not found at index number ${questionIndex}`,
        });
    }
    let audioFilePath = null;
    if (req.file) {
      audioFilePath = path.join(process.cwd(), req.file?.path);
    }
    const codeSubmission = code || null;

    question.isSubmitted = true;
    await session.save();
    res
      .status(200)
      .json({
        message:
          "Answer submitted successfully, please wait for the results...",
      });

    const io = req.app.get("io");
    evaluateAnswer(
      io,
      userId,
      sessionStorage,
      questionIndex,
      audioFilePath,
      codeSubmission,
    );
  } catch (error) {
    next(error);
  }
};

export const endSessionControllers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?._id;
    const { id: sessionId } = req.params as SessionIdInput;
    const session = await Session.findOne({ userId: userId, _id: sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const isProcessing = session.questions.some(q => q.isSubmitted && !q.isEvaluated);
    if(isProcessing){
      res.status(400);
      throw new Error("AI is still processing , please wait before ending the session");
    }
    if(session.status === "completed"){
      res.status(400);
      throw new Error("session already ended")
    }
    const scoreSummary = await caluclateScoreSummary(sessionId);
    session.overallScore = scoreSummary.overallScore || 0
    session.avgTechnical = scoreSummary.avgTechnical;
    session.avgConfidence = scoreSummary.avgConfidence
    session.status = "completed";
    await session.save();
    const io = req.app.get("io");
    pushSocketUpdate(io, userId, sessionId, "Session Completed", "Interview Ended early", session );
    res.status(200).json({
      message: "Session ended successfully",
      session
    })
  } catch (error) {
    next(error)
  }
};
