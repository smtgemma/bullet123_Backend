import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";


const router = Router();


router.post('/register-user',AuthController.otpGenerate
)

router.post('/verify-otp',AuthController.otpVerify
)

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);
router.put(
  "/change-password",
  auth(UserRole.USER, UserRole.ADMIN,UserRole.SUPER_ADMIN),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

router.post("/reset-password", AuthController.resetPassword);

router.post(
  "/verify-reset-password-otp",
  AuthController.verifyResetPasswordOTP
);

router.get("/me", auth(), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);

export const AuthRoutes = router;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         