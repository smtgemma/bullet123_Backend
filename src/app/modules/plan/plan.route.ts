import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { PlanController } from "./plan.controller";

const router = Router();

router.get("/featured",auth(UserRole.ADMIN,UserRole.SUPER_ADMIN), PlanController.getAllFeaturedItems);
router.get("/", PlanController.getAllPlans);
router.get("/free", PlanController.getFreePlans);
router.get("/premium", PlanController.getPremiumPlans);
router.get("/gold", PlanController.getGoldPlans);
router.get("/by-type", PlanController.getPlansByType); 
router.get("/:planId", PlanController.getPlanById);


router.post(
  "/create-plan",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PlanController.createPlan
);

router.patch(
  "/:planId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PlanController.updatePlan
);

router.delete(
  "/:planId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PlanController.deletePlan
);

router.patch("/:planId/discount",auth(UserRole.ADMIN,UserRole.SUPER_ADMIN), PlanController.setDiscount);
router.put("/:planId/discount", auth(UserRole.ADMIN,UserRole.SUPER_ADMIN), PlanController.updateDiscount); 
router.delete("/:planId/discount", auth(UserRole.ADMIN,UserRole.SUPER_ADMIN), PlanController.removeDiscount);

export const PlanRoutes = router;