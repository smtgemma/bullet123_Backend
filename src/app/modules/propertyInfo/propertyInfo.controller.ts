import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PropertyInfoService } from "./propertyInfo.service";

const createPropertyInfo = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  // Handle multiple images from req.files if using multer, 
  // but for now assuming direct payload or single file handling in future.
  // design shows multiple images selection.

  const result = await PropertyInfoService.createPropertyInfoIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,

    message: "Property created successfully!",
    data: result,
  });
});

const getAllPropertyInfos = catchAsync(async (req, res) => {
  const result = await PropertyInfoService.getAllPropertyInfosFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property infos retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSinglePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PropertyInfoService.getSinglePropertyInfoFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property info retrieved successfully!",
    data: result,
  });
});

const updatePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PropertyInfoService.updatePropertyInfoIntoDB(id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Property info updated successfully!",
    data: result,
  });
});

const deletePropertyInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PropertyInfoService.deletePropertyInfoFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,

    message: "Property info deleted successfully!",
    data: null,
  });
});

const getMyProperties = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await PropertyInfoService.getMyPropertiesFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "My properties retrieved successfully!",
    data: result,
  });
});

export const PropertyInfoController = {
  createPropertyInfo,
  getAllPropertyInfos,
  getSinglePropertyInfo,
  updatePropertyInfo,
  deletePropertyInfo,
  getMyProperties,
};
