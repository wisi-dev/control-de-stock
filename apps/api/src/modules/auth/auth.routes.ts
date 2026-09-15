import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as authController from './auth.controller.js';

/** Límite estricto propio del login, más allá del general de /api, contra fuerza bruta. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Demasiados intentos. Probá de nuevo en unos minutos.', code: 'TOO_MANY_REQUESTS' },
  },
});

export const authRouter = Router();

authRouter.post('/login', loginLimiter, asyncHandler(authController.login));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
