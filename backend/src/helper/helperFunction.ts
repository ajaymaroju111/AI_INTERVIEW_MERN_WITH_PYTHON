import  Jwt  from "jsonwebtoken";
import type { Iquestion } from "../types/user.interface.ts";
import { Session } from "../model/session.model.ts";
import { AI_SERVICE_URL, pushSocketUpdate } from "../controllers/sessioncontrollers.ts";
import mongoose from "mongoose";
import fs from 'fs'
import FormData from "form-data";
import fetch from "node-fetch";
import { SocketAddress } from "net";

export const generateToken = (Payload: object): string => {
    const token = Jwt.sign(Payload, process.env.JWT_SECRET_KEY as string, {
        expiresIn: "7d",
        algorithm: "RS256",
    });
    return token;
}

 export const createQuestion = (
  questionText: string,
  questionType: "oral" | "coding"
): Iquestion  => {
  return {
    questionText,
    questionType,
    isEvaluated: false,
    isSubmitted: false,
    idealAnswer: "",
    userAnswerText: "",
    userSubmittedCode: "",
    technicalScore: 0,
    confidenceScore: 0,
    aiFeedback: ""
  } as Iquestion;
}

export const caluclateScoreSummary = async(sessionId: any) => {
  const results = await Session.aggregate([
    {
      $match : {
        _id: new mongoose.Types.ObjectId(sessionId)
      }
    },
    {
      $unwind : "$questions"
    },
    {
      $group: {
        _id : "$_id",
        avgTechnical: {
          $avg: { $cond : [{$eq : ["$questions.isEvaluated", true]}, "$questions.tecnicalScore", 0]}
        },
        avgConfidence: {
          $avg: { $cond : [{$eq : ["$questions.isEvaluated", true]}, "$questions.confidenceScore", 0]}
        }
      }
    },
    {
      $project: {
        _id : 0,
        overallScore : { $round : [{ $avg: ["$avgTechnical", "$avgConfidence"]}]},
        avgTechnical : {$round : ["$avgTechnical", 0]},
        avgConfidence : {$round : ["$avgConfidence", 0]},
        
      }
    }
  ])

  return results[0] || {overallScore: 0, avgTechnical: 0, avgConfidence: 0}
}


export const evaluateAnswer = async(
  io : any,
  userId : any,
  sessionId : any,
  questionIdx : any,
  audioFilePath : any = null,
  codeSubmission : any = null
) => {
  try {
    let transcription = "";
    const questionIndex = typeof questionIdx === "string" ? parseInt(questionIdx, 10) : questionIdx;
    const session = await Session.findById(sessionId);
    if(!session){
      pushSocketUpdate(io, userId, sessionId, "failed", "question not found");
      return
    }

    const question = session.questions[questionIdx];
    if(!question){
      pushSocketUpdate(io, userId, sessionId, "failed", `question not found at index : ${questionIndex}`);
      return
    }
    if(audioFilePath){
      try {
        pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Transcribing question ${questionIndex + 1}...`);
        const formData = new FormData();
        formData.append("file", fs.createReadStream(audioFilePath));
        const AIresponse = await fetch(`${AI_SERVICE_URL}/transcribe`, {
          method: "POST",
          body: formData,
          headers: formData.getHeaders(), 
        });

        if(!AIresponse.ok){
          const errorBody = await AIresponse.text();
          throw new Error(`AI service error ${AIresponse.status} - ${errorBody}`);
        }
        const AIdata : any = await AIresponse.json();
        transcription = AIdata.transcription || "";
        

      } catch (error : any) {
        console.log(`transcription failed : ${error.message}`);
        // pushSocketUpdate(io, userId, sessionId, "failed", error.message);
        return;
      }finally {
        if(audioFilePath && fs.existsSync(audioFilePath)){
          fs.unlinkSync(audioFilePath);
        }
      }

      try {
        pushSocketUpdate(io, userId, sessionId, "AI EVALUATING QUESTION", `Evaluating Question ${questionIndex + 1}...`);
        const evalResponse : any = await fetch(`${AI_SERVICE_URL}/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type" : "application/json"
          },
          body: JSON.stringify({
            questionText: question.questionText,
            questionType: question.questionType,
            role: session.role,
            user_answer: transcription,
            user_code: codeSubmission || ""
          })
        });

        if(!evalResponse.ok){
          const errorBody = await evalResponse.text();
          throw new Error(`AI service error ${evalResponse.status} - ${errorBody}`);
        }

        const evalData = await evalResponse.json();
        question.isEvaluated = true;

        question.userAnswerText = transcription;
        question.userSubmittedCode = codeSubmission || "",
        question.idealAnswer = evalData.idealAnswer;
        question.technicalScore = evalData.technicalScore;
        question.confidenceScore = evalData.confidenceScore;
        question.aiFeedback = evalData.aiFeedback;

        const allQuestionsEvaluated = session.questions.every(q => q.isEvaluated);
        if(session.status ==="completed" || allQuestionsEvaluated){
          const scoreSummary = await caluclateScoreSummary(sessionId);
          session.overallScore = scoreSummary.overallScore || 0;
          session.avgTechnical = scoreSummary.avgTechnical;
          session.avgConfidence = scoreSummary.avgConfidence;
        }

        if(allQuestionsEvaluated){
          session.status = "completed";
          session.endTime = session.endTime || new Date();
          await session.save();
          pushSocketUpdate(io, userId, sessionId, "session completed", `scores finalized`, session);
        }else {
          await session.save();
          pushSocketUpdate(io, userId, sessionId, "Evalution is completed", `Feedback for the question ${questionIndex + 1} is ready`, session)
        }

      } catch (error : any) {
        console.log(`Evalution failed : ${error.message}`);
        pushSocketUpdate(io, userId, sessionId, " Evaluation failed", error.message, session)
      }
    }

  } catch (error : any) {
    console.log("error occured in evaluation", error.message);

  }
}
