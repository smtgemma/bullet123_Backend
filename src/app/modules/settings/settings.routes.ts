import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SettingsController } from "./settings.controller";
import { SettingsValidation } from "./settings.validation";

const router = Router();

// All settings routes require authentication
// GET /api/v1/settings
router.get("/", auth(), SettingsController.getMySettings);

// PATCH /api/v1/settings
router.patch(
  "/",
  auth(),
  validateRequest(SettingsValidation.updateSettingsSchema),
  SettingsController.updateMySettings
);

// DELETE /api/v1/settings/delete-account
router.delete("/delete-account", auth(), SettingsController.deleteAccount);

export const SettingsRoutes = router;
