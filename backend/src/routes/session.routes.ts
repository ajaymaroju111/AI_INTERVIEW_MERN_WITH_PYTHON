import express from 'express';
import { authenticateToken } from '../middleware/authentication.ts';
import { validate } from '../middleware/zodValidation.ts';
import { createSessionSchema, sessionIdSchema } from '../validators/user/socket.schema.ts';
import { createSessionController, deleteSessionByIdController, endSessionControllers, getSessionByIdController, getSessionsController, submitAnswerController } from '../controllers/sessioncontrollers.ts';
import { uploadSingleAudio } from '../middleware/uploadMiddleware.ts';

const router = express.Router();

router.post("/", authenticateToken, validate(createSessionSchema), createSessionController)
router.get("/", authenticateToken, getSessionsController)
router.get("/:id", authenticateToken, validate(sessionIdSchema), getSessionByIdController)
router.delete("/:id", authenticateToken, validate(sessionIdSchema), deleteSessionByIdController)
router.post("/:id/submit-answer", authenticateToken, validate(createSessionSchema), validate(sessionIdSchema), uploadSingleAudio,  submitAnswerController)
router.post("/:id/end", authenticateToken, validate(sessionIdSchema),  endSessionControllers)


export default router;