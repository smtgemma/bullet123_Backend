import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SuperAdminService } from "./superAdmin.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: result,
  });
});

const getRecentActivities = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.getRecentActivities();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent activities retrieved successfully",
    data: result,
  });
});

export const SuperAdminController = {
  getDashboardStats,
  getRecentActivities,
};
