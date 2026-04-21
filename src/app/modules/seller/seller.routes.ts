import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SellerController } from "./seller.controller";
import { SellerValidation } from "./seller.validation";

const router = Router();

// ── Protected routes ───────────────────────────────────────────────────────

// Get my seller profile (SELLER only)
router.get(
  "/me/profile",
  auth(UserRole.SELLER),
  SellerController.getMySellerProfile
);

router.get(
  "/dashboard-stats",
  auth(UserRole.SELLER),
  SellerController.getSellerDashboardStats
);

router.get(
  "/my-staffs",
  auth(UserRole.SELLER),
  SellerController.getMyStaffs
);

router.get(
  "/staffs/:id",
  auth(UserRole.SELLER),
  SellerController.getSingleStaff
);

// Update my seller profile (SELLER only)
router.patch(
  "/me/update",
  auth(UserRole.SELLER),
  validateRequest(SellerValidation.updateSellerSchema),
  SellerController.updateSeller
);

// ── Generic / Admin routes ──────────────────────────────────────────────────

// Get all sellers (public)
router.get("/", SellerController.getAllSellers);

// Get single seller by ID (public)
router.get("/:id", SellerController.getSingleSeller);

// Delete a seller (ADMIN / SUPER_ADMIN only)
router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SellerController.deleteSeller
);

export const SellerRoutes = router;
