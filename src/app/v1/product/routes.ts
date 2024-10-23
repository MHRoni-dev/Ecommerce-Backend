import { Router } from 'express';
import * as controller from '@v1/product/controller';

const productRoutes: Router = Router();

productRoutes.post('/create', controller.createProduct);
productRoutes.get('/read', controller.readAllProduct);
productRoutes.get('/read/:slug', controller.readProductBySlug);
productRoutes.put('/update/:slug', controller.updateProductBySlug);

export default productRoutes;
