import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProgressPhotoController } from "./progressPhoto.controller";
import { ProgressPhotoValidation } from "./progressPhoto.validation";

const router = Router();

router.post(
  "/upload",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.SELLER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER
  ),
  validateRequest(ProgressPhotoValidation.createProgressPhotoValidationSchema),
  ProgressPhotoController.uploadProgressPhoto
);

router.get(
  "/property/:propertyId",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.SELLER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER
  ),
  ProgressPhotoController.getProgressPhotosByProperty
);

router.get(
  "/:id",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.SELLER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER
  ),
  ProgressPhotoController.getSingleProgressPhoto
);

router.patch(
  "/:id",
  auth(
    UserRole.MUNICIPALITY,
    UserRole.SELLER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.REALTOR,
    UserRole.CONTRACTOR,
    UserRole.INSPECTOR,
    UserRole.LENDER,
    UserRole.COMMUNITY_PARTNER
  ),
  ProgressPhotoController.updateProgressPhoto
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ProgressPhotoController.deleteProgressPhoto
);

export const ProgressPhotoRoutes = router;
