import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

// ── Registration ───────────────────────────────────────────────────────────
router.post("/register", AuthController.register);

router.post("/verify-otp", AuthController.verifyOTP);

router.post("/resend-otp", AuthController.resendEmailVerificationOtp);

// ── Auth ───────────────────────────────────────────────────────────────────
router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.get("/me", auth(), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);

// ── Password ───────────────────────────────────────────────────────────────
router.put(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);



router.post("/verify-reset-password-otp", AuthController.verifyResetPasswordOTP);

router.post("/resend-reset-password-otp", AuthController.resendResetPasswordOtp);

router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;