import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as purchasesController from './purchases.controller.js';

export const purchasesRouter = Router();
purchasesRouter.use(authenticate);

purchasesRouter.get('/', authorize('purchases:read'), asyncHandler(purchasesController.list));
purchasesRouter.post('/', authorize('purchases:*'), asyncHandler(purchasesController.create));
purchasesRouter.get('/:id', authorize('purchases:read'), asyncHandler(purchasesController.getById));
purchasesRouter.put('/:id/receive', authorize('purchases:*'), asyncHandler(purchasesController.receive));
purchasesRouter.put('/:id/cancel', authorize('purchases:*'), asyncHandler(purchasesController.cancel));
