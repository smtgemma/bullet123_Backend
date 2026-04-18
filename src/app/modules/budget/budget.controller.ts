import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BudgetService } from "./budget.service";

const createBudget = catchAsync(async (req, res) => {
  const result = await BudgetService.createBudgetIntoDB(req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Budget item created successfully!",
    data: result,
  });
});

const getBudgetsByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await BudgetService.getBudgetsByPropertyFromDB(propertyId as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Budgets retrieved successfully!",
    data: result,
  });
});

const updateBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BudgetService.updateBudgetIntoDB(id as string, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Budget updated successfully!",
    data: result,
  });
});

const deleteBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  await BudgetService.deleteBudgetFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Budget deleted successfully!",
    data: null,
  });
});

const getSingleBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BudgetService.getSingleBudgetFromDB(id as string);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Budget item retrieved successfully!",
    data: result,
  });
});

export const BudgetController = {
  createBudget,
  getSingleBudget,
  getBudgetsByProperty,
  updateBudget,
  deleteBudget,
};
