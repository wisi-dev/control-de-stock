import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as settingsController from './settings.controller.js';

export const settingsRouter = Router();

/** Cualquier usuario autenticado puede leer (ej: moneda para mostrar precios); solo un rol con acceso total puede editar. */
settingsRouter.get('/', authenticate, asyncHandler(settingsController.get));
settingsRouter.put('/', authenticate, authorize('settings:*'), asyncHandler(settingsController.update));
