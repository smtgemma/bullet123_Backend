import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { BudgetController } from "./budget.controller";
import { BudgetValidation } from "./budget.validation";

const router = Router();

router.post(
  "/create",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BudgetValidation.createBudgetValidationSchema),
  BudgetController.createBudget
);

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.INSPECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BudgetController.getBudgetsByProperty
);

router.get(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.INSPECTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BudgetController.getSingleBudget
);

router.patch(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(BudgetValidation.updateBudgetValidationSchema),
  BudgetController.updateBudget
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BudgetController.deleteBudget
);

export const BudgetRoutes = router;
