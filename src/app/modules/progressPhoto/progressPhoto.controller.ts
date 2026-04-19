import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProgressPhotoService } from "./progressPhoto.service";

const uploadProgressPhoto = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await ProgressPhotoService.uploadProgressPhotoIntoDB({
    ...req.body,
    uploaderId: userId,
  });

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Progress photos uploaded successfully!",
    data: result,
  });
});

const getProgressPhotosByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await ProgressPhotoService.getProgressPhotosByPropertyFromDB(propertyId as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photos retrieved successfully!",
    data: result,
  });
});

const getSingleProgressPhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ProgressPhotoService.getSingleProgressPhotoFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photo retrieved successfully!",
    data: result,
  });
});

const updateProgressPhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ProgressPhotoService.updateProgressPhotoInDB(id as string, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photo updated successfully!",
    data: result,
  });
});

const deleteProgressPhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ProgressPhotoService.deleteProgressPhotoFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photo deleted successfully!",
    data: null,
  });
});

export const ProgressPhotoController = {
  uploadProgressPhoto,
  getProgressPhotosByProperty,
  getSingleProgressPhoto,
  updateProgressPhoto,
  deleteProgressPhoto,
};
