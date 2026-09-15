import { Router } from 'express';
import { authenticate, authorize } from '../../common/middlewares/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import * as reportsController from './reports.controller.js';

export const reportsRouter = Router();
reportsRouter.use(authenticate, authorize('reports:read'));

reportsRouter.get('/dashboard', asyncHandler(reportsController.dashboard));
reportsRouter.get('/sales-by-period', asyncHandler(reportsController.salesByPeriod));
reportsRouter.get('/sales-by-period/export', asyncHandler(reportsController.salesByPeriodExport));
reportsRouter.get('/top-products', asyncHandler(reportsController.topProducts));
reportsRouter.get('/top-products/export', asyncHandler(reportsController.topProductsExport));
reportsRouter.get('/purchases-by-supplier', asyncHandler(reportsController.purchasesBySupplier));
reportsRouter.get('/profit', asyncHandler(reportsController.profit));
reportsRouter.get('/payment-methods', asyncHandler(reportsController.paymentMethods));
