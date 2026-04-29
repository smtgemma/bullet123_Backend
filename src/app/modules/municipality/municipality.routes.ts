import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { MunicipalityController } from "./municipality.controller";
import { MunicipalityValidation } from "./municipality.validation";

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────

// Get all municipalities (public)
router.get("/", MunicipalityController.getAllMunicipalities);

// ── Protected routes ───────────────────────────────────────────────────────

// Get my municipality profile (MUNICIPALITY only)
router.get(
  "/me/profile",
  auth(UserRole.MUNICIPALITY),
  MunicipalityController.getMyMunicipalityProfile
);

router.get(
  "/my-staffs",
  auth(UserRole.MUNICIPALITY),
  MunicipalityController.getMyStaffs
);

router.get(
  "/my-professionals",
  auth(UserRole.MUNICIPALITY),
  MunicipalityController.getMyProfessionals
);

router.get(
  "/staffs/:id",
  auth(UserRole.MUNICIPALITY),
  MunicipalityController.getSingleStaff
);

// Get single municipality by ID (public)
router.get("/:id", MunicipalityController.getSingleMunicipality);

// Update my municipality profile (MUNICIPALITY only)
router.patch(
  "/me/update",
  auth(UserRole.MUNICIPALITY),
  validateRequest(MunicipalityValidation.updateMunicipalitySchema),
  MunicipalityController.updateMunicipality
);

// Delete a municipality (ADMIN / SUPER_ADMIN only)
router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  MunicipalityController.deleteMunicipality
);

export const MunicipalityRoutes = router;
