import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as cashRegisterController from './cashregister.controller.js';

export const cashRegisterRouter = Router();
cashRegisterRouter.use(authenticate);

cashRegisterRouter.get('/current', authorize('cashregister:read'), asyncHandler(cashRegisterController.getCurrent));
cashRegisterRouter.get('/history', authorize('cashregister:read'), asyncHandler(cashRegisterController.history));
cashRegisterRouter.post('/open', authorize('cashregister:*'), asyncHandler(cashRegisterController.open));
cashRegisterRouter.put('/:id/close', authorize('cashregister:*'), asyncHandler(cashRegisterController.close));
cashRegisterRouter.post('/:id/movements', authorize('cashregister:*'), asyncHandler(cashRegisterController.addMovement));
