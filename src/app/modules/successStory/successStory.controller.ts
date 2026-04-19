import status from "http-status";
import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import { SuccessStoryServices } from "./successStory.service";
import sendResponse from "../../utils/sendResponse";

const createSuccessStory = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are not logged in");
  }

  const result = await SuccessStoryServices.createSuccessStory({ ...req.body, userId });

  sendResponse(res, {
    statusCode: status.CREATED,

    message: "Success Story created successfully",
    data: result,
  });
});

const getAllSuccessStories = catchAsync(async (req, res) => {
  const result = await SuccessStoryServices.getAllSuccessStories(req.query);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Success Stories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMySuccessStories = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await SuccessStoryServices.getSuccessStoriesByUserId(userId, req.query);
  sendResponse(res, {
    statusCode: status.OK,

    message: "My Success Stories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSuccessStoriesByProfessional = catchAsync(async (req, res) => {
  const { professionalId } = req.params;
  const result = await SuccessStoryServices.getSuccessStoriesByUserId(professionalId as string, req.query);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Professional's Success Stories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSuccessStoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SuccessStoryServices.getSuccessStoryById(id as string);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Success Story retrieved successfully",
    data: result,
  });
});

const updateSuccessStory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const updated = await SuccessStoryServices.updateSuccessStory(id as string, userId, req.body);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Success Story updated successfully",
    data: updated,
  });
});

const deleteSuccessStory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  await SuccessStoryServices.deleteSuccessStory(id as string, userId);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Success Story deleted successfully",
  });
});

export const SuccessStoryController = {
  createSuccessStory,
  getAllSuccessStories,
  getMySuccessStories,
  getSuccessStoriesByProfessional,
  getSuccessStoryById,
  updateSuccessStory,
  deleteSuccessStory,
};
