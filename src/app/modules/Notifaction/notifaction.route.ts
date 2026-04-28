import express from "express";
import { NotifactionController } from "./notifaction.contller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/", auth(), NotifactionController.getAllnotification);
router.patch(
  "/read-status/:id",
  auth(),
  NotifactionController.chengeNotificationReadStatus,
);
router.get("/:id", auth(), auth(), NotifactionController.getSingleNotification);

export const NotificationsRoutes = router;
