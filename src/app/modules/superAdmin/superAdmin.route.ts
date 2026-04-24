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

export const SuperAdminRoutes = router;
