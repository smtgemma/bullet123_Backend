import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { MessageController } from "./message.controller";

const router = Router();

router.post(
  "/send",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER,
    UserRole.BUYER,
    UserRole.SELLER,
    UserRole.SUPER_ADMIN
  ),
  MessageController.sendMessage
);

router.get(
  "/my-conversations",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER,
    UserRole.BUYER,
    UserRole.SELLER,
    UserRole.SUPER_ADMIN
  ),
  MessageController.getMyConversations
);

router.get(
  "/property/:propertyId",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER,
    UserRole.BUYER,
    UserRole.SELLER,
    UserRole.SUPER_ADMIN
  ),
  MessageController.getMessagesByProperty
);

router.get(
  "/conversation/:targetUserId",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER,
    UserRole.BUYER,
    UserRole.SELLER,
    UserRole.SUPER_ADMIN
  ),
  MessageController.getConversationWithUser
);

export const MessageRoutes = router;
