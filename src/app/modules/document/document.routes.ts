import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DocumentController } from "./document.controller";
import { DocumentValidation } from "./document.validation";

const router = Router();

router.post(
  "/upload",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CONTRACTOR),
  validateRequest(DocumentValidation.createDocumentValidationSchema),
  DocumentController.uploadDocument
);

router.get(
  "/my-assigned",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.LENDER),
  DocumentController.getMyDocuments
);

router.get(
  "/property/:propertyId",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.LENDER),
  DocumentController.getDocumentsByProperty
);

router.get(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.LENDER),
  DocumentController.getSingleDocument
);

router.patch(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(DocumentValidation.updateDocumentValidationSchema),
  DocumentController.updateDocument
);

router.patch(
  "/:id/sign",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSPECTOR, UserRole.CONTRACTOR, UserRole.REALTOR, UserRole.LENDER),
  DocumentController.signDocument
);

router.delete(
  "/:id",
  auth(UserRole.MUNICIPALITY, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  DocumentController.deleteDocument
);

export const DocumentRoutes = router;
