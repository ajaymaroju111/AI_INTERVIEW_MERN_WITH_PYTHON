import express from 'express';
import { registerSchema } from '../validators/auth/register.schema.ts';
import { validate } from '../middleware/zodValidation.ts';
import { getUserProfileController, googleAuthcontroller, loginController, registerController, updateUserProfileController } from '../controllers/usercontroller.ts';
import { getUserProfileSchema, updateUserProfileSchema } from '../validators/user/user.schema.ts';
import { loginSchema } from '../validators/auth/login.schema.ts';
import { authenticateToken } from '../middleware/authentication.ts';
const router = express.Router();



router.post('/register', validate(registerSchema), registerController);
router.post('/login', validate(loginSchema), loginController);
// router.post('/google', validate(loginSchema), googleAuthcontroller);
router.get('/profile', authenticateToken, validate(getUserProfileSchema), getUserProfileController);
router.patch('/profile', authenticateToken, validate(updateUserProfileSchema), updateUserProfileController);

export default router;