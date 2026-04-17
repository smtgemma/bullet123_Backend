import { Router } from "express";
import { LegalController } from "./legal.controller";

const router = Router();

router.get("/privacy-policy", LegalController.getPrivacyPolicy);
router.get("/terms-of-service", LegalController.getTermsOfService);

export const LegalRoutes = router;
