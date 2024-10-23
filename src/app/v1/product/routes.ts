import { Router } from 'express';
import * as controller from '@v1/product/controller';

const productRoutes: Router = Router();

productRoutes.post('/create', controller.createProduct);
productRoutes.get('/read', controller.readAllProduct);

export default productRoutes;
