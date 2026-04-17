import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { TaskController } from "./task.controller";
import { TaskValidation } from "./task.validation";

const router = Router();

router.post(
  "/create",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  validateRequest(TaskValidation.createTaskValidationSchema),
  TaskController.createTask
);

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR),
  TaskController.getTasksByProperty
);

router.patch(
  "/:id/status",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR),
  validateRequest(TaskValidation.updateTaskStatusValidationSchema),
  TaskController.updateTaskStatus
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  TaskController.deleteTask
);

export const TaskRoutes = router;
