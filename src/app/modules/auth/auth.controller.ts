import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

// ── Register ───────────────────────────────────────────────────────────────
const register = catchAsync(async (req, res) => {
  const { fullName, email, password, profilePic,role } = req.body;

  const result = await AuthService.register({
    fullName,
    email,
    password,
    profilePic,
    role,
  });

  sendResponse(res, {
    statusCode: status.CREATED,
    message: result.message,
  });
});

// ── Verify OTP ─────────────────────────────────────────────────────────────
const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!otp) {
    return res.status(400).json({ message: "OTP is required" });
  }

  const result = await AuthService.verifyOTP(email, otp);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
    data: { accessToken: result.accessToken },
  });
});

// ── Resend Email Verification OTP ──────────────────────────────────────────
const resendEmailVerificationOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const result = await AuthService.resendEmailVerificationOtp(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Login ──────────────────────────────────────────────────────────────────
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.loginUser(email, password);

  const { accessToken, refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "User logged in successfully!",
    data: { accessToken },
  });
});

// ── Change Password ────────────────────────────────────────────────────────
const changePassword = catchAsync(async (req, res) => {
  const email = req.user?.email as string;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  await AuthService.changePassword(email, currentPassword, newPassword, confirmPassword);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Password changed successfully!",
  });
});

// ── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Verify Reset Password OTP ──────────────────────────────────────────────
const verifyResetPasswordOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthService.verifyResetPasswordOTP(email, otp);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Resend Reset Password OTP ──────────────────────────────────────────────
const resendResetPasswordOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const result = await AuthService.resendResetPasswordOtp(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = catchAsync(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  const result = await AuthService.resetPassword(email, newPassword, confirmPassword);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Get Me ─────────────────────────────────────────────────────────────────
const getMe = catchAsync(async (req, res) => {
  const email = req.user?.email as string;

  const result = await AuthService.getMe(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User fetched successfully!",
    data: result,
  });
});

// ── Refresh Token ──────────────────────────────────────────────────────────
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Access token retrieved successfully!",
    data: result,
  });
});

export const AuthController = {
  register,
  verifyOTP,
  resendEmailVerificationOtp,
  login,
  getMe,
  refreshToken,
  resetPassword,
  forgotPassword,
  changePassword,
  verifyResetPasswordOTP,
  resendResetPasswordOtp,
};