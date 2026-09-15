import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as rolesController from './roles.controller.js';

export const rolesRouter = Router();

rolesRouter.use(authenticate, authorize('roles:*'));

rolesRouter.get('/', asyncHandler(rolesController.list));
rolesRouter.get('/permissions/catalog', asyncHandler(rolesController.catalog));
rolesRouter.put('/:id/permissions', asyncHandler(rolesController.updatePermissions));
