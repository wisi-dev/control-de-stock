import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as inventoryController from './inventory.controller.js';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

inventoryRouter.get('/movements', authorize('inventory:read'), asyncHandler(inventoryController.listMovements));
inventoryRouter.post('/movements', authorize('inventory:*'), asyncHandler(inventoryController.createMovement));
inventoryRouter.get('/alerts', authorize('inventory:read'), asyncHandler(inventoryController.getAlerts));
