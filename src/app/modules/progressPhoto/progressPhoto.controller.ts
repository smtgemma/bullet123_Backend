import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProgressPhotoService } from "./progressPhoto.service";

const uploadProgressPhoto = catchAsync(async (req, res) => {
  const user = (req as any).user;
  const result = await ProgressPhotoService.uploadProgressPhotoIntoDB({
    ...req.body,
    uploaderId: user.id,
  });
  
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photo uploaded successfully!",
    data: result,
  });
});

const getProgressPhotosByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await ProgressPhotoService.getProgressPhotosByPropertyFromDB(propertyId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photos retrieved successfully!",
    data: result,
  });
});

const deleteProgressPhoto = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ProgressPhotoService.deleteProgressPhotoFromDB(id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Progress photo deleted successfully!",
    data: null,
  });
});

export const ProgressPhotoController = {
  uploadProgressPhoto,
  getProgressPhotosByProperty,
  deleteProgressPhoto,
};
