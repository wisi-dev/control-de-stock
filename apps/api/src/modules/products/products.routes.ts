import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as productsController from './products.controller.js';

export const productsRouter = Router();
productsRouter.use(authenticate);

productsRouter.get('/export', authorize('products:read'), asyncHandler(productsController.exportCsv));
productsRouter.post('/import', authorize('products:*'), asyncHandler(productsController.importCsv));

productsRouter.get('/', authorize('products:read'), asyncHandler(productsController.list));
productsRouter.post('/', authorize('products:*'), asyncHandler(productsController.create));
productsRouter.get('/:id', authorize('products:read'), asyncHandler(productsController.getById));
productsRouter.put('/:id', authorize('products:*'), asyncHandler(productsController.update));
