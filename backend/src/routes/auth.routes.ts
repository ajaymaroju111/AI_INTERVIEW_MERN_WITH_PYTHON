import express from 'express';
import { registerSchema } from '../validators/auth/register.schema.js';
import { validate } from '../middleware/zodValidation.js';
import { RegisterController } from '../controllers/usercontroller.js';
const router = express.Router();



router.post('/register', validate(registerSchema), RegisterController);

export default router;