import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { MessageController } from "./message.controller";

const router = Router();

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.SUPER_ADMIN),
  MessageController.getMessagesByProperty
);

export const MessageRoutes = router;
