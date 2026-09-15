import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as brandsController from './brands.controller.js';

export const brandsRouter = Router();
brandsRouter.use(authenticate);

brandsRouter.get('/', authorize('brands:read'), asyncHandler(brandsController.list));
brandsRouter.post('/', authorize('brands:*'), asyncHandler(brandsController.create));
brandsRouter.put('/:id', authorize('brands:*'), asyncHandler(brandsController.update));
