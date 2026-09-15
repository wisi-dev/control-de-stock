import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as categoriesController from './categories.controller.js';

export const categoriesRouter = Router();
categoriesRouter.use(authenticate);

categoriesRouter.get('/', authorize('categories:read'), asyncHandler(categoriesController.list));
categoriesRouter.post('/', authorize('categories:*'), asyncHandler(categoriesController.create));
categoriesRouter.put('/:id', authorize('categories:*'), asyncHandler(categoriesController.update));
