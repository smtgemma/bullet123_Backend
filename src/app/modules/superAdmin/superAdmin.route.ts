import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { SuperAdminController } from "./superAdmin.controller";

const router = Router();

router.get(
   "/dashboard-stats",
   auth(UserRole.SUPER_ADMIN),
   SuperAdminController.getDashboardStats,
);

router.get(
   "/recent-activities",
   auth(UserRole.SUPER_ADMIN),
   SuperAdminController.getRecentActivities,
);

router.patch(
   "/users/:id/update-blocked",
   auth(UserRole.SUPER_ADMIN),
   SuperAdminController.updateUserBlocked,
);

router.get(
  "/compliance-logs",
  auth(UserRole.SUPER_ADMIN),
  SuperAdminController.getComplianceLogs
);

// --- Community Control ---

router.get(
  "/community/posts",
  auth(UserRole.SUPER_ADMIN),
  SuperAdminController.getAllCommunityPosts
);

router.delete(
  "/community/posts/:id",
  auth(UserRole.SUPER_ADMIN),
  SuperAdminController.deleteCommunityPost
);

router.delete(
  "/community/answers/:id",
  auth(UserRole.SUPER_ADMIN),
  SuperAdminController.deleteCommunityAnswer
);

export const SuperAdminRoutes = router;
