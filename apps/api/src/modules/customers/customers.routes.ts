import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as customersController from './customers.controller.js';

export const customersRouter = Router();
customersRouter.use(authenticate);

customersRouter.get('/', authorize('customers:read'), asyncHandler(customersController.list));
customersRouter.post('/', authorize('customers:*'), asyncHandler(customersController.create));
customersRouter.get('/:id', authorize('customers:read'), asyncHandler(customersController.getById));
customersRouter.put('/:id', authorize('customers:*'), asyncHandler(customersController.update));
