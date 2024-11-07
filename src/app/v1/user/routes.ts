import { Router } from 'express';
import * as controller from '@v1/user/controller';

const userRoutes: Router = Router();

userRoutes.post('/register', controller.registerUser);
userRoutes.post('/resend-verification/', controller.resendVerification);
userRoutes.get('/verify/:email', controller.verifyUser);
userRoutes.post('/login', controller.loginUser);
userRoutes.put('/reset-password', controller.resetPassword);

export default userRoutes;
