import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as salesController from './sales.controller.js';

export const salesRouter = Router();
salesRouter.use(authenticate);

salesRouter.get('/', authorize('sales:read'), asyncHandler(salesController.list));
salesRouter.post('/', authorize('sales:*'), asyncHandler(salesController.create));
salesRouter.get('/:id', authorize('sales:read'), asyncHandler(salesController.getById));
salesRouter.put('/:id/cancel', authorize('sales:*'), asyncHandler(salesController.cancel));
