import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

const router = Router();

router.post(
  "/create-subscription",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(SubscriptionValidation.SubscriptionValidationSchema),
  SubscriptionController.createSubscription
);

router.get(
  "/my-subscription",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionController.getMySubscription
);

router.get("/", auth( UserRole.ADMIN,UserRole.SUPER_ADMIN), SubscriptionController.getAllSubscription);

router.get(
  "/:subscriptionId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SubscriptionController.getSingleSubscription
);

router.put(
  "/:subscriptionId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SubscriptionController.updateSubscription
);

router.delete(
  "/:subscriptionId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SubscriptionController.deleteSubscription
);

router.post(
  "/:subscriptionId/cancel",
  auth(UserRole.USER),
  SubscriptionController.cancelSubscription
);

router.post(
  "/:subscriptionId/reactivate",
  auth(UserRole.USER),
  SubscriptionController.reactivateSubscription
);

router.post("/stripe/webhook", SubscriptionController.handleStripeWebhook);
router.post(
  '/confirm-payment',
  auth(),
  SubscriptionController.confirmPayment
);

export const SubscriptionRoutes = router;
