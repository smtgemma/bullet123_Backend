import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SuperAdminService } from "./superAdmin.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
   const result = await SuperAdminService.getDashboardStats();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Dashboard stats retrieved successfully",
      data: result,
   });
});

const getRecentActivities = catchAsync(async (req: Request, res: Response) => {
   const result = await SuperAdminService.getRecentActivities();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Recent activities retrieved successfully",
      data: result,
   });
});

const updateUserBlocked = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const blockReason = req.body.blockReason;
   const result = await SuperAdminService.updateUserBlocked(
      id as string,
      blockReason as string,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `User ${result.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: result,
   });
});

export const SuperAdminController = {
   getDashboardStats,
   getRecentActivities,
   updateUserBlocked,
};
