import { Router } from "express";
import { meetingController } from "./meeting.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/create",
  auth(),
  meetingController.createmeeting
);

router.get(
  "/",
  auth(UserRole.ADMIN),
  meetingController.getAllmeetings
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.USER),
  meetingController.getSinglemeeting
);

router.put(
  "/:id",
  auth(UserRole.ADMIN),
  meetingController.updatemeeting
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  meetingController.deletemeeting
);

export const meetingRoutes = router;