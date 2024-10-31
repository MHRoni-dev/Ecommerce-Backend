import { Router } from 'express';
import * as controller from '@v1/user/controller';

const userRoutes: Router = Router();

userRoutes.post('/register', controller.registerUser);
userRoutes.post('/login', controller.loginUser);

export default userRoutes;
