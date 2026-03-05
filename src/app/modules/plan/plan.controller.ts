import status from "http-status";
import { PlanServices } from "./plan.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PlanType } from "@prisma/client";
import AppError from "../../errors/AppError";

const createPlan = catchAsync(async (req, res) => {
  const result = await PlanServices.createPlan(req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Plan created successfully!",
    data: result,
  });
});

const updatePlan = catchAsync(async (req, res) => {
  const result = await PlanServices.updatePlan(req.params.planId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Plan updated successfully!",
    data: result,
  });
});

const getAllPlans = catchAsync(async (req, res) => {
  const result = await PlanServices.getAllPlans();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Plans fetched successfully!",
    data: result,
  });
});

const getPlanById = catchAsync(async (req, res) => {
  const result = await PlanServices.getPlanById(req.params.planId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Plan fetched successfully!",
    data: result,
  });
});

const deletePlan = catchAsync(async (req, res) => {
  const result = await PlanServices.deletePlan(req.params.planId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Plan deleted successfully!",
    data: result,
  });
});

const getPlansByType = catchAsync(async (req, res) => {
  const { type } = req.query;

  if (!type) {
    throw new AppError(
      status.BAD_REQUEST,
      "Plan type is required"
    );
  }

  if (!Object.values(PlanType).includes(type as PlanType)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Invalid plan type. Must be one of: ${Object.values(PlanType).join(', ')}`
    );
  }

  const result = await PlanServices.getPlansByType(type as PlanType);

  sendResponse(res, {
    statusCode: status.OK,
    message: `${type} plans retrieved successfully`,
    data: result,
  });
});

const getFreePlans = catchAsync(async (req, res) => {
  const result = await PlanServices.getFreePlans();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Free plans retrieved successfully",
    data: result,
  });
});

const getPremiumPlans = catchAsync(async (req, res) => {
  const result = await PlanServices.getPremiumPlans();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Premium plans retrieved successfully",
    data: result,
  });
});

const getGoldPlans = catchAsync(async (req, res) => {
  const result = await PlanServices.getGoldPlans();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Gold plans retrieved successfully",
    data: result,
  });
});


const getAllFeaturedItems = catchAsync(async (req, res) => {
  const result = await PlanServices.getAllFeaturedItems();

  sendResponse(res, {
    statusCode: status.OK,
    message: "Featured items fetched successfully!",
    data: result,
  });
});

const setDiscount = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const result = await PlanServices.setDiscount(planId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Discount applied successfully!",
    data: result,
  });
});

const removeDiscount = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const result = await PlanServices.removeDiscount(planId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Discount removed successfully!",
    data: result,
  });
});


const updateDiscount = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const result = await PlanServices.updateDiscount(planId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Discount updated successfully!",
    data: result,
  });
});

export const PlanController = {
  createPlan,
  updatePlan,
  getAllPlans,
  getPlanById,
  deletePlan,
  getPlansByType,
  getFreePlans,
  getPremiumPlans,
  getGoldPlans,
  getAllFeaturedItems,
  setDiscount,
  removeDiscount
  ,
  updateDiscount
};