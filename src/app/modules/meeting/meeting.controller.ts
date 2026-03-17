import { Request, Response } from "express";

import httpStatus from "http-status";
import { meetingService } from "./meeting.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const createmeeting = catchAsync(async (req: Request, res: Response) => {

  const userId = req.user?.id;

  const result = await meetingService.createmeeting({
    ...req.body,
    userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
  
    message: "Meeting created successfully",
    data: result,
  });
});

const getAllmeetings = catchAsync(async (req: Request, res: Response) => {
  const results = await meetingService.getAllmeetings(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
  
    message: "Meetings retrieved successfully",
    data: results,
  });
});

const getSinglemeeting = catchAsync(async (req: Request, res: Response) => {
  const result = await meetingService.getSinglemeeting(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
  
    message: "Meeting retrieved successfully",
    data: result,
  });
});

const updatemeeting = catchAsync(async (req: Request, res: Response) => {
  const result = await meetingService.updatemeeting(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
  
    message: "Meeting updated successfully",
    data: result,
  });
});

const deletemeeting = catchAsync(async (req: Request, res: Response) => {
  await meetingService.deletemeeting(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
  
    message: "Meeting deleted successfully",
    data: null,
  });
});

export const meetingController = {
  createmeeting,
  getAllmeetings,
  getSinglemeeting,
  updatemeeting,
  deletemeeting,
};