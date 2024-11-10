import { Router } from 'express';
import * as controller from '@v1/cart/controller';
import { isLoggedIn } from '@v1/lib/checkAuth';

const cartRoutes = Router();

cartRoutes.post('/set', isLoggedIn, controller.setCart);
cartRoutes.get('/get', isLoggedIn, controller.getCart);
cartRoutes.delete('/clear', isLoggedIn, controller.clearCart);

export default cartRoutes;
