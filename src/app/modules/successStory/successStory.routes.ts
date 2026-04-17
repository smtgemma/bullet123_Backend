import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { SuccessStoryController } from "./successStory.controller";
import { SuccessStoryValidation } from "./successStory.validation";

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────
// GET /api/v1/success-stories/stats
router.get("/stats", SuccessStoryController.getPlatformStats);

// GET /api/v1/success-stories/categories
router.get("/categories", SuccessStoryController.getCategories);

// GET /api/v1/success-stories/featured
router.get("/featured", SuccessStoryController.getFeaturedStories);

// GET /api/v1/success-stories?category=COMMERCIAL&searchTerm=&page=1&limit=9
router.get("/", SuccessStoryController.getAllSuccessStories);

// GET /api/v1/success-stories/:id
router.get("/:id", SuccessStoryController.getSingleSuccessStory);

// ── Admin Only Routes ──────────────────────────────────────────────────────
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(SuccessStoryValidation.createSuccessStorySchema),
  SuccessStoryController.createSuccessStory
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(SuccessStoryValidation.updateSuccessStorySchema),
  SuccessStoryController.updateSuccessStory
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  SuccessStoryController.deleteSuccessStory
);

export const SuccessStoryRoutes = router;
