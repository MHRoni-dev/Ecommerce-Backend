import { Router } from 'express';
import * as controller from '@v1/category/controller';

const categoryRoutes: Router = Router();

categoryRoutes.post('/create', controller.createCategory);
categoryRoutes.get('/read', controller.readAllCategory);

export default categoryRoutes;
