import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as usersController from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(authenticate, authorize('users:*'));

usersRouter.get('/', asyncHandler(usersController.list));
usersRouter.post('/', asyncHandler(usersController.create));
usersRouter.get('/:id', asyncHandler(usersController.getById));
usersRouter.put('/:id', asyncHandler(usersController.update));
usersRouter.put('/:id/password', asyncHandler(usersController.setPassword));
