import status from "http-status";
import { SuccessStoryService } from "./successStory.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const getPlatformStats = catchAsync(async (_req, res) => {
  const result = await SuccessStoryService.getPlatformStatsFromDB();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Platform stats retrieved successfully",
    data: result,
  });
});

const getAllSuccessStories = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.getAllSuccessStoriesFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Success stories retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getFeaturedStories = catchAsync(async (_req, res) => {
  const result = await SuccessStoryService.getFeaturedStoriesFromDB();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Featured stories retrieved successfully",
    data: result,
  });
});

const getSingleSuccessStory = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.getSingleSuccessStoryFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Success story retrieved successfully",
    data: result,
  });
});

const createSuccessStory = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.createSuccessStoryIntoDB(req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Success story created successfully",
    data: result,
  });
});

const updateSuccessStory = catchAsync(async (req, res) => {
  const result = await SuccessStoryService.updateSuccessStoryIntoDB(req.params.id, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Success story updated successfully",
    data: result,
  });
});

const deleteSuccessStory = catchAsync(async (req, res) => {
  await SuccessStoryService.deleteSuccessStoryFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Success story deleted successfully",
  });
});

const getCategories = catchAsync(async (_req, res) => {
  const result = await SuccessStoryService.getCategories();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

export const SuccessStoryController = {
  getCategories,
  getPlatformStats,
  getAllSuccessStories,
  getFeaturedStories,
  getSingleSuccessStory,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
};
