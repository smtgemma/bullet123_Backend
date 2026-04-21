import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SellerService } from "./seller.service";

// ── Get all Sellers ────────────────────────────────────────────────────────
const getAllSellers = catchAsync(async (req, res) => {
  const result = await SellerService.getAllSellersFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Sellers retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

// ── Get single Seller by ID ─────────────────────────────────────────────────
const getSingleSeller = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SellerService.getSingleSellerFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Seller retrieved successfully!",
    data: result,
  });
});

// ── Get my Seller profile ───────────────────────────────────────────────────
const getMySellerProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  const result = await SellerService.getMySellerProfileFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "My seller profile retrieved successfully!",
    data: result,
  });
});

// ── Update Seller ───────────────────────────────────────────────────────────
const updateSeller = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  const result = await SellerService.updateSellerIntoDB(
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Seller updated successfully!",
    data: result,
  });
});

// ── Delete Seller (Admin only) ──────────────────────────────────────────────
const deleteSeller = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SellerService.deleteSellerFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Seller deleted successfully!",
    data: result,
  });
});

const getMyStaffs = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await SellerService.getMyStaffsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staffs retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SellerService.getSingleStaffFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staff member retrieved successfully!",
    data: result,
  });
});

const getSellerDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  console.log(userId);
  const result = await SellerService.getSellerDashboardStatsFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Seller dashboard stats retrieved successfully!",
    data: result,
  });
});

export const SellerController = {
  getAllSellers,
  getSingleSeller,
  getMySellerProfile,
  updateSeller,
  deleteSeller,
  getMyStaffs,
  getSingleStaff,
  getSellerDashboardStats,
};
