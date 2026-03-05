

import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { subscriberController } from "./subscrober.contller";
import express from "express";

const router = express.Router();

router.post(
  "/create-subscriber",
  (req, res, next) => {
    try {
      if (typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  subscriberController.createSubscriber
);



router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.getAllSubscribers
);


router.get(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.getSubscriberById
);


router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.updateSubscriber
);



router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.deleteSubscriber
);



router.patch(
  "/:id/block",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.blockSubscriber
);


router.patch(
  "/bulk/status",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.bulkUpdateSubscriberStatus
);

router.post(
  "/send-promotion-email",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.sendPromotion
);

router.post(
  "/admin/send/promotion-email",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  subscriberController.sendPromotionForSubscrober
);


router.post(
  "/send/single-email",
  auth(),
  subscriberController.sendSingleEmail
);

router.delete(
  "/bulk/delete",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  subscriberController.bulkDeleteSubscriber
);

router.patch(
  "/bulk/block/admin",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  subscriberController.bulkBlockSubscriber
);

export const subscriberRoutes = router;