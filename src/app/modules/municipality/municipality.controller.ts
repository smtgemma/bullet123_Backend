import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MunicipalityService } from "./municipality.service";

// ── Get all Municipalities ─────────────────────────────────────────────────
const getAllMunicipalities = catchAsync(async (req, res) => {
  const result = await MunicipalityService.getAllMunicipalitiesFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Municipalities retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

// ── Get single Municipality by ID ──────────────────────────────────────────
const getSingleMunicipality = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await MunicipalityService.getSingleMunicipalityFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Municipality retrieved successfully!",
    data: result,
  });
});

// ── Get my Municipality profile ────────────────────────────────────────────
const getMyMunicipalityProfile = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  const result = await MunicipalityService.getMyMunicipalityProfileFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "My municipality profile retrieved successfully!",
    data: result,
  });
});

// ── Update Municipality ────────────────────────────────────────────────────
const updateMunicipality = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;

  const result = await MunicipalityService.updateMunicipalityIntoDB(
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Municipality updated successfully!",
    data: result,
  });
});

// ── Delete Municipality (Admin only) ──────────────────────────────────────
const deleteMunicipality = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MunicipalityService.deleteMunicipalityFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Municipality deleted successfully!",
    data: result,
  });
});

const getMyStaffs = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await MunicipalityService.getMyStaffsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staffs retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MunicipalityService.getSingleStaffFromDB(id as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Staff member retrieved successfully!",
    data: result,
  });
});

const getMyProfessionals = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await MunicipalityService.getMyProfessionalsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "External professionals retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const MunicipalityController = {
  getAllMunicipalities,
  getSingleMunicipality,
  getMyMunicipalityProfile,
  updateMunicipality,
  deleteMunicipality,
  getMyStaffs,
  getSingleStaff,
  getMyProfessionals,
};
