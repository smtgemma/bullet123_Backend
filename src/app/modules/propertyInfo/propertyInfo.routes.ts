import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PropertyInfoController } from "./propertyInfo.controller";
import { PropertyInfoValidation } from "./propertyInfo.validation";
import { upload } from "../../utils/upload";
import { imageUpload } from "../../config/multer-config";

const router = Router();

router.post(
  "/create",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  imageUpload.array("files", 10),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    // Extract file urls from multer
    if (req.files) {
      const files = req.files as Express.MulterS3.File[];
      req.body.images = files.map((file) => file.location);
    }
    next();
  },
  validateRequest(PropertyInfoValidation.createPropertyInfoValidationSchema),
  PropertyInfoController.createPropertyInfo
);

router.get(
  "/",
  PropertyInfoController.getAllPropertyInfos
);

router.get(
  "/my-properties",
  auth(UserRole.MUNICIPALITY),
  PropertyInfoController.getMyProperties
);

router.get(
  "/:id",
  PropertyInfoController.getSinglePropertyInfo
);

router.patch(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  imageUpload.array("files", 10),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    if (req.files) {
      const files = req.files as Express.MulterS3.File[];
      const newImages = files.map((file) => file.location);
      if (req.body.images) {
        req.body.images = [...req.body.images, ...newImages];
      } else {
        req.body.images = newImages;
      }
    }
    next();
  },
  validateRequest(PropertyInfoValidation.updatePropertyInfoValidationSchema),
  PropertyInfoController.updatePropertyInfo
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PropertyInfoController.deletePropertyInfo
);

router.patch(
  "/:id/assign-staff",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(PropertyInfoValidation.assignStaffValidationSchema),
  PropertyInfoController.assignStaff
);

router.patch(
  "/:id/remove-staff",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  PropertyInfoController.removeStaff
);

export const PropertyInfoRoutes = router;
