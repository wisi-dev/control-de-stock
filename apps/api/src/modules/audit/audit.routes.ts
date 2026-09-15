import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as auditController from './audit.controller.js';

/** Solo el rol con acceso total (Administrador) puede ver la auditoría del sistema. */
export const auditRouter = Router();
auditRouter.use(authenticate, authorize('audit:read'));

auditRouter.get('/', asyncHandler(auditController.list));
auditRouter.get('/filters', asyncHandler(auditController.filters));
