import status from "http-status";
import { SettingsService } from "./settings.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// ── Get My Settings ────────────────────────────────────────────────────────
const getMySettings = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await SettingsService.getMySettingsFromDB(userId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Settings retrieved successfully",
    data: result,
  });
});

// ── Update My Settings ─────────────────────────────────────────────────────
const updateMySettings = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await SettingsService.updateMySettingsIntoDB(userId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Settings updated successfully",
    data: result,
  });
});

// ── Delete Account ─────────────────────────────────────────────────────────
const deleteAccount = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  await SettingsService.deleteAccountFromDB(userId);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Account deleted successfully",
  });
});

export const SettingsController = {
  getMySettings,
  updateMySettings,
  deleteAccount,
};
