import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DocumentController } from "./document.controller";
import { DocumentValidation } from "./document.validation";

const router = Router();

router.post(
  "/upload",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.CONTRACTOR),
  validateRequest(DocumentValidation.createDocumentValidationSchema),
  DocumentController.uploadDocument
);

router.get(
  "/my-assigned",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.SUPER_ADMIN),
  DocumentController.getMyDocuments
);

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.SUPER_ADMIN),
  DocumentController.getDocumentsByProperty
);

router.get(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.SUPER_ADMIN),
  DocumentController.getSingleDocument
);

router.patch(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  validateRequest(DocumentValidation.updateDocumentValidationSchema),
  DocumentController.updateDocument
);

router.patch(
  "/:id/sign",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR),
  DocumentController.signDocument
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.ADMIN),
  DocumentController.deleteDocument
);

export const DocumentRoutes = router;
