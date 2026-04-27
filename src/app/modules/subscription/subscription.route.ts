import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

const router = Router();

router.post(
  "/create-subscription",
  auth(),
  validateRequest(SubscriptionValidation.SubscriptionValidationSchema),
  SubscriptionController.createSubscription
);

router.get(
  "/my-subscription",
  auth(),
  SubscriptionController.getMySubscription
);

router.get("/", auth( ), SubscriptionController.getAllSubscription);

router.get(
  "/:subscriptionId",
  auth(),
  SubscriptionController.getSingleSubscription
);

router.put(
  "/:subscriptionId",
  auth(),
  SubscriptionController.updateSubscription
);

router.delete(
  "/:subscriptionId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SubscriptionController.deleteSubscription
);

router.post(
  "/:subscriptionId/cancel",
  auth(),
  SubscriptionController.cancelSubscription
);

router.post(
  "/:subscriptionId/reactivate",
  auth(),
  SubscriptionController.reactivateSubscription
);

router.post("/stripe/webhook", SubscriptionController.handleStripeWebhook);
router.post(
  '/confirm-payment',
  auth(),
  SubscriptionController.confirmPayment
);

export const SubscriptionRoutes = router;
