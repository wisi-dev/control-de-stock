import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as suppliersController from './suppliers.controller.js';

export const suppliersRouter = Router();
suppliersRouter.use(authenticate);

suppliersRouter.get('/', authorize('suppliers:read'), asyncHandler(suppliersController.list));
suppliersRouter.post('/', authorize('suppliers:*'), asyncHandler(suppliersController.create));
suppliersRouter.get('/:id', authorize('suppliers:read'), asyncHandler(suppliersController.getById));
suppliersRouter.put('/:id', authorize('suppliers:*'), asyncHandler(suppliersController.update));
