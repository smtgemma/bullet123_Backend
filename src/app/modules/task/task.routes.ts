import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { TaskValidation } from "./task.validation";

const router = Router();

router.post(
  "/create",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(TaskValidation.createTaskValidationSchema),
  TaskController.createTask
);

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.INSPECTOR, UserRole.LENDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TaskController.getTasksByProperty
);

router.patch(
  "/:id/status",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSPECTOR),
  validateRequest(TaskValidation.updateTaskStatusValidationSchema),
  TaskController.updateTaskStatus
);

router.patch(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(TaskValidation.updateTaskValidationSchema),
  TaskController.updateTask
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TaskController.deleteTask
);

router.get(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.INSPECTOR, UserRole.LENDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TaskController.getSingleTask
);

router.patch(
  "/:id/add-assignees",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(TaskValidation.addAssigneesValidationSchema),
  TaskController.addAssignees
);

router.patch(
  "/:id/remove-assignee",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.COMMUNITY_PARTNER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TaskController.removeAssignee
);

export const TaskRoutes = router;
